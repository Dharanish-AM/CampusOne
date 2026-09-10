/**
 * Academic Repository
 * Neo4j queries for institutional entities: Department, Course, Batch, Section, Subject.
 * All writes use parameterized Cypher — no string interpolation from client data.
 */

const { driver } = require('../config/neo4j');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

// ─── Departments ──────────────────────────────────────────────────────────────

const getAllDepartments = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(`MATCH (d:Department) RETURN d ORDER BY d.name`);
    return res.records.map((r) => r.get('d').properties);
  } finally { await session.close(); }
};

const getDepartmentById = async (departmentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (d:Department { departmentId: $departmentId }) RETURN d`,
      { departmentId }
    );
    return res.records[0]?.get('d').properties ?? null;
  } finally { await session.close(); }
};

const createDepartment = async (data) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MERGE (d:Department { departmentId: $departmentId })
      ON CREATE SET d.name = $name, d.code = $code, d.description = $description,
                    d.isActive = true, d.createdAt = datetime()
      SET d.updatedAt = datetime()
      RETURN d
      `,
      data
    );
    return res.records[0]?.get('d').properties ?? null;
  } finally { await session.close(); }
};

// ─── Courses ──────────────────────────────────────────────────────────────────

const getAllCourses = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (c:Course)
      OPTIONAL MATCH (d:Department)-[:OFFERS]->(c)
      RETURN c, d.departmentId AS departmentId, d.name AS departmentName ORDER BY c.courseName
      `
    );
    return res.records.map((r) => ({
      ...r.get('c').properties,
      departmentId: r.get('departmentId'),
      departmentName: r.get('departmentName'),
    }));
  } finally { await session.close(); }
};

const getCoursesByDepartment = async (departmentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (d:Department { departmentId: $departmentId })-[:OFFERS]->(c:Course)
      RETURN c, d.departmentId AS departmentId, d.name AS departmentName
      ORDER BY c.courseName
      `,
      { departmentId }
    );
    return res.records.map((r) => ({
      ...r.get('c').properties,
      departmentId: r.get('departmentId'),
      departmentName: r.get('departmentName'),
    }));
  } finally { await session.close(); }
};

const getCourseById = async (courseId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (c:Course { courseId: $courseId }) RETURN c`,
      { courseId }
    );
    return res.records[0]?.get('c').properties ?? null;
  } finally { await session.close(); }
};

const createCourse = async (data, departmentId) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    const res = await txc.run(
      `
      MERGE (c:Course { courseId: $courseId })
      ON CREATE SET c.courseName = $courseName, c.courseCode = $courseCode,
                    c.name = $courseName, c.code = $courseCode,
                    c.duration = $duration, c.level = $level, c.totalCredits = $totalCredits,
                    c.isActive = true, c.createdAt = datetime()
      SET c.updatedAt = datetime()
      RETURN c
      `,
      data
    );
    // Sync Course as a Subject node as well since Course and Subject represent academic offerings
    await txc.run(
      `
      MERGE (s:Subject { subjectId: $courseId })
      ON CREATE SET s.name = $courseName, s.code = $courseCode, s.subjectCode = $courseCode,
                    s.credits = $totalCredits, s.isActive = true, s.createdAt = datetime()
      SET s.updatedAt = datetime()
      `,
      data
    );
    if (departmentId) {
      await txc.run(
        `
        MATCH (d:Department { departmentId: $departmentId })
        MATCH (c:Course { courseId: $courseId })
        MERGE (d)-[:OFFERS]->(c)
        MERGE (c)-[:ASSOCIATED_WITH]->(d)
        `,
        { courseId: data.courseId, departmentId }
      );
    }
    await txc.commit();
    return res.records[0]?.get('c').properties ?? null;
  } catch (err) { await txc.rollback(); throw err; }
  finally { await session.close(); }
};

// ─── Batches ──────────────────────────────────────────────────────────────────

const getAllBatches = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (b:Batch)
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(c:Course)
      OPTIONAL MATCH (b)-[:ASSOCIATED_WITH]->(d:Department)
      RETURN b, c.courseId AS courseId, c.courseName AS courseName, d.name AS departmentName
      ORDER BY b.batchName
      `
    );
    return res.records.map((r) => ({
      ...r.get('b').properties,
      courseId: r.get('courseId'),
      courseName: r.get('courseName'),
      departmentName: r.get('departmentName'),
    }));
  } finally { await session.close(); }
};

