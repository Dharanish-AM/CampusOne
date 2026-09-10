/**
 * JWT Token Utility
 * Centralized token generation and verification using jsonwebtoken.
 * Secrets come from environment variables — never hardcoded.
 */

const jwt = require('jsonwebtoken');
const AppError = require('../AppError');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

if (!JWT_SECRET) {
  console.error('[AUTH] FATAL: JWT_SECRET environment variable is not set.');
}

/**
 * Generates a signed JWT access token.
 * Payload should contain: { userId, username, role }
 * Never include passwordHash or sensitive fields.
 */
const generateToken = (payload) => {
  if (!JWT_SECRET) throw new AppError('Authentication system misconfigured.', 500);
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifies and decodes a JWT token.
 * Throws AppError on invalid/expired tokens.
 */
const verifyToken = (token) => {
  if (!JWT_SECRET) throw new AppError('Authentication system misconfigured.', 500);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid or malformed token.', 401, 'TOKEN_INVALID');
  }
};

module.exports = { generateToken, verifyToken };
