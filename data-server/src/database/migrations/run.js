/**
 * Migration Runner for Neo4j Schema Migrations
 *
 * Tracks migrations in Neo4j via (:Neo4jSchemaMigration { migrationId, version, name, executedAt })
 * Idempotent: Executing multiple times checks status and avoids duplicate execution.
 *
 * Command: npm run db:migrate
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { driver } = require('../../config/neo4j');
const migration001 = require('./001-semantic-connectivity');
const migration002 = require('./002-class-sections');
const migration003 = require('./003-user-password-authentication');

const DB_NAME = process.env.NEO4J_DATABASE || 'neo4j';

const runMigrations = async () => {
  const session = driver.session({ database: DB_NAME });

  try {
    console.log('============================================');
    console.log('CAMPUSONE MIGRATION RUNNER');
    console.log('============================================');

    // Ensure migration constraint exists
    await session.run(`
      CREATE CONSTRAINT constraint_neo4jschemamigration_migrationid IF NOT EXISTS
      FOR (m:Neo4jSchemaMigration) REQUIRE m.migrationId IS UNIQUE
    `);

    const migrations = [migration001, migration002, migration003];

    for (const m of migrations) {
      const checkRes = await session.run(
        `MATCH (m:Neo4jSchemaMigration { migrationId: $migrationId }) RETURN m`,
        { migrationId: m.migrationId }
      );

      if (checkRes.records.length > 0) {
        console.log(`[MIGRATION RUNNER] Migration ${m.migrationId} already applied.`);
      } else {
        console.log(`[MIGRATION RUNNER] Executing migration ${m.migrationId}...`);
        await m.up(session);

        await session.run(
          `
          CREATE (m:Neo4jSchemaMigration {
            migrationId: $migrationId,
            version: $version,
            name: $name,
            executedAt: datetime()
          })
          `,
          { migrationId: m.migrationId, version: m.version, name: m.name }
        );
        console.log(`[MIGRATION RUNNER] Migration ${m.migrationId} recorded successfully.`);
      }
    }

    console.log('============================================');
    console.log('MIGRATIONS COMPLETE');
    console.log('============================================');

  } catch (err) {
    console.error('Migration Runner Error:', err);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
};

runMigrations();
