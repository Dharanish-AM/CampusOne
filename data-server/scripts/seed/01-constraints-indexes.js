/**
 * CampusOne - Phase 2: Constraints & Indexes
 *
 * Creates all uniqueness constraints and performance indexes
 * for the CampusOne Knowledge Graph.
 *
 * Safe to run multiple times (idempotent - uses IF NOT EXISTS).
 *
 * Run: node scripts/seed/01-constraints-indexes.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { driver, closeNeo4jDriver } = require('../../src/config/neo4j');

// ============================================================
// UNIQUENESS CONSTRAINTS
// Each constraint auto-creates a backing index in Neo4j 4.x+
// ============================================================

const constraints = [
  // Identity
  { label: 'User',              property: 'userId' },
  { label: 'User',              property: 'email',         name: 'constraint_user_email' },
  { label: 'Role',              property: 'roleId' },

  // Profiles
  { label: 'Student',           property: 'studentId' },
  { label: 'Faculty',           property: 'facultyId' },
  { label: 'Admin',             property: 'adminId' },
  { label: 'TransportStaff',    property: 'staffId' },
  { label: 'PlacementOfficer',  property: 'officerId' },
  { label: 'ClubCoordinator',   property: 'coordinatorId' },

  // Academic
  { label: 'AcademicYear',      property: 'academicYearId' },
  { label: 'Term',              property: 'termId' },
  { label: 'Batch',             property: 'batchId' },
  { label: 'Department',        property: 'departmentId' },
  { label: 'Course',            property: 'courseId' },
  { label: 'AcademicSemester',  property: 'academicSemesterId' },
  { label: 'Subject',           property: 'subjectId' },

  // Examination
  { label: 'ExaminationSession', property: 'examSessionId' },
  { label: 'Examination',        property: 'examId' },
  { label: 'Result',             property: 'resultId' },

  // Timetable
  { label: 'TimetableEntry',    property: 'timetableEntryId' },
  { label: 'TimeSlot',          property: 'timeSlotId' },
  { label: 'Room',              property: 'roomId' },

  // Future-Ready Assessment
  { label: 'Assessment',        property: 'assessmentId' },
  { label: 'Question',          property: 'questionId' },
  { label: 'Submission',        property: 'submissionId' },
  { label: 'Skill',             property: 'skillId' },
  { label: 'Topic',             property: 'topicId' },
];

// ============================================================
// INDEXES
// For frequently queried non-unique properties
// ============================================================

const indexes = [
  // Student lookup fields
  { label: 'Student',           property: 'registerNumber' },
  { label: 'Student',           property: 'rollNumber' },
  { label: 'Student',           property: 'admissionNumber' },

  // Faculty lookup
  { label: 'Faculty',           property: 'employeeId' },

  // Department lookup
  { label: 'Department',        property: 'code' },
  { label: 'Department',        property: 'name' },

  // Course lookup
  { label: 'Course',            property: 'courseCode' },
  { label: 'Course',            property: 'courseName' },

  // Subject lookup
  { label: 'Subject',           property: 'subjectCode' },
  { label: 'Subject',           property: 'name' },

  // Batch lookup
  { label: 'Batch',             property: 'batchName' },
  { label: 'Batch',             property: 'admissionYear' },

  // Semester lookup
  { label: 'AcademicSemester',  property: 'semesterNumber' },

  // Timetable lookup
  { label: 'TimetableEntry',    property: 'dayOfWeek' },
  { label: 'TimetableEntry',    property: 'periodNumber' },

  // Room lookup
  { label: 'Room',              property: 'roomNumber' },

  // Examination lookup
  { label: 'Examination',       property: 'examDate' },
  { label: 'Examination',       property: 'examType' },

  // Result filtering
  { label: 'Result',            property: 'status' },

  // User lookup
  { label: 'User',              property: 'username' },
];

const applyConstraints = async (session) => {
  console.log('\n[Constraints] Applying uniqueness constraints...');
  let created = 0;
  let skipped = 0;

  for (const c of constraints) {
    const constraintName = c.name || `constraint_${c.label.toLowerCase()}_${c.property.toLowerCase()}`;
    const cypher = `
      CREATE CONSTRAINT ${constraintName} IF NOT EXISTS
      FOR (n:${c.label})
      REQUIRE n.${c.property} IS UNIQUE
    `;
    try {
      await session.run(cypher);
      console.log(`  ✔  CONSTRAINT ${c.label}.${c.property}`);
      created++;
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`  –  CONSTRAINT ${c.label}.${c.property} (already exists)`);
        skipped++;
      } else {
        console.warn(`  ⚠  CONSTRAINT ${c.label}.${c.property} — ${err.message}`);
        skipped++;
      }
    }
  }

  console.log(`[Constraints] Done. Created: ${created}, Skipped/Existing: ${skipped}`);
};

const applyIndexes = async (session) => {
  console.log('\n[Indexes] Applying performance indexes...');
  let created = 0;
  let skipped = 0;

  for (const idx of indexes) {
    const indexName = `idx_${idx.label.toLowerCase()}_${idx.property.toLowerCase()}`;
    const cypher = `
      CREATE INDEX ${indexName} IF NOT EXISTS
      FOR (n:${idx.label})
      ON (n.${idx.property})
    `;
    try {
      await session.run(cypher);
      console.log(`  ✔  INDEX ${idx.label}.${idx.property}`);
      created++;
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`  –  INDEX ${idx.label}.${idx.property} (already exists)`);
        skipped++;
      } else {
        console.warn(`  ⚠  INDEX ${idx.label}.${idx.property} — ${err.message}`);
        skipped++;
      }
    }
  }

  console.log(`[Indexes] Done. Created: ${created}, Skipped/Existing: ${skipped}`);
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('CampusOne — Apply Constraints & Indexes');
  console.log('='.repeat(60));

  const database = process.env.NEO4J_DATABASE || 'neo4j';
  const session = driver.session({ database });

  try {
    await applyConstraints(session);
    await applyIndexes(session);
    console.log('\n[Done] All constraints and indexes applied successfully.\n');
  } catch (err) {
    console.error('\n[Fatal] Unexpected error:', err.message);
    throw err;
  } finally {
    await session.close();
  }
};

// Export for programmatic use (e.g. seeder.js)
module.exports = main;

// Run directly: node scripts/seed/01-constraints-indexes.js
if (require.main === module) {
  main()
    .then(() => closeNeo4jDriver())
    .catch((err) => {
      console.error('[Fatal]', err.message);
      closeNeo4jDriver().finally(() => process.exit(1));
    });
}
