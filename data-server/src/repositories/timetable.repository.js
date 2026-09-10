/**
 * Timetable Repository
 *
 * Contains Cypher queries for the timetable graph domain:
 * TimeSlot, Room, TimetableEntry
 *
 * No business logic — that belongs in services.
 *
 * Architecture: Route → Controller → Service → Repository → Neo4j
 */

const { driver } = require('../config/neo4j');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

// ============================================================
// TIME SLOT
// ============================================================

/**
 * Create or merge a TimeSlot node.
 * @param {object} data  { timeSlotId, periodNumber, name, startTime, endTime, durationMinutes, status }
 */
const createTimeSlot = async (data) => {
  const session = driver.session({ database: DB });
  try {
    const result = await session.run(
      `
      MERGE (ts:TimeSlot { timeSlotId: $timeSlotId })
      ON CREATE SET
        ts.periodNumber    = $periodNumber,
        ts.name            = $name,
        ts.startTime       = $startTime,
        ts.endTime         = $endTime,
        ts.durationMinutes = $durationMinutes,
        ts.status          = $status
      RETURN ts
      `,
      data
    );
    return result.records[0]?.get('ts').properties ?? null;
  } finally {
    await session.close();
  }
};

/**
 * Get all active TimeSlots ordered by period number.
 */
const getAllTimeSlots = async () => {
  const session = driver.session({ database: DB });
  try {
    const result = await session.run(
      `MATCH (ts:TimeSlot) RETURN ts ORDER BY ts.periodNumber ASC`
    );
    return result.records.map((rec) => rec.get('ts').properties);
  } finally {
    await session.close();
  }
};

// ============================================================
// ROOM
// ============================================================

/**
 * Create or merge a Room node.
 * Allowed roomType: CLASSROOM, LAB, SEMINAR_HALL, AUDITORIUM, OTHER
 * @param {object} data  { roomId, roomNumber, building, floor, roomType, capacity, location, status }
 */
const createRoom = async (data) => {
  const session = driver.session({ database: DB });
  try {
    const result = await session.run(
      `
      MERGE (r:Room { roomId: $roomId })
      ON CREATE SET
        r.roomNumber = $roomNumber,
        r.building   = $building,
        r.floor      = $floor,
        r.roomType   = $roomType,
        r.capacity   = $capacity,
        r.location   = $location,
        r.status     = $status
      RETURN r
      `,
      data
    );
    return result.records[0]?.get('r').properties ?? null;
  } finally {
    await session.close();
  }
};

/**
 * Get timetable for a room on a given day.
 * Traversal: Room ← HELD_IN ← TimetableEntry → Subject, Faculty, Batch, TimeSlot
 *
 * @param {string} roomId
 * @param {string} dayOfWeek e.g. 'MONDAY'
 */
const getRoomTimetable = async (roomId, dayOfWeek) => {
  const session = driver.session({ database: DB });
  try {
    const cypher = `
      MATCH (te:TimetableEntry)-[:HELD_IN]->(r:Room { roomId: $roomId })
      WHERE te.dayOfWeek = $dayOfWeek AND te.status = 'ACTIVE'

      OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
      OPTIONAL MATCH (te)-[:TAUGHT_BY]->(f:Faculty)
      OPTIONAL MATCH (te)-[:FOR_BATCH]->(b:Batch)
      OPTIONAL MATCH (te)-[:OCCURS_AT]->(ts:TimeSlot)

      RETURN
        te   AS timetableEntry,
        sub  AS subject,
        f    AS faculty,
        b    AS batch,
        ts   AS timeSlot
      ORDER BY ts.periodNumber ASC
    `;
    const result = await session.run(cypher, { roomId, dayOfWeek });
    return result.records.map((rec) => ({
      timetableEntry: rec.get('timetableEntry')?.properties ?? null,
      subject:        rec.get('subject')?.properties ?? null,
      faculty:        rec.get('faculty')?.properties ?? null,
      batch:          rec.get('batch')?.properties ?? null,
      timeSlot:       rec.get('timeSlot')?.properties ?? null,
    }));
  } finally {
    await session.close();
  }
};

// ============================================================
// TIMETABLE ENTRY
// ============================================================

/**
 * Create a TimetableEntry and link it to all required academic entities.
 * Uses a transaction to ensure atomicity — no half-created entries.
 *
 * Allowed classType: THEORY, LAB, TUTORIAL, PROJECT, SEMINAR, OTHER
 *
 * @param {object} entryData  TimetableEntry properties
 * @param {object} refs       { batchId, courseId, academicSemesterId, subjectId, facultyId, timeSlotId, roomId, academicYearId, termId }
 */
