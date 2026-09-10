/**
 * User Repository
 * Neo4j interactions for identity, credential verification, and user profiles.
 * All Cypher queries use parameterized inputs — never string interpolation from client data.
 */

const { driver } = require('../config/neo4j');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

// ─── Authentication ────────────────────────────────────────────────────────────

/**
 * Finds a user by username or email for login.
 * Returns minimal auth fields only — passwordHash included for verification, stripped before API response.
 */
const findAuthUserByIdentifier = async (identifier) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_PROFILE]->(p)
      WITH u, p
      WHERE u.username = $identifier 
         OR u.email = $identifier 
         OR p.rollNumber = $identifier 
         OR p.registerNumber = $identifier 
         OR p.employeeId = $identifier
      OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
      RETURN
        u.userId        AS userId,
        u.username      AS username,
        u.email         AS email,
        u.passwordHash  AS passwordHash,
        u.accountStatus AS accountStatus,
        u.fullName      AS fullName,
        r.name          AS role,
        COALESCE(p.studentId, p.facultyId, p.adminId, p.staffId, p.officerId, p.coordinatorId) AS profileId
      LIMIT 1
      `,
      { identifier }
    );
    if (!res.records.length) return null;
    return res.records[0].toObject();
  } finally {
    await session.close();
  }
};

/**
 * Finds a user by userId — used by authenticate middleware on every request.
 * Re-loads role from DB; never trusts JWT role alone.
 */
const findAuthUserById = async (userId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (u:User { userId: $userId })
      OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
      OPTIONAL MATCH (u)-[:HAS_PROFILE]->(p)
      RETURN
        u.userId        AS userId,
        u.username      AS username,
        u.email         AS email,
        u.accountStatus AS accountStatus,
        r.name          AS role,
        COALESCE(p.studentId, p.facultyId, p.adminId, p.staffId, p.officerId, p.coordinatorId) AS profileId
      LIMIT 1
      `,
      { userId }
    );
    if (!res.records.length) return null;
    return res.records[0].toObject();
  } finally {
    await session.close();
  }
};

/**
 * Checks uniqueness of username or email before registration.
 */
