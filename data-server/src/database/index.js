const { driver, closeNeo4jDriver, verifyConnection } = require('../config/neo4j');
const schema = require('./neo4j/schema');

module.exports = {
  driver,
  closeNeo4jDriver,
  verifyConnection,
  ...schema,
};
