/**
 * Centralized Error Handler Middleware
 * Catches operational errors (AppError) and unexpected bugs.
 * Never leaks internal Neo4j errors or stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  // Never log passwords or tokens
  const safeMessage = err.message || 'An unexpected error occurred.';
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Safe server-side log (no passwords, no hashes)
  if (statusCode >= 500) {
    console.error(`[Error] ${err.code || 'INTERNAL'} ${statusCode}: ${safeMessage}`);
    if (!isProduction) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.isOperational ? safeMessage : 'Internal server error.',
    ...(isProduction ? {} : { detail: safeMessage }),
  });
};

module.exports = errorHandler;
