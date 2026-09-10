/**
 * Student Repository
 * Neo4j queries for student profile, academic data, and validation.
 * All parameters are safe — no client data interpolated into Cypher strings.
 */

const { driver } = require('../config/neo4j');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

// ─── Validation Queries (used during registration) ────────────────────────────

/**
 * Validates the full academic hierarchy for student registration:
 * Department → Course → Batch → ClassSection
 * Returns null if hierarchy is valid, or an error string if not.
 */
const validateRegistrationHierarchy = async ({ departmentId, courseId, batchId, sectionId }) => {
  const session = driver.session({ database: DB });
  try {
    // Department exists
    const deptRes = await session.run(
      `MATCH (d:Department { departmentId: $departmentId }) RETURN d LIMIT 1`,
      { departmentId }
    );
    if (!deptRes.records.length) return 'Department does not exist.';

    // Course exists and belongs to Department
    const courseRes = await session.run(
      `
      MATCH (d:Department { departmentId: $departmentId })-[:OFFERS]->(c:Course { courseId: $courseId })
      RETURN c LIMIT 1
      `,
      { courseId, departmentId }
    );
    if (!courseRes.records.length) return 'Course does not exist or does not belong to the specified department.';

    // Batch exists and belongs to Course
    const batchRes = await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })-[:FOR_COURSE]->(c:Course { courseId: $courseId })
      RETURN b LIMIT 1
      `,
      { batchId, courseId }
    );
    if (!batchRes.records.length) return 'Batch does not exist or does not belong to the specified course.';

    // Section exists, belongs to Batch, and is active
    const sectionRes = await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })-[:HAS_SECTION]->(cs:ClassSection { sectionId: $sectionId })
      WHERE cs.isActive = true
      RETURN cs LIMIT 1
      `,
      { batchId, sectionId }
    );
    if (!sectionRes.records.length) return 'ClassSection does not exist, does not belong to the specified batch, or is inactive.';

    return null; // valid
  } finally {
    await session.close();
  }
};

// ─── Profile Queries ──────────────────────────────────────────────────────────

/**
 * Gets the full student profile for /students/me
 */
const getStudentProfile = async (studentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (s:Student { studentId: $studentId })
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(s)
      OPTIONAL MATCH (s)-[:BELONGS_TO]->(b:Batch)-[:ASSOCIATED_WITH]->(d:Department)
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(c:Course)
      OPTIONAL MATCH (s)-[:MEMBER_OF]->(cs:ClassSection)
      OPTIONAL MATCH (s)-[:CURRENTLY_IN]->(sem:AcademicSemester)
      RETURN
        s   AS student,
        u.userId   AS userId,
        u.username AS username,
        u.email    AS email,
        u.fullName AS fullName,
        u.phone    AS phone,
        b AS batch,
        d AS department,
        c AS course,
        cs AS section,
        sem AS semester
      LIMIT 1
      `,
      { studentId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      student:    r.get('student')?.properties ?? null,
      userId:     r.get('userId'),
      username:   r.get('username'),
      email:      r.get('email'),
      fullName:   r.get('fullName'),
      phone:      r.get('phone'),
      batch:      r.get('batch')?.properties ?? null,
      department: r.get('department')?.properties ?? null,
      course:     r.get('course')?.properties ?? null,
      section:    r.get('section')?.properties ?? null,
      semester:   r.get('semester')?.properties ?? null,
    };
  } finally {
    await session.close();
  }
};

/**
 * Gets studentId from userId (used for /me resolution).
 */
const getStudentIdByUserId = async (userId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (u:User { userId: $userId })-[:HAS_PROFILE]->(s:Student) RETURN s.studentId AS studentId`,
      { userId }
    );
    return res.records[0]?.get('studentId') ?? null;
  } finally {
    await session.close();
  }
};

/**
 * Gets a student's timetable via their ClassSection.
 */
