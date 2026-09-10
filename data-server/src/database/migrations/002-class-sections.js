/**
 * Versioned Migration 002: ClassSection Support
 *
 * Introduces ClassSection nodes and operational relationships:
 * 1. (Batch)-[:HAS_SECTION]->(ClassSection)
 * 2. (Student)-[:MEMBER_OF]->(ClassSection)
 * 3. (ClassSection)-[:HAS_ADVISOR]->(Faculty) (Conditional if advisor source data exists)
 * 4. (TimetableEntry)-[:FOR_SECTION]->(ClassSection)
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const MIGRATION_META = {
  migrationId: '002-class-sections',
  version: 2,
  name: 'class-sections',
};

const SEED_DIR = path.resolve(__dirname, '../../utils/seed');

const up = async (session) => {
  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Running ClassSection migration...`);

  // Ensure ClassSection constraint exists
  await session.run(`
    CREATE CONSTRAINT constraint_classsection_sectionid IF NOT EXISTS
    FOR (cs:ClassSection) REQUIRE cs.sectionId IS UNIQUE
  `);

  // Read class_sections.csv
  const csvPath = path.join(SEED_DIR, 'class_sections.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`[MIGRATION ERROR] Missing file: ${csvPath}`);
  }

  const sections = parse(fs.readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // 1. Merge ClassSection nodes and Batch -> HAS_SECTION relationships
  let sectionsCreated = 0;
  let advisorLinksCreated = 0;

  for (const row of sections) {
    await session.run(
      `
      MERGE (cs:ClassSection { sectionId: $sectionId })
      ON CREATE SET cs.createdAt = datetime()
      SET
        cs.sectionCode        = $sectionCode,
        cs.sectionName        = $sectionName,
        cs.displayName        = $displayName,
        cs.batchId            = $batchId,
        cs.courseId           = $courseId,
        cs.departmentId       = $departmentId,
        cs.academicYearId     = $academicYearId,
        cs.academicSemesterId = $academicSemesterId,
        cs.capacity           = toInteger($capacity),
        cs.isActive           = ($isActive = 'true' OR $isActive = true),
        cs.updatedAt          = datetime()
      WITH cs, $batchId AS batchId
      MATCH (b:Batch { batchId: batchId })
      MERGE (b)-[:HAS_SECTION]->(cs)
      `,
      row
    );
    sectionsCreated++;

    // HAS_ADVISOR (Conditional)
    if (row.advisorFacultyId && row.advisorFacultyId.trim()) {
      const advRes = await session.run(
        `
        MATCH (cs:ClassSection { sectionId: $sectionId })
        MATCH (f:Faculty { facultyId: $facultyId })
        MERGE (cs)-[r:HAS_ADVISOR]->(f)
        ON CREATE SET r.source = "DIRECT_ASSIGNMENT", r.derivedAt = datetime()
        RETURN count(r) AS cnt
        `,
        { sectionId: row.sectionId, facultyId: row.advisorFacultyId.trim() }
      );
      advisorLinksCreated += advRes.records[0].get('cnt').toNumber();
    } else {
      console.log(`[MIGRATION ${MIGRATION_META.migrationId}] MISSING ADVISOR SOURCE DATA for Section ${row.sectionId} (${row.sectionCode})`);
    }
  }

  // 2. Merge Student -> MEMBER_OF -> ClassSection
  const studentsPath = path.join(SEED_DIR, 'students.csv');
  const students = parse(fs.readFileSync(studentsPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let memberOfCreated = 0;
  for (const row of students) {
    if (row.sectionId && row.sectionId.trim()) {
      const memRes = await session.run(
        `
        MATCH (s:Student { studentId: $studentId })
        MATCH (cs:ClassSection { sectionId: $sectionId })
        MERGE (s)-[r:MEMBER_OF]->(cs)
        ON CREATE SET r.source = "ENROLLED_SECTION", r.derivedAt = datetime()
        RETURN count(r) AS cnt
        `,
        { studentId: row.studentId, sectionId: row.sectionId.trim() }
      );
      memberOfCreated += memRes.records[0].get('cnt').toNumber();
    }
  }

  // 3. Merge TimetableEntry -> FOR_SECTION -> ClassSection
  const ttPath = path.join(SEED_DIR, 'timetable_entries.csv');
  const ttEntries = parse(fs.readFileSync(ttPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let forSectionCreated = 0;
  for (const row of ttEntries) {
    if (row.sectionId && row.sectionId.trim()) {
      const ttRes = await session.run(
        `
        MATCH (te:TimetableEntry { timetableEntryId: $ttId })
        MATCH (cs:ClassSection { sectionId: $sectionId })
        MERGE (te)-[r:FOR_SECTION]->(cs)
        ON CREATE SET r.source = "SCHEDULED_SECTION", r.derivedAt = datetime()
        RETURN count(r) AS cnt
        `,
        { ttId: row.timetableEntryId, sectionId: row.sectionId.trim() }
      );
      forSectionCreated += ttRes.records[0].get('cnt').toNumber();
    }
  }

  // 4. CONSISTENCY VALIDATION
  // Student -> MEMBER_OF -> ClassSection -> HAS_SECTION <- Batch vs Student -> BELONGS_TO -> Batch
  const stdBatchMismatch = await session.run(`
    MATCH (s:Student)-[:MEMBER_OF]->(cs:ClassSection)<-[:HAS_SECTION]-(sectionBatch:Batch)
    MATCH (s)-[:BELONGS_TO]->(studentBatch:Batch)
    WHERE sectionBatch.batchId <> studentBatch.batchId
    RETURN s.studentId AS studentId, sectionBatch.batchId AS secBatch, studentBatch.batchId AS stdBatch
  `);

  if (stdBatchMismatch.records.length > 0) {
    throw new Error(
      `[MIGRATION ERROR] Student Section-Batch consistency violation detected for: ` +
      stdBatchMismatch.records.map((r) => r.get('studentId')).join(', ')
    );
  }

  // TimetableEntry -> FOR_SECTION -> ClassSection -> HAS_SECTION <- Batch vs TimetableEntry -> FOR_BATCH -> Batch
  const ttBatchMismatch = await session.run(`
    MATCH (te:TimetableEntry)-[:FOR_SECTION]->(cs:ClassSection)<-[:HAS_SECTION]-(secBatch:Batch)
    MATCH (te)-[:FOR_BATCH]->(directBatch:Batch)
    WHERE secBatch.batchId <> directBatch.batchId
    RETURN te.timetableEntryId AS ttId, secBatch.batchId AS secBatch, directBatch.batchId AS directBatch
  `);

  if (ttBatchMismatch.records.length > 0) {
    throw new Error(
      `[MIGRATION ERROR] Timetable Section-Batch consistency violation detected for: ` +
      ttBatchMismatch.records.map((r) => r.get('ttId')).join(', ')
    );
  }

  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Applied summary:`);
  console.log(`  - ClassSection nodes: ${sectionsCreated}`);
  console.log(`  - HAS_SECTION: +${sectionsCreated}`);
  console.log(`  - MEMBER_OF: +${memberOfCreated}`);
  console.log(`  - HAS_ADVISOR: +${advisorLinksCreated}`);
  console.log(`  - FOR_SECTION: +${forSectionCreated}`);

  return {
    sectionsCreated,
    memberOfCreated,
    advisorLinksCreated,
    forSectionCreated,
  };
};

module.exports = {
  ...MIGRATION_META,
  up,
};
