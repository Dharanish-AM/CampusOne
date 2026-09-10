/**
 * AppError — Operational error class.
 * Extends Error with statusCode and isOperational flag
 * so the global error handler can distinguish app errors from bugs.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