const getBatchesByCourse = async (courseId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (b:Batch)-[:FOR_COURSE]->(c:Course { courseId: $courseId })
      RETURN b, c.courseId AS courseId, c.courseName AS courseName
      ORDER BY b.batchName
      `,
      { courseId }
    );
    return res.records.map((r) => ({
      ...r.get('b').properties,
      courseId: r.get('courseId'),
      courseName: r.get('courseName'),
    }));
  } finally { await session.close(); }
};

const getBatchById = async (batchId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (b:Batch { batchId: $batchId }) RETURN b`,
      { batchId }
    );
    return res.records[0]?.get('b').properties ?? null;
  } finally { await session.close(); }
};

const createBatch = async (data, courseId) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    const res = await txc.run(
      `
      MERGE (b:Batch { batchId: $batchId })
      ON CREATE SET b.batchName = $name, b.name = $name, b.year = $year, b.admissionYear = $year,
                    b.isActive = true, b.createdAt = datetime()
      SET b.updatedAt = datetime()
      RETURN b
      `,
      data
    );
    if (courseId) {
      await txc.run(
        `
        MATCH (c:Course { courseId: $courseId })
        MATCH (b:Batch { batchId: $batchId })
        MERGE (b)-[:FOR_COURSE]->(c)
        `,
        { batchId: data.batchId, courseId }
      );
    }
    await txc.commit();
    return res.records[0]?.get('b').properties ?? null;
  } catch (err) { await txc.rollback(); throw err; }
  finally { await session.close(); }
};

// ─── Sections ─────────────────────────────────────────────────────────────────

const getAllSections = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (cs:ClassSection)
      OPTIONAL MATCH (b:Batch)-[:HAS_SECTION]->(cs)
      OPTIONAL MATCH (cs)-[:HAS_ADVISOR]->(f:Faculty)
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      RETURN cs, b.batchId AS batchId, b.batchName AS batchName, u.fullName AS advisorName
      ORDER BY cs.displayName
      `
    );
    return res.records.map((r) => ({
      ...r.get('cs').properties,
      batchId:     r.get('batchId'),
      batchName:   r.get('batchName'),
      advisorName: r.get('advisorName'),
    }));
  } finally { await session.close(); }
};

const getSectionsByBatch = async (batchId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })-[:HAS_SECTION]->(cs:ClassSection)
      WHERE cs.isActive = true
      OPTIONAL MATCH (cs)-[:HAS_ADVISOR]->(f:Faculty)
      OPTIONAL MATCH (u:User)-[:HAS_PROFILE]->(f)
      RETURN cs, b.batchId AS batchId, b.batchName AS batchName, u.fullName AS advisorName
      ORDER BY cs.displayName
      `,
      { batchId }
    );
    return res.records.map((r) => ({
      ...r.get('cs').properties,
      batchId:     r.get('batchId'),
      batchName:   r.get('batchName'),
      advisorName: r.get('advisorName'),
    }));
  } finally { await session.close(); }
};