const checkUserUniqueness = async (username, email) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (u:User)
      WHERE u.username = $username OR u.email = $email
      RETURN u.username AS username, u.email AS email LIMIT 1
      `,
      { username, email }
    );
    return res.records.length === 0; // true = unique (available)
  } finally {
    await session.close();
  }
};

/**
 * Retrieves current passwordHash for a userId (for change-password verification).
 */
const getPasswordHash = async (userId) => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `MATCH (u:User { userId: $userId }) RETURN u.passwordHash AS passwordHash`,
      { userId }
    );
    return res.records[0]?.get('passwordHash') ?? null;
  } finally {
    await session.close();
  }
};

/**
 * Updates passwordHash for a user. Never accepts plaintext password from caller.
 */
const updatePasswordHash = async (userId, newHash) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `
      MATCH (u:User { userId: $userId })
      SET u.passwordHash = $newHash, u.passwordUpdatedAt = datetime(), u.updatedAt = datetime()
      `,
      { userId, newHash }
    );
  } finally {
    await session.close();
  }
};

/**
 * Updates lastLoginAt timestamp after successful authentication.
 */
const updateLastLogin = async (userId) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `MATCH (u:User { userId: $userId }) SET u.lastLoginAt = datetime()`,
      { userId }
    );
  } finally {
    await session.close();
  }
};

// ─── Student Registration (Transactional) ─────────────────────────────────────

/**
 * Creates User + Student + all graph relationships in a single Neo4j transaction.
 * Either everything succeeds or nothing is created.
 */
const createStudentWithUser = async ({ user, student, refs }) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    // 1. Create User node
    await txc.run(
      `
      CREATE (u:User {
        userId:           $userId,
        username:         $username,
        email:            $email,
        passwordHash:     $passwordHash,
        firstName:        $firstName,
        lastName:         $lastName,
        fullName:         $fullName,
        dateOfBirth:      $dateOfBirth,
        gender:           $gender,
        bloodGroup:       $bloodGroup,
        phone:            $phone,
        accountStatus:    "ACTIVE",
        createdAt:        datetime(),
        updatedAt:        datetime()
      })
      `,
      user
    );

    // 2. Create Student profile node
    await txc.run(
      `
      CREATE (s:Student {
        studentId:        $studentId,
        registerNumber:   $registerNumber,
        rollNumber:       $rollNumber,
        admissionDate:    $admissionDate,
        admissionCategory: "GENERAL",
        studentType:      "REGULAR",
        currentCGPA:      0.0,
        currentArrears:   0,
        graduationYear:   $graduationYear,
        status:           "ACTIVE"
      })
      `,
      student
    );

    // 3. Link User → HAS_ROLE → STUDENT Role
    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (r:Role { name: "STUDENT" })
      MERGE (u)-[:HAS_ROLE]->(r)
      `,
      { userId: user.userId }
    );

    // 4. Link User → HAS_PROFILE → Student
    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (s:Student { studentId: $studentId })
      MERGE (u)-[:HAS_PROFILE]->(s)
      `,
      { userId: user.userId, studentId: student.studentId }
    );

    // 5. Student → BELONGS_TO → Batch
    await txc.run(
      `
      MATCH (s:Student { studentId: $studentId })
      MATCH (b:Batch { batchId: $batchId })
      MERGE (s)-[:BELONGS_TO]->(b)
      `,
      { studentId: student.studentId, batchId: refs.batchId }
    );

    // 6. Student → MEMBER_OF → ClassSection
    await txc.run(
      `
      MATCH (s:Student { studentId: $studentId })
      MATCH (cs:ClassSection { sectionId: $sectionId })
      MERGE (s)-[:MEMBER_OF]->(cs)
      `,
      { studentId: student.studentId, sectionId: refs.sectionId }
    );

    // 7. Student → ENROLLED_IN → Department (optional but useful for graph queries)
    await txc.run(
      `
      MATCH (s:Student { studentId: $studentId })
      MATCH (d:Department { departmentId: $departmentId })
      MERGE (s)-[:BELONGS_TO]->(d)
      `,
      { studentId: student.studentId, departmentId: refs.departmentId }
    );

    await txc.commit();
    return { userId: user.userId, studentId: student.studentId };
  } catch (err) {
    await txc.rollback();
    throw err;
  } finally {
    await session.close();
  }
};

// ─── Faculty Creation (Admin-only, Transactional) ─────────────────────────────

const createFacultyWithUser = async ({ user, faculty, refs }) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    await txc.run(
      `
      CREATE (u:User {
        userId:        $userId,
        username:      $username,
        email:         $email,
        passwordHash:  $passwordHash,
        firstName:     $firstName,
        lastName:      $lastName,
        fullName:      $fullName,
        phone:         $phone,
        accountStatus: "ACTIVE",
        createdAt:     datetime(),
        updatedAt:     datetime()
      })
      `,
      user
    );

    await txc.run(
      `
      CREATE (f:Faculty {
        facultyId:       $facultyId,
        employeeId:      $employeeId,
        designation:     $designation,
        qualification:   $qualification,
        specialization:  $specialization,
        joinDate:        $joinDate,
        status:          "ACTIVE"
      })
      `,
      faculty
    );

    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (r:Role { name: "FACULTY" })
      MERGE (u)-[:HAS_ROLE]->(r)
      `,
      { userId: user.userId }
    );

    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (f:Faculty { facultyId: $facultyId })
      MERGE (u)-[:HAS_PROFILE]->(f)
      `,
      { userId: user.userId, facultyId: faculty.facultyId }
    );

    if (refs.departmentId) {
      await txc.run(
        `
        MATCH (f:Faculty { facultyId: $facultyId })
        MATCH (d:Department { departmentId: $departmentId })
        MERGE (f)-[:ASSOCIATED_WITH]->(d)
        `,
        { facultyId: faculty.facultyId, departmentId: refs.departmentId }
      );
    }

    await txc.commit();
    return { userId: user.userId, facultyId: faculty.facultyId };
  } catch (err) {
    await txc.rollback();
    throw err;
  } finally {
    await session.close();
  }
};

// ─── Admin Creation (Admin-only, Transactional) ───────────────────────────────

const createAdminWithUser = async ({ user, admin }) => {
  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();
  try {
    await txc.run(
      `
      CREATE (u:User {
        userId:        $userId,
        username:      $username,
        email:         $email,
        passwordHash:  $passwordHash,
        firstName:     $firstName,
        lastName:      $lastName,
        fullName:      $fullName,
        phone:         $phone,
        accountStatus: "ACTIVE",
        createdAt:     datetime(),
        updatedAt:     datetime()
      })
      `,
      user
    );

    await txc.run(
      `
      CREATE (a:Admin {
        adminId:   $adminId,
        level:     $level,
        createdAt: datetime()
      })
      `,
      admin
    );

    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (r:Role { name: "ADMIN" })
      MERGE (u)-[:HAS_ROLE]->(r)
      `,
      { userId: user.userId }
    );

    await txc.run(
      `
      MATCH (u:User { userId: $userId })
      MATCH (a:Admin { adminId: $adminId })
      MERGE (u)-[:HAS_PROFILE]->(a)
      `,
      { userId: user.userId, adminId: admin.adminId }
    );

    await txc.commit();
    return { userId: user.userId, adminId: admin.adminId };
  } catch (err) {
    await txc.rollback();
    throw err;
  } finally {
    await session.close();
  }
};

// ─── Account Management (Admin) ───────────────────────────────────────────────

const updateAccountStatus = async (userId, status) => {
  const session = driver.session({ database: DB });
  try {
    await session.run(
      `MATCH (u:User { userId: $userId }) SET u.accountStatus = $status, u.updatedAt = datetime()`,
      { userId, status }
    );
  } finally {
    await session.close();
  }
};

const getAllUsers = async () => {
  const session = driver.session({ database: DB });
  try {
    const res = await session.run(
      `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
      RETURN u.userId AS userId, u.username AS username, u.email AS email,
             u.fullName AS fullName, u.accountStatus AS accountStatus, r.name AS role
      ORDER BY u.createdAt DESC
      `
    );
    return res.records.map((r) => r.toObject());
  } finally {
    await session.close();
  }
};

module.exports = {
  findAuthUserByIdentifier,
  findAuthUserById,
  checkUserUniqueness,
  getPasswordHash,
  updatePasswordHash,
  updateLastLogin,
  createStudentWithUser,
  createFacultyWithUser,
  createAdminWithUser,
  updateAccountStatus,
  getAllUsers,
};
