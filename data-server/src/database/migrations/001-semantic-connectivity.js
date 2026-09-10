/**
 * Versioned Migration 001: Semantic Connectivity
 *
 * Adds derived semantic edges to improve GraphRAG / Agentic AI retrieval:
 * 1. (Student)-[:STUDIES]->(Subject)
 * 2. (Examination)-[:FOR_SEMESTER]->(AcademicSemester)
 * 3. (Student)-[:HAS_SKILL]->(Skill) (where submission score >= 80%)
 * 4. (Student)-[:WEAK_IN]->(Topic) (where submission score < 50%)
 * 5. ADVISOR_FOR: Conditional (Skipped with warning if no advisor source data)
 */

const MIGRATION_META = {
  migrationId: '001-semantic-connectivity',
  version: 1,
  name: 'semantic-connectivity',
};

const up = async (session) => {
  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Running semantic connectivity migration...`);

  // 1. STUDIES
  const studiesRes = await session.run(`
    MATCH (s:Student)-[:CURRENTLY_IN]->(sem:AcademicSemester)-[:HAS_SUBJECT]->(sub:Subject)
    MERGE (s)-[r:STUDIES]->(sub)
    ON CREATE SET r.source = "DERIVED_FROM_SEMESTER_ENROLLMENT", r.derivedAt = datetime()
    RETURN count(r) AS cnt
  `);
  const studiesCount = studiesRes.records[0].get('cnt').toNumber();

  // 2. FOR_SEMESTER
  const forSemRes = await session.run(`
    MATCH (exam:Examination)<-[:HAS_EXAM]-(session:ExaminationSession)<-[:HAS_EXAMINATION_SESSION]-(sem:AcademicSemester)
    MERGE (exam)-[r:FOR_SEMESTER]->(sem)
    ON CREATE SET r.source = "DERIVED_FROM_EXAM_SESSION", r.derivedAt = datetime()
    RETURN count(r) AS cnt
  `);
  const forSemCount = forSemRes.records[0].get('cnt').toNumber();

  // 3. HAS_SKILL
  const hasSkillRes = await session.run(`
    MATCH (s:Student)-[:SUBMITTED]->(subm:Submission)-[:FOR_ASSESSMENT]->(a:Assessment)-[:CONTAINS]->(q:Question)-[:MEASURES]->(sk:Skill)
    WHERE (toInteger(subm.score) * 1.0 / toInteger(a.maxMarks)) >= 0.8
    MERGE (s)-[r:HAS_SKILL]->(sk)
    ON CREATE SET r.source = "DERIVED_FROM_ASSESSMENT", r.derivedAt = datetime()
    RETURN count(r) AS cnt
  `);
  const hasSkillCount = hasSkillRes.records[0].get('cnt').toNumber();

  // 4. WEAK_IN
  const weakInRes = await session.run(`
    MATCH (s:Student)-[:SUBMITTED]->(subm:Submission)-[:FOR_ASSESSMENT]->(a:Assessment)-[:CONTAINS]->(q:Question)-[:TESTS]->(top:Topic)
    WHERE (toInteger(subm.score) * 1.0 / toInteger(a.maxMarks)) < 0.5
    MERGE (s)-[r:WEAK_IN]->(top)
    ON CREATE SET r.source = "DERIVED_FROM_ASSESSMENT", r.derivedAt = datetime()
    RETURN count(r) AS cnt
  `);
  const weakInCount = weakInRes.records[0].get('cnt').toNumber();

  // 5. ADVISOR_FOR
  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] ADVISOR_FOR skipped: missing advisor source data`);

  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Applied summary:`);
  console.log(`  - STUDIES: +${studiesCount}`);
  console.log(`  - FOR_SEMESTER: +${forSemCount}`);
  console.log(`  - HAS_SKILL: +${hasSkillCount}`);
  console.log(`  - WEAK_IN: +${weakInCount}`);

  return {
    studiesCount,
    forSemCount,
    hasSkillCount,
    weakInCount,
  };
};

module.exports = {
  ...MIGRATION_META,
  up,
};