const getSectionById = async (sectionId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (cs:ClassSection { sectionId: $sectionId }) RETURN cs`,
      { sectionId }
    );
    return res.records[0]?.get('cs').properties ?? null;
  } finally { await session.close(); }
};

const createSection = async (data, batchId) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    const res = await txc.run(
      `
      MERGE (cs:ClassSection { sectionId: $sectionId })
      ON CREATE SET cs.displayName = $name, cs.name = $name,
                    cs.isActive = true, cs.createdAt = datetime()
      SET cs.updatedAt = datetime()
      RETURN cs
      `,
      data
    );
    if (batchId) {
      await txc.run(
        `
        MATCH (b:Batch { batchId: $batchId })
        MATCH (cs:ClassSection { sectionId: $sectionId })
        MERGE (b)-[:HAS_SECTION]->(cs)
        `,
        { sectionId: data.sectionId, batchId }
      );
    }
    await txc.commit();
    return res.records[0]?.get('cs').properties ?? null;
  } catch (err) { await txc.rollback(); throw err; }
  finally { await session.close(); }
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

const getAllSubjects = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (sub:Subject) RETURN sub ORDER BY sub.subjectCode`
    );
    return res.records.map((r) => r.get('sub').properties);
  } finally { await session.close(); }
};

const getSubjectById = async (subjectId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (sub:Subject { subjectId: $subjectId }) RETURN sub`,
      { subjectId }
    );
    return res.records[0]?.get('sub').properties ?? null;
  } finally { await session.close(); }
};

const createSubject = async (data, courseId) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    const res = await txc.run(
      `
      MERGE (s:Subject { subjectId: $subjectId })
      ON CREATE SET s.name = $name, s.code = $code, s.subjectCode = $code,
                    s.credits = $credits, s.semester = $semester,
                    s.isActive = true, s.createdAt = datetime()
      SET s.updatedAt = datetime()
      RETURN s
      `,
      data
    );
    // Sync Subject as Course as well since Course and Subject are treated unified
    await txc.run(
      `
      MERGE (c:Course { courseId: $subjectId })
      ON CREATE SET c.courseName = $name, c.courseCode = $code,
                    c.name = $name, c.code = $code,
                    c.totalCredits = $credits, c.isActive = true, c.createdAt = datetime()
      SET c.updatedAt = datetime()
      `,
      data
    );
    if (courseId) {
      await txc.run(
        `
        MATCH (c:Course { courseId: $courseId })
        MATCH (s:Subject { subjectId: $subjectId })
        MERGE (c)-[:HAS_SUBJECT]->(s)
        `,
        { subjectId: data.subjectId, courseId }
      );
    }
    await txc.commit();
    return res.records[0]?.get('s').properties ?? null;
  } catch (err) { await txc.rollback(); throw err; }
  finally { await session.close(); }
};

// ─── Relationship-Rich Detail Queries ─────────────────────────────────────────

const getDepartmentWithRelations = async (departmentId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (d:Department { departmentId: $departmentId })
      OPTIONAL MATCH (b:Batch)-[:FOR_COURSE]->(c:Course)-[:ASSOCIATED_WITH]->(d)
      OPTIONAL MATCH (s:Student)-[:BELONGS_TO]->(b)
      WITH d, b, count(DISTINCT s) AS sCount
      WITH d, collect(DISTINCT { batchId: b.batchId, name: coalesce(b.batchName, b.name), year: b.admissionYear, studentCount: sCount }) AS batches
      OPTIONAL MATCH (f:Faculty)-[:ASSOCIATED_WITH]->(d)
      OPTIONAL MATCH (uf:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (d)-[:OFFERS]->(c2:Course)
      RETURN d,
        [x IN batches WHERE x.batchId IS NOT NULL] AS batches,
        collect(DISTINCT { facultyId: f.facultyId, name: uf.fullName, designation: f.designation, employeeId: f.employeeId }) AS faculty,
        collect(DISTINCT { courseId: c2.courseId, name: coalesce(c2.courseName, c2.name), code: coalesce(c2.courseCode, c2.code) }) AS masterCourses
      LIMIT 1
      `,
      { departmentId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      department:    r.get('d').properties,
      batches:       r.get('batches'),
      faculty:       r.get('faculty').filter(f => f.facultyId),
      masterCourses: r.get('masterCourses').filter(c => c.courseId),
    };
  } finally { await session.close(); }
};

