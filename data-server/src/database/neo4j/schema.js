/**
 * CampusOne Canonical Neo4j Graph Schema & Helpers
 *
 * Defines node labels, relationship types, uniqueness constraints,
 * indexes, and canonical idempotent relationship creation helpers.
 */

const NODE_LABELS = {
  USER: 'User',
  ROLE: 'Role',
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  ADMIN: 'Admin',
  TRANSPORT_STAFF: 'TransportStaff',
  PLACEMENT_OFFICER: 'PlacementOfficer',
  CLUB_COORDINATOR: 'ClubCoordinator',
  ACADEMIC_YEAR: 'AcademicYear',
  TERM: 'Term',
  DEPARTMENT: 'Department',
  COURSE: 'Course',
  BATCH: 'Batch',
  CLASS_SECTION: 'ClassSection',
  ACADEMIC_SEMESTER: 'AcademicSemester',
  SUBJECT: 'Subject',
  EXAMINATION_SESSION: 'ExaminationSession',
  EXAMINATION: 'Examination',
  RESULT: 'Result',
  TIMETABLE_ENTRY: 'TimetableEntry',
  TIME_SLOT: 'TimeSlot',
  ROOM: 'Room',
  ASSESSMENT: 'Assessment',
  QUESTION: 'Question',
  SUBMISSION: 'Submission',
  SKILL: 'Skill',
  TOPIC: 'Topic',
};

const RELATIONSHIP_TYPES = {
  // Identity & Authorization
  HAS_ROLE: 'HAS_ROLE',
  HAS_PROFILE: 'HAS_PROFILE',

  // Academic Enrolment & Hierarchy
  BELONGS_TO: 'BELONGS_TO',
  ENROLLED_IN: 'ENROLLED_IN',
  CURRENTLY_IN: 'CURRENTLY_IN',
  STUDIES: 'STUDIES', // Derived semantic edge
  OFFERS: 'OFFERS',
  ASSOCIATED_WITH: 'ASSOCIATED_WITH',
  HAS_BATCH: 'HAS_BATCH',
  HAS_SECTION: 'HAS_SECTION',
  MEMBER_OF: 'MEMBER_OF',
  HAS_SEMESTER: 'HAS_SEMESTER',
  HAS_SUBJECT: 'HAS_SUBJECT',
  HAS_TERM: 'HAS_TERM',
  FOR_BATCH: 'FOR_BATCH',
  FOR_SECTION: 'FOR_SECTION',
  IN_ACADEMIC_YEAR: 'IN_ACADEMIC_YEAR',
  IN_TERM: 'IN_TERM',
  FOR_COURSE: 'FOR_COURSE',

  // Faculty Teaching & Advisory
  TEACHES: 'TEACHES',
  TAUGHT_BY: 'TAUGHT_BY',
  HAS_ADVISOR: 'HAS_ADVISOR', // Section advisor semantic edge
  ADVISOR_FOR: 'ADVISOR_FOR', // Legacy batch advisor edge

  // Examinations & Results
  HAS_EXAMINATION_SESSION: 'HAS_EXAMINATION_SESSION',
  HAS_EXAM: 'HAS_EXAM',
  FOR_EXAM: 'FOR_EXAM',
  FOR_SUBJECT: 'FOR_SUBJECT',
  FOR_SEMESTER: 'FOR_SEMESTER', // Derived semantic edge
  HELD_IN: 'HELD_IN',
  HAS_RESULT: 'HAS_RESULT',

  // Timetable
  OCCURS_AT: 'OCCURS_AT',

  // Assessment & Performance
  CONTAINS: 'CONTAINS',
  TESTS: 'TESTS',
  MEASURES: 'MEASURES',
  SUBMITTED: 'SUBMITTED',
  FOR_ASSESSMENT: 'FOR_ASSESSMENT',
  HAS_SKILL: 'HAS_SKILL', // Derived semantic edge
  WEAK_IN: 'WEAK_IN',     // Derived semantic edge
};

// Domain Identifier Property Mapping for Constraints
const LABEL_ID_MAP = {
  User: 'userId',
  Role: 'roleId',
  Student: 'studentId',
  Faculty: 'facultyId',
  Admin: 'adminId',
  TransportStaff: 'staffId',
  PlacementOfficer: 'officerId',
  ClubCoordinator: 'coordinatorId',
  AcademicYear: 'academicYearId',
  Term: 'termId',
  Department: 'departmentId',
  Course: 'courseId',
  Batch: 'batchId',
  ClassSection: 'sectionId',
  AcademicSemester: 'academicSemesterId',
  Subject: 'subjectId',
  ExaminationSession: 'examSessionId',
  Examination: 'examId',
  Result: 'resultId',
  TimetableEntry: 'timetableEntryId',
  TimeSlot: 'timeSlotId',
  Room: 'roomId',
  Assessment: 'assessmentId',
  Question: 'questionId',
  Submission: 'submissionId',
  Skill: 'skillId',
  Topic: 'topicId',
};

/**
 * Ensures all 27 uniqueness constraints exist on the Neo4j database using IF NOT EXISTS.
 */
const setupConstraints = async (session) => {
  const constraintQueries = Object.entries(LABEL_ID_MAP).map(([label, idProp]) => {
    const constraintName = `constraint_${label.toLowerCase()}_${idProp.toLowerCase()}`;
    return `CREATE CONSTRAINT ${constraintName} IF NOT EXISTS FOR (n:${label}) REQUIRE n.${idProp} IS UNIQUE;`;
  });

  for (const query of constraintQueries) {
    try {
      await session.run(query);
    } catch (err) {
      console.warn(`[SCHEMA WARNING] Constraint creation warning: ${err.message}`);
    }
  }
};

/**
 * Canonical helper for creating idempotent relationships using MATCH + MERGE.
 */
const mergeRelationship = async (session, {
  fromLabel,
  fromIdProperty,
  fromId,
  relationshipType,
  toLabel,
  toIdProperty,
  toId,
  properties = {}
}) => {
  const query = `
    MATCH (a:${fromLabel} { ${fromIdProperty}: $fromId })
    MATCH (b:${toLabel} { ${toIdProperty}: $toId })
    MERGE (a)-[r:${relationshipType}]->(b)
    ON CREATE SET r += $properties
    RETURN r
  `;

  return await session.run(query, { fromId, toId, properties });
};

module.exports = {
  NODE_LABELS,
  RELATIONSHIP_TYPES,
  LABEL_ID_MAP,
  setupConstraints,
  mergeRelationship,
};
