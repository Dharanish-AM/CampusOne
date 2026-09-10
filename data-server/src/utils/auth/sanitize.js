/**
 * Centralized User Response Sanitizer
 * Guarantees passwordHash and password credentials are never exposed in API responses or logs.
 */

const sanitizeUser = (user) => {
  if (!user) return null;
  const clean = { ...user };
  delete clean.password;
  delete clean.passwordHash;
  delete clean.plainPassword;
  delete clean.rawPassword;
  delete clean.encryptedPassword;
  return clean;
};

module.exports = {
  sanitizeUser,
};