const getCourseWithRelations = async (courseId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (c:Course { courseId: $courseId })
      OPTIONAL MATCH (d:Department)-[:OFFERS]->(c)
      OPTIONAL MATCH (b:Batch)-[r:HAS_SEMESTER_COURSE]->(c)
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(bc:Course)
      OPTIONAL MATCH (dept:Department)<-[:ASSOCIATED_WITH]-(bc)
      RETURN c,
        d AS department,
        collect(DISTINCT {
          batchId: b.batchId,
          batchName: coalesce(b.batchName, b.name),
          departmentName: dept.name,
          semester: r.semester,
          courseType: coalesce(r.courseType, 'Core'),
          credits: coalesce(r.credits, c.totalCredits, 3),
          status: coalesce(r.status, 'ACTIVE')
        }) AS usedBy
      LIMIT 1
      `,
      { courseId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      course:     r.get('c').properties,
      department: r.get('department')?.properties ?? null,
      usedBy:     r.get('usedBy').filter(u => u.batchId),
    };
  } finally { await session.close(); }
};

const getBatchWithRelations = async (batchId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(c:Course)
      OPTIONAL MATCH (d:Department)<-[:ASSOCIATED_WITH]-(c)
      OPTIONAL MATCH (b)-[:HAS_SECTION]->(cs:ClassSection)
      OPTIONAL MATCH (cs)-[:HAS_ADVISOR]->(fa:Faculty)
      OPTIONAL MATCH (ufa:User)-[:HAS_PROFILE]->(fa)
      OPTIONAL MATCH (s:Student)-[:BELONGS_TO]->(b)
      OPTIONAL MATCH (us:User)-[:HAS_PROFILE]->(s)
      OPTIONAL MATCH (cs_s:ClassSection)<-[:MEMBER_OF]-(s)
      OPTIONAL MATCH (b)-[r:HAS_SEMESTER_COURSE]->(sc:Course)
      RETURN b,
        c AS course,
        d AS department,
        fa AS advisor, ufa.fullName AS advisorName,
        collect(DISTINCT { sectionId: cs.sectionId, name: coalesce(cs.displayName, cs.name) }) AS sections,
        collect(DISTINCT { studentId: s.studentId, rollNumber: s.rollNumber, fullName: us.fullName, email: us.email, section: cs_s.displayName }) AS students,
        collect(DISTINCT { courseId: sc.courseId, name: coalesce(sc.courseName, sc.name), code: coalesce(sc.courseCode, sc.code), semester: r.semester, courseType: r.courseType, credits: r.credits }) AS assignedCourses
      LIMIT 1
      `,
      { batchId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    const bProps = r.get('b').properties;
    const currentSemester = bProps.currentSemester || 7;

    return {
      batch:           bProps,
      course:          r.get('course')?.properties ?? null,
      department:      r.get('department')?.properties ?? null,
      advisor:         r.get('advisor')?.properties ?? null,
      advisorName:     r.get('advisorName') ?? null,
      currentSemester,
      sections:        r.get('sections').filter(s => s.sectionId),
      students:        r.get('students').filter(s => s.studentId),
      assignedCourses: r.get('assignedCourses').filter(ac => ac.courseId),
    };
  } finally { await session.close(); }
};