const getStudentTimetable = async (studentId, dayOfWeek) => {
  const session = driver.session({ database: DB });
  try {
    const cypher = dayOfWeek
      ? `
        MATCH (s:Student { studentId: $studentId })-[:MEMBER_OF]->(cs:ClassSection)<-[:FOR_SECTION]-(te:TimetableEntry)
        WHERE te.dayOfWeek = $dayOfWeek AND te.status = 'ACTIVE'
        OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
        OPTIONAL MATCH (te)-[:TAUGHT_BY]->(f:Faculty)
        OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
        OPTIONAL MATCH (te)-[:HELD_IN]->(r:Room)
        OPTIONAL MATCH (te)-[:OCCURS_AT]->(ts:TimeSlot)
        RETURN te, sub, f, u AS facultyUser, r, ts
        ORDER BY te.dayOfWeek, ts.periodNumber ASC
        `
      : `
        MATCH (s:Student { studentId: $studentId })-[:MEMBER_OF]->(cs:ClassSection)<-[:FOR_SECTION]-(te:TimetableEntry)
        WHERE te.status = 'ACTIVE'
        OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
        OPTIONAL MATCH (te)-[:TAUGHT_BY]->(f:Faculty)
        OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
        OPTIONAL MATCH (te)-[:HELD_IN]->(r:Room)
        OPTIONAL MATCH (te)-[:OCCURS_AT]->(ts:TimeSlot)
        RETURN te, sub, f, u AS facultyUser, r, ts
        ORDER BY te.dayOfWeek, ts.periodNumber ASC
        `;
    const res = await session.run(cypher, { studentId, dayOfWeek: dayOfWeek || null });
    return res.records.map((rec) => ({
      timetableEntry: rec.get('te')?.properties ?? null,
      subject:        rec.get('sub')?.properties ?? null,
      faculty:        rec.get('f')?.properties ?? null,
      facultyName:    rec.get('facultyUser')?.properties?.fullName ?? null,
      room:           rec.get('r')?.properties ?? null,
      timeSlot:       rec.get('ts')?.properties ?? null,
    }));
  } finally {
    await session.close();
  }
};

/**
 * Gets a student's exam results.
 */
const getStudentResults = async (studentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (s:Student { studentId: $studentId })-[:HAS_RESULT]->(r:Result)
      OPTIONAL MATCH (r)-[:FOR_EXAM]->(e:Examination)
      OPTIONAL MATCH (r)-[:FOR_SUBJECT]->(sub:Subject)
      OPTIONAL MATCH (e)<-[:HAS_EXAM]-(es:ExaminationSession)
      RETURN r, e, sub, es
      ORDER BY es.startDate DESC
      `,
      { studentId }
    );
    return res.records.map((rec) => ({
      result:           rec.get('r')?.properties ?? null,
      examination:      rec.get('e')?.properties ?? null,
      subject:          rec.get('sub')?.properties ?? null,
      examSession:      rec.get('es')?.properties ?? null,
    }));
  } finally {
    await session.close();
  }
};

/**
 * Gets subjects the student studies (via STUDIES derived edge).
 */
const getStudentSubjects = async (studentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (s:Student { studentId: $studentId })-[:STUDIES]->(sub:Subject)
      RETURN sub ORDER BY sub.subjectCode
      `,
      { studentId }
    );
    return res.records.map((r) => r.get('sub')?.properties ?? null);
  } finally {
    await session.close();
  }
};

/**
 * Updates only permitted personal fields of a student's User record.
 */
const updateStudentPersonalInfo = async (userId, allowedFields) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `
      MATCH (u:User { userId: $userId })
      SET u.phone = COALESCE($phone, u.phone),
          u.addressLine1 = COALESCE($addressLine1, u.addressLine1),
          u.city = COALESCE($city, u.city),
          u.state = COALESCE($state, u.state),
          u.updatedAt = datetime()
      `,
      { userId, ...allowedFields }
    );
  } finally {
    await session.close();
  }
};

/**
 * Gets all students (admin use).
 */
const getAllStudents = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (s:Student)
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(s)
      OPTIONAL MATCH (s)-[:BELONGS_TO]->(b:Batch)
      OPTIONAL MATCH (s)-[:MEMBER_OF]->(cs:ClassSection)
      RETURN s, u.fullName AS fullName, u.email AS email, b.batchName AS batch, cs.displayName AS section
      ORDER BY s.studentId
      `
    );
    return res.records.map((r) => ({
      ...r.get('s').properties,
      fullName: r.get('fullName'),
      email:    r.get('email'),
      batch:    r.get('batch'),
      section:  r.get('section'),
    }));
  } finally {
    await session.close();
  }
};

module.exports = {
  validateRegistrationHierarchy,
  getStudentProfile,
  getStudentIdByUserId,
  getStudentTimetable,
  getStudentResults,
  getStudentSubjects,
  updateStudentPersonalInfo,
  getAllStudents,
};
