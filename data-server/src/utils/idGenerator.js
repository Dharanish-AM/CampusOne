/**
 * Server-side ID Generator
 * Generates domain-safe IDs that are never trusted from client input.
 */

const { v4: uuidv4 } = (() => {
  try { return require('uuid'); } catch { return { v4: null }; }
})();

const crypto = require('crypto');

/**
 * Generates a prefixed, timestamp-based unique ID.
 * Format: <prefix>_<timestamp_base36>_<random_hex>
 * e.g. stu_lq4abc_f3a2
 */
const generateId = (prefix = 'id') => {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(3).toString('hex');
  return `${prefix}_${ts}_${rand}`;
};

/**
 * Generates a register number in format REGyyyyNNNN
 * Caller must ensure uniqueness check separately.
 */
const generateRegisterNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REG${year}${rand}`;
};

/**
 * Generates a roll number in format ROLLyyyyNNNN
 */
const generateRollNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ROLL${year}${rand}`;
};

module.exports = { generateId, generateRegisterNumber, generateRollNumber };