const getBatchSemesterDetail = async (batchId, semesterNum) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(c:Course)
      OPTIONAL MATCH (d:Department)<-[:ASSOCIATED_WITH]-(c)
      OPTIONAL MATCH (b)-[r:HAS_SEMESTER_COURSE]->(sc:Course)
      WHERE r.semester = toInteger($semesterNum)
      RETURN b, c AS course, d AS department,
        collect(DISTINCT {
          courseId: sc.courseId,
          name: coalesce(sc.courseName, sc.name),
          code: coalesce(sc.courseCode, sc.code),
          credits: coalesce(r.credits, sc.totalCredits, 3),
          courseType: coalesce(r.courseType, 'Core'),
          status: coalesce(r.status, 'ACTIVE')
        }) AS courses
      LIMIT 1
      `,
      { batchId, semesterNum: parseInt(String(semesterNum), 10) }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    const batchProps = r.get('b').properties;
    const isCurrent = (batchProps.currentSemester || 7) === parseInt(String(semesterNum), 10);

    return {
      batch:      batchProps,
      course:     r.get('course')?.properties ?? null,
      department: r.get('department')?.properties ?? null,
      semester:   parseInt(String(semesterNum), 10),
      isCurrent,
      courses:    r.get('courses').filter(c => c.courseId),
    };
  } finally { await session.close(); }
};

const assignCourseToBatchSemester = async (batchId, semesterNum, { courseId, credits, courseType, status }) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })
      MATCH (c:Course { courseId: $courseId })
      MERGE (b)-[r:HAS_SEMESTER_COURSE { semester: toInteger($semesterNum), courseId: $courseId }]->(c)
      SET r.credits = toInteger($credits),
          r.courseType = $courseType,
          r.status = $status,
          r.updatedAt = datetime()
      RETURN r
      `,
      {
        batchId,
        semesterNum: parseInt(String(semesterNum), 10),
        courseId,
        credits: parseInt(String(credits || 3), 10),
        courseType: courseType || 'Core',
        status: status || 'ACTIVE',
      }
    );
    // Also sync edge to Subject if subject node exists
    await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })
      MATCH (s:Subject { subjectId: $courseId })
      MERGE (b)-[r:HAS_SEMESTER_SUBJECT { semester: toInteger($semesterNum) }]->(s)
      SET r.credits = toInteger($credits)
      `,
      {
        batchId,
        semesterNum: parseInt(String(semesterNum), 10),
        courseId,
        credits: parseInt(String(credits || 3), 10),
      }
    );
    return { message: 'Course assigned to batch semester successfully.' };
  } finally { await session.close(); }
};

const removeCourseFromBatchSemester = async (batchId, semesterNum, courseId) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `
      MATCH (b:Batch { batchId: $batchId })-[r:HAS_SEMESTER_COURSE]->(c:Course { courseId: $courseId })
      WHERE r.semester = toInteger($semesterNum)
      DELETE r
      `,
      { batchId, semesterNum: parseInt(String(semesterNum), 10), courseId }
    );
    return { message: 'Course unassigned from batch semester.' };
  } finally { await session.close(); }
};

const getSectionWithRelations = async (sectionId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (cs:ClassSection { sectionId: $sectionId })
      OPTIONAL MATCH (b:Batch)-[:HAS_SECTION]->(cs)
      OPTIONAL MATCH (b)-[:FOR_COURSE]->(c:Course)
      OPTIONAL MATCH (d:Department)<-[:ASSOCIATED_WITH]-(c)
      OPTIONAL MATCH (cs)-[:HAS_ADVISOR]->(advisor:Faculty)
      OPTIONAL MATCH (ua:User)-[:HAS_PROFILE]->(advisor)
      OPTIONAL MATCH (s:Student)-[:MEMBER_OF]->(cs)
      OPTIONAL MATCH (us:User)-[:HAS_PROFILE]->(s)
      OPTIONAL MATCH (te:TimetableEntry)-[:FOR_SECTION]->(cs)
      OPTIONAL MATCH (te)-[:FOR_SUBJECT]->(sub:Subject)
      OPTIONAL MATCH (te)-[:TAUGHT_BY]->(tf:Faculty)
      OPTIONAL MATCH (utf:User)-[:HAS_PROFILE]->(tf)
      RETURN cs,
        b AS batch, c AS course, d AS department,
        advisor AS advisor, ua.fullName AS advisorName,
        collect(DISTINCT { studentId: s.studentId, rollNumber: s.rollNumber, fullName: us.fullName, email: us.email }) AS students,
        collect(DISTINCT { subjectId: sub.subjectId, name: sub.name, code: coalesce(sub.subjectCode, sub.code), facultyId: tf.facultyId, facultyName: utf.fullName }) AS teachingAssignments
      LIMIT 1
      `,
      { sectionId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      section:            r.get('cs').properties,
      batch:              r.get('batch')?.properties ?? null,
      course:             r.get('course')?.properties ?? null,
      department:         r.get('department')?.properties ?? null,
      advisor:            r.get('advisor')?.properties ?? null,
      advisorName:        r.get('advisorName') ?? null,
      students:           r.get('students').filter(s => s.studentId),
      teachingAssignments: r.get('teachingAssignments').filter(t => t.subjectId),
    };
  } finally { await session.close(); }
};