const createTimetableEntry = async (entryData, refs) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();

  try {
    // Create the TimetableEntry node
    const createResult = await txc.run(
      `
      CREATE (te:TimetableEntry {
        timetableEntryId: $timetableEntryId,
        dayOfWeek:        $dayOfWeek,
        periodNumber:     $periodNumber,
        startTime:        $startTime,
        endTime:          $endTime,
        classType:        $classType,
        effectiveFrom:    $effectiveFrom,
        effectiveTo:      $effectiveTo,
        status:           $status,
        createdAt:        $createdAt,
        updatedAt:        $updatedAt
      })
      RETURN te
      `,
      entryData
    );

    const te = createResult.records[0]?.get('te').properties;
    if (!te) throw new Error('Failed to create TimetableEntry node.');

    const teId = te.timetableEntryId;

    // Link to Batch (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (b:Batch { batchId: $batchId })
      MERGE (te)-[:FOR_BATCH]->(b)
      `,
      { teId, batchId: refs.batchId }
    );

    // Link to Course (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (c:Course { courseId: $courseId })
      MERGE (te)-[:FOR_COURSE]->(c)
      `,
      { teId, courseId: refs.courseId }
    );

    // Link to AcademicSemester (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (sem:AcademicSemester { academicSemesterId: $academicSemesterId })
      MERGE (te)-[:FOR_SEMESTER]->(sem)
      `,
      { teId, academicSemesterId: refs.academicSemesterId }
    );

    // Link to Subject (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (sub:Subject { subjectId: $subjectId })
      MERGE (te)-[:FOR_SUBJECT]->(sub)
      `,
      { teId, subjectId: refs.subjectId }
    );

    // Link to Faculty (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (f:Faculty { facultyId: $facultyId })
      MERGE (te)-[:TAUGHT_BY]->(f)
      `,
      { teId, facultyId: refs.facultyId }
    );

    // Link to TimeSlot (required)
    await txc.run(
      `
      MATCH (te:TimetableEntry { timetableEntryId: $teId })
      MATCH (ts:TimeSlot { timeSlotId: $timeSlotId })
      MERGE (te)-[:OCCURS_AT]->(ts)
      `,
      { teId, timeSlotId: refs.timeSlotId }
    );

    // Link to Room (optional but recommended)
    if (refs.roomId) {
      await txc.run(
        `
        MATCH (te:TimetableEntry { timetableEntryId: $teId })
        MATCH (r:Room { roomId: $roomId })
        MERGE (te)-[:HELD_IN]->(r)
        `,
        { teId, roomId: refs.roomId }
      );
    }

    // Link to AcademicYear
    if (refs.academicYearId) {
      await txc.run(
        `
        MATCH (te:TimetableEntry { timetableEntryId: $teId })
        MATCH (ay:AcademicYear { academicYearId: $academicYearId })
        MERGE (te)-[:IN_ACADEMIC_YEAR]->(ay)
        `,
        { teId, academicYearId: refs.academicYearId }
      );
    }

    // Link to Term
    if (refs.termId) {
      await txc.run(
        `
        MATCH (te:TimetableEntry { timetableEntryId: $teId })
        MATCH (t:Term { termId: $termId })
        MERGE (te)-[:IN_TERM]->(t)
        `,
        { teId, termId: refs.termId }
      );
    }

    await txc.commit();
    return te;
  } catch (err) {
    await txc.rollback();
    throw err;
  } finally {
    await session.close();
  }
};

/**
 * Get a batch's complete timetable for a day.
 * @param {string} batchId
 * @param {string} dayOfWeek
 */
const getTimetableByBatch = async (batchId, dayOfWeek) => {
  const session = driver.session({ database: DB });
  try {
    const cypher = `
      MATCH (te:TimetableEntry)-[:FOR_BATCH]->(b:Batch { batchId: $batchId })
      WHERE te.dayOfWeek = $dayOfWeek AND te.status = 'ACTIVE'

      OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
      OPTIONAL MATCH (te)-[:TAUGHT_BY]->(f:Faculty)
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (te)-[:HELD_IN]->(r:Room)
      OPTIONAL MATCH (te)-[:OCCURS_AT]->(ts:TimeSlot)

      RETURN
        te   AS timetableEntry,
        sub  AS subject,
        f    AS faculty,
        u    AS facultyUser,
        r    AS room,
        ts   AS timeSlot
      ORDER BY ts.periodNumber ASC
    `;
    const result = await session.run(cypher, { batchId, dayOfWeek });
    return result.records.map((rec) => ({
      timetableEntry: rec.get('timetableEntry')?.properties ?? null,
      subject:        rec.get('subject')?.properties ?? null,
      faculty:        rec.get('faculty')?.properties ?? null,
      facultyUser:    rec.get('facultyUser')?.properties ?? null,
      room:           rec.get('room')?.properties ?? null,
      timeSlot:       rec.get('timeSlot')?.properties ?? null,
    }));
  } finally {
    await session.close();
  }
};

/**
 * Get all timetable entries for a faculty member on a given day.
 * @param {string} facultyId
 * @param {string} dayOfWeek
 */
const getTimetableByFaculty = async (facultyId, dayOfWeek) => {
  const session = driver.session({ database: DB });
  try {
    const cypher = `
      MATCH (te:TimetableEntry)-[:TAUGHT_BY]->(f:Faculty { facultyId: $facultyId })
      WHERE te.dayOfWeek = $dayOfWeek AND te.status = 'ACTIVE'

      OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
      OPTIONAL MATCH (te)-[:FOR_BATCH]->(b:Batch)
      OPTIONAL MATCH (te)-[:HELD_IN]->(r:Room)
      OPTIONAL MATCH (te)-[:OCCURS_AT]->(ts:TimeSlot)

      RETURN
        te   AS timetableEntry,
        sub  AS subject,
        b    AS batch,
        r    AS room,
        ts   AS timeSlot
      ORDER BY ts.periodNumber ASC
    `;
    const result = await session.run(cypher, { facultyId, dayOfWeek });
    return result.records.map((rec) => ({
      timetableEntry: rec.get('timetableEntry')?.properties ?? null,
      subject:        rec.get('subject')?.properties ?? null,
      batch:          rec.get('batch')?.properties ?? null,
      room:           rec.get('room')?.properties ?? null,
      timeSlot:       rec.get('timeSlot')?.properties ?? null,
    }));
  } finally {
    await session.close();
  }
};

module.exports = {
  createTimeSlot,
  getAllTimeSlots,
  createRoom,
  getRoomTimetable,
  createTimetableEntry,
  getTimetableByBatch,
  getTimetableByFaculty,
};
