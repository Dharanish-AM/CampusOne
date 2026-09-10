/**
 * Centralized Password Utility
 *
 * Uses Argon2id for secure password hashing and verification.
 * Enforces minimum password length policy (>= 8 chars).
 */

const argon2 = require('argon2');

const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates password against policy rules.
 */
const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string' || password.trim().length < MIN_PASSWORD_LENGTH) {
    throw new Error(`[AUTH ERROR] Password must be a valid non-empty string with at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
};

/**
 * Hashes a plaintext password using Argon2id.
 */
const hashPassword = async (password) => {
  validatePasswordPolicy(password);
  return await argon2.hash(password, {
    type: argon2.argon2id,
  });
};

/**
 * Verifies a supplied password against an Argon2id hash.
 */
const verifyPassword = async (password, passwordHash) => {
  if (!password || !passwordHash) return false;
  try {
    return await argon2.verify(passwordHash, password);
  } catch (err) {
    return false;
  }
};

module.exports = {
  MIN_PASSWORD_LENGTH,
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
};