const getSubjectWithRelations = async (subjectId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (sub:Subject { subjectId: $subjectId })
      OPTIONAL MATCH (f:Faculty)-[:TEACHES]->(sub)
      OPTIONAL MATCH (uf:User)-[:HAS_PROFILE]->(f)
      OPTIONAL MATCH (f)-[:ASSOCIATED_WITH]->(fd:Department)
      OPTIONAL MATCH (c:Course)-[:HAS_SUBJECT]->(sub)
      OPTIONAL MATCH (d:Department)-[:OFFERS]->(c)
      RETURN sub,
        collect(DISTINCT { facultyId: f.facultyId, name: uf.fullName, designation: f.designation, department: fd.name }) AS faculty,
        collect(DISTINCT { courseId: c.courseId, name: coalesce(c.courseName, c.name), code: coalesce(c.courseCode, c.code), departmentName: d.name }) AS courses
      LIMIT 1
      `,
      { subjectId }
    );
    if (!res.records.length) return null;
    const r = res.records[0];
    return {
      subject: r.get('sub').properties,
      faculty: r.get('faculty').filter(f => f.facultyId),
      courses: r.get('courses').filter(c => c.courseId),
    };
  } finally { await session.close(); }
};

const getInstitutionOverview = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(`
      MATCH (d:Department) WITH count(d) AS deptCount
      MATCH (c:Course)     WITH deptCount, count(c) AS courseCount
      MATCH (b:Batch)      WITH deptCount, courseCount, count(b) AS batchCount
      MATCH (cs:ClassSection) WITH deptCount, courseCount, batchCount, count(cs) AS sectionCount
      MATCH (sub:Subject)  WITH deptCount, courseCount, batchCount, sectionCount, count(sub) AS subjectCount
      MATCH (s:Student)    WITH deptCount, courseCount, batchCount, sectionCount, subjectCount, count(s) AS studentCount
      MATCH (f:Faculty)    WITH deptCount, courseCount, batchCount, sectionCount, subjectCount, studentCount, count(f) AS facultyCount
      RETURN deptCount, courseCount, batchCount, sectionCount, subjectCount, studentCount, facultyCount
    `);
    if (!res.records.length) return {};
    const r = res.records[0];
    const toNum = (v) => v?.toNumber?.() ?? v ?? 0;
    return {
      departments: toNum(r.get('deptCount')),
      courses:     toNum(r.get('courseCount')),
      batches:     toNum(r.get('batchCount')),
      sections:    toNum(r.get('sectionCount')),
      subjects:    toNum(r.get('subjectCount')),
      students:    toNum(r.get('studentCount')),
      faculty:     toNum(r.get('facultyCount')),
    };
  } finally { await session.close(); }
};

module.exports = {
  getAllDepartments, getDepartmentById, createDepartment,
  getAllCourses, getCourseById, getCoursesByDepartment, createCourse,
  getAllBatches, getBatchById, getBatchesByCourse, createBatch,
  getAllSections, getSectionById, getSectionsByBatch, createSection,
  getAllSubjects, getSubjectById, createSubject,
  // Relationship-rich detail queries
  getDepartmentWithRelations,
  getCourseWithRelations,
  getBatchWithRelations,
  getBatchSemesterDetail,
  assignCourseToBatchSemester,
  removeCourseFromBatchSemester,
  getSectionWithRelations,
  getSubjectWithRelations,
  getInstitutionOverview,
};

