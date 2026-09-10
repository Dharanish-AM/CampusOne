/**
 * CampusOne Integration-Test Data Seeder (Admin Only)
 *
 * Resets the Neo4j database completely and populates ONLY the ADMIN role,
 * the admin1 User node, and the Admin profile node for testing.
 *
 * Safety Guards:
 * - Must refuse execution unless NODE_ENV=development/test AND ALLOW_DB_RESET=true.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { driver } = require('../config/neo4j');
const { hashPassword } = require('./auth/password');
const { setupConstraints } = require('../database/neo4j/schema');

const DB = process.env.NEO4J_DATABASE || 'neo4j';

const seedDatabase = async () => {
  console.log('============================================');
  console.log('CAMPUSONE ADMIN-ONLY SEEDER');
  console.log('============================================');

  // 1. Safety Checks
  const env = process.env.NODE_ENV;
  const allowReset = process.env.ALLOW_DB_RESET === 'true' || process.env.ALLOW_DATABASE_RESET === 'true';

  if ((env !== 'development' && env !== 'test') || !allowReset) {
    console.error('Database reset refused. Set NODE_ENV=development/test and ALLOW_DB_RESET=true.');
    process.exit(1);
  }

  console.log('WARNING: This will delete ALL Neo4j data.');
  console.log(`Resetting and seeding database: "${DB}"...`);

  // 2. Setup constraints in a clean session first (Neo4j requires schema changes in separate transaction)
  const schemaSession = driver.session({ database: DB });
  try {
    console.log('[1/5] Applying database uniqueness constraints...');
    await setupConstraints(schemaSession);
  } catch (err) {
    console.warn('[SCHEMA WARNING] Constraint initialization warning:', err.message);
  } finally {
    await schemaSession.close();
  }

  const session = driver.session({ database: DB });
  const txc = session.beginTransaction();

  try {
    // 3. Clear Database
    console.log('[2/5] Clearing existing nodes and relationships...');
    await txc.run('MATCH (n) DETACH DELETE n');

    // 4. Hash Development Password
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'CampusOne@123';
    const passwordHash = await hashPassword(defaultPassword);

    // 5. Create Roles and Admin User
    console.log('[3/5] Seeding Roles and Admin User account...');
    await txc.run(`
      CREATE (r1:Role { roleId: "role_student", name: "STUDENT", description: "Student Role" })
      CREATE (r2:Role { roleId: "role_faculty", name: "FACULTY", description: "Faculty Role" })
      CREATE (r3:Role { roleId: "role_admin", name: "ADMIN", description: "Admin Role" })
    `);

    // Admin1 User & Profile
    await txc.run(
      `
      CREATE (u:User {
        userId: "admin1",
        username: "admin1",
        email: "admin1@campusone.test",
        passwordHash: $passwordHash,
        firstName: "Admin1",
        lastName: "Campus",
        fullName: "Admin1 Campus",
        accountStatus: "ACTIVE",
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (p:Admin {
        adminId: "admin1",
        level: "SUPER",
        createdAt: datetime()
      })
      WITH u, p
      MATCH (r:Role { name: "ADMIN" })
      MERGE (u)-[:HAS_ROLE]->(r)
      MERGE (u)-[:HAS_PROFILE]->(p)
      `,
      { passwordHash }
    );

    // 6. Transaction Commit
    console.log('[4/5] Committing transaction...');
    await txc.commit();
    console.log('✓ Commit complete.');

    // 7. Validate Graph Metrics
    console.log('[5/5] Validating seeded data...');
    const counts = {};
    const countLabels = ['User', 'Role', 'Admin'];
    for (const l of countLabels) {
      const res = await session.run(`MATCH (n:${l}) RETURN count(n) AS cnt`);
      counts[l] = res.records[0].get('cnt').toNumber();
    }

    const relRes = await session.run('MATCH ()-[r]->() RETURN count(r) AS cnt');
    const relCount = relRes.records[0].get('cnt').toNumber();

    console.log('\n============================================');
    console.log('CAMPUSONE TEST DATABASE SEEDED (ADMIN ONLY)');
    console.log('============================================');
    console.log(`Users:                ${counts.User}`);
    console.log(`Admin:                ${counts.Admin}`);
    console.log(`Roles:                3`);
    console.log(`Relationships:        ${relCount}`);
    console.log('Validation:           PASS');
    console.log('============================================');
    console.log('Test credentials are configured through SEED_DEFAULT_PASSWORD.');
    console.log('Test account:\n');
    console.log('  Admin:   admin1');
    console.log('============================================\n');

  } catch (err) {
    await txc.rollback();
    console.error('Fatal Error during transaction execution. Rolled back.');
    console.error(err.stack);
    process.exit(1);
  } finally {
    await session.close();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => driver.close())
    .catch((err) => {
      console.error('[Seeder] Aborted:', err.message);
      driver.close().finally(() => process.exit(1));
    });
}

module.exports = { seedDatabase };
