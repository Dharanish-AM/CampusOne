require('dotenv').config();

const app = require('./src/app');
const { verifyNeo4jConnection, closeNeo4jDriver } = require('./src/config/neo4j');

const PORT = process.env.PORT || 3000;

let server;

const startServer = async () => {
  try {
    // Verify database connectivity prior to listening for HTTP requests
    console.log('[Server] Initializing Neo4j connection...');
    await verifyNeo4jConnection();

    // Start HTTP Server
    server = app.listen(PORT, () => {
      console.log(`[Server] CampusOne data-server is listening on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] API base endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('[Server] Fatal Error: Could not connect to Neo4j database.');
    console.error('[Server] Server startup aborted.');
    process.exit(1);
  }
};

/**
 * Handles graceful shutdown on receiving termination signals.
 */
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closeNeo4jDriver();
      console.log('[Server] Graceful shutdown completed. Exiting.');
      process.exit(0);
    });
  } else {
    closeNeo4jDriver().then(() => {
      process.exit(0);
    });
  }
};

// Listen for process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
startServer();
