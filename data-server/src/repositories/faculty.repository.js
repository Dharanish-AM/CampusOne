/**
 * Faculty Repository
 * Neo4j queries for faculty profile and assignment-scoped data access.
 */

const { driver } = require('../config/neo4j');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

/**
 * Gets the full faculty profile.
 */
const getFacultyProfile = async (facultyId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty { facultyId: $facultyId })
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (f)-[:ASSOCIATED_WITH]->(d:Department)
      RETURN f, u.userId AS userId, u.username AS username, u.email AS email,
             u.fullName AS fullName, u.phone AS phone, d AS department
      LIMIT 1
      `,
      { facultyId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      faculty:    r.get('f')?.properties ?? null,
      userId:     r.get('userId'),
      username:   r.get('username'),
      email:      r.get('email'),
      fullName:   r.get('fullName'),
      phone:      r.get('phone'),
      department: r.get('department')?.properties ?? null,
    };
  } finally {
    await session.close();
  }
};

/**
 * Gets facultyId from userId.
 */
const getFacultyIdByUserId = async (userId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (u:User { userId: $userId })-[:HAS_PROFILE]->(f:Faculty) RETURN f.facultyId AS facultyId`,
      { userId }
    );
    return res.records[0]?.get('facultyId') ?? null;
  } finally {
    await session.close();
  }
};

/**
 * Gets subjects assigned to a faculty member (via TEACHES).
 */
const getFacultySubjects = async (facultyId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty { facultyId: $facultyId })-[:TEACHES]->(sub:Subject)
      RETURN sub ORDER BY sub.subjectCode
      `,
      { facultyId }
    );
    return res.records.map((r) => r.get('sub')?.properties ?? null);
  } finally {
    await session.close();
  }
};

/**
 * Gets students the faculty is assigned to — via taught subjects or advisor sections.
 * This is the core resource authorization query.
 */
const getAssignedStudents = async (facultyId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty { facultyId: $facultyId })
      // Path 1: Faculty teaches Subject → Student studies Subject
      OPTIONAL MATCH (f)-[:TEACHES]->(sub:Subject)<-[:STUDIES]-(s1:Student)
      // Path 2: Faculty advises Section → Student is member of Section
      OPTIONAL MATCH (f)<-[:HAS_ADVISOR]-(cs:ClassSection)<-[:MEMBER_OF]-(s2:Student)
      WITH collect(DISTINCT s1) + collect(DISTINCT s2) AS allStudents
      UNWIND allStudents AS s
      WITH DISTINCT s
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(s)
      OPTIONAL MATCH (s)-[:BELONGS_TO]->(b:Batch)
      OPTIONAL MATCH (s)-[:MEMBER_OF]->(cs:ClassSection)
      RETURN s, u.fullName AS fullName, u.email AS email, b.batchName AS batch, cs.displayName AS section
      ORDER BY s.studentId
      `,
      { facultyId }
    );
    return res.records.map((r) => ({
      ...r.get('s')?.properties,
      fullName: r.get('fullName'),
      email:    r.get('email'),
      batch:    r.get('batch'),
      section:  r.get('section'),
    }));
  } finally {
    await session.close();
  }
};

/**
 * Checks if a faculty has an assigned academic relationship with a specific student.
 * Returns true if the faculty teaches a subject the student studies,
 * OR if the faculty advises the student's section.
 * Used by authorizeStudent middleware.
 */
const hasAssignedRelationship = async (facultyId, studentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty { facultyId: $facultyId }), (s:Student { studentId: $studentId })
      RETURN
        exists((f)-[:TEACHES]->(:Subject)<-[:STUDIES]-(s)) OR
        exists((f)<-[:HAS_ADVISOR]-(:ClassSection)<-[:MEMBER_OF]-(s))
      AS hasRelationship
      `,
      { facultyId, studentId }
    );
    return res.records[0]?.get('hasRelationship') === true;
  } finally {
    await session.close();
  }
};

/**
 * Gets all faculty (admin use).
 */
const getAllFaculty = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty)
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (f)-[:ASSOCIATED_WITH]->(d:Department)
      RETURN f, u.fullName AS fullName, u.email AS email, d.name AS department
      ORDER BY f.facultyId
      `
    );
    return res.records.map((r) => ({
      ...r.get('f')?.properties,
      fullName:   r.get('fullName'),
      email:      r.get('email'),
      department: r.get('department'),
    }));
  } finally {
    await session.close();
  }
};

/**
 * Gets full faculty detail with teaching assignments (Subject × Section × Semester).
 */
const getFacultyWithRelations = async (facultyId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (f:Faculty { facultyId: $facultyId })
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (f)-[:ASSOCIATED_WITH]->(d:Department)
      OPTIONAL MATCH (f)-[:TEACHES]->(sub:Subject)
      OPTIONAL MATCH (te:TimetableEntry)-[:TAUGHT_BY]->(f)
      OPTIONAL MATCH (te)-[:FOR_SECTION]->(cs:ClassSection)
      OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(tesub:Subject)
      OPTIONAL MATCH (cs2:ClassSection)-[:HAS_ADVISOR]->(f)
      OPTIONAL MATCH (s:Student)-[:MEMBER_OF]->(cs2)
      RETURN f, u, d AS department,
        collect(DISTINCT { subjectId: sub.subjectId, name: sub.name, code: coalesce(sub.subjectCode, sub.code), credits: sub.credits }) AS subjects,
        collect(DISTINCT { sectionId: cs.sectionId, name: coalesce(cs.displayName, cs.name), subjectId: tesub.subjectId, subjectName: tesub.name, subjectCode: coalesce(tesub.subjectCode, tesub.code) }) AS teachingAssignments,
        collect(DISTINCT { sectionId: cs2.sectionId, name: coalesce(cs2.displayName, cs2.name) }) AS advisedSections,
        count(DISTINCT s) AS advisedStudentCount
      LIMIT 1
      `,
      { facultyId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    const u = r.get('u')?.properties ?? {};
    return {
      faculty:             r.get('f').properties,
      user:                u,
      department:          r.get('department')?.properties ?? null,
      subjects:            r.get('subjects').filter(s => s.subjectId),
      teachingAssignments: r.get('teachingAssignments').filter(t => t.sectionId),
      advisedSections:     r.get('advisedSections').filter(s => s.sectionId),
      advisedStudentCount: r.get('advisedStudentCount').toNumber?.() ?? r.get('advisedStudentCount'),
    };
  } finally { await session.close(); }
};

module.exports = {
  getFacultyProfile,
  getFacultyIdByUserId,
  getFacultySubjects,
  getAssignedStudents,
  hasAssignedRelationship,
  getAllFaculty,
  getFacultyWithRelations,
};
