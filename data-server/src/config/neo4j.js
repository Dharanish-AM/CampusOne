const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'your_password';
const database = process.env.NEO4J_DATABASE || 'neo4j';

// Create single reusable driver instance for the application
const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(user, password)
);

/**
 * Verifies connectivity with the Neo4j database instance.
 * Executes a simple verification query and ensures session cleanup.
 */
const verifyNeo4jConnection = async () => {
  const session = driver.session({ database });
  try {
    const result = await session.run('RETURN 1 AS result');
    const value = result.records[0].get('result').toNumber();
    if (value === 1) {
      console.log(`[Neo4j] Connected successfully to database "${database}" at ${uri}`);
      return true;
    } else {
      throw new Error('Neo4j verification query returned unexpected result.');
    }
  } catch (error) {
    console.error('[Neo4j] Database connection failed:', error.message);
    throw error;
  } finally {
    await session.close();
  }
};

/**
 * Gracefully closes the reusable Neo4j driver instance.
 */
const closeNeo4jDriver = async () => {
  try {
    await driver.close();
    console.log('[Neo4j] Driver connection closed successfully.');
  } catch (error) {
    console.error('[Neo4j] Error closing driver connection:', error.message);
  }
};

module.exports = {
  driver,
  verifyNeo4jConnection,
  closeNeo4jDriver
};
