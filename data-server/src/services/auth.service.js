/**
 * Auth Service
 * All authentication business logic: login, registration, password change.
 * Never exposes passwordHash in return values.
 */

const userRepository = require('../repositories/user.repository');
const studentRepository = require('../repositories/student.repository');
const { hashPassword, verifyPassword, validatePasswordPolicy } = require('../utils/auth/password');
const { sanitizeUser } = require('../utils/auth/sanitize');
const { generateToken } = require('../utils/auth/token');
const { generateId, generateRegisterNumber, generateRollNumber } = require('../utils/idGenerator');
const AppError = require('../utils/AppError');

const GENERIC_AUTH_FAIL = 'Invalid username or password.';

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ username, password }) => {
  if (!username || !password) throw new AppError(GENERIC_AUTH_FAIL, 401);

  const user = await userRepository.findAuthUserByIdentifier(username.trim());
  if (!user) throw new AppError(GENERIC_AUTH_FAIL, 401);

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('Account is inactive or suspended. Contact administration.', 401, 'ACCOUNT_INACTIVE');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new AppError(GENERIC_AUTH_FAIL, 401);

  await userRepository.updateLastLogin(user.userId);

  const token = generateToken({ userId: user.userId, username: user.username, role: user.role });

  return {
    token,
    user: sanitizeUser(user),
  };
};

// ─── Student Self-Registration ────────────────────────────────────────────────

const registerStudent = async (body) => {
  const {
    username, email, password,
    firstName, lastName, phone,
    dateOfBirth, gender, bloodGroup,
    departmentId, courseId, batchId, sectionId,
  } = body;

  // 1. Validate password policy
  try { validatePasswordPolicy(password); }
  catch (err) { throw new AppError(err.message, 400, 'VALIDATION_ERROR'); }

  // 2. Validate required fields
  if (!username || !email || !firstName || !lastName || !departmentId || !courseId || !batchId || !sectionId) {
    throw new AppError('Missing required fields for student registration.', 400, 'VALIDATION_ERROR');
  }

  // 3. Check username/email uniqueness
  const isUnique = await userRepository.checkUserUniqueness(username.trim(), email.trim().toLowerCase());
  if (!isUnique) throw new AppError('Username or email is already in use.', 409, 'CONFLICT');

  // 4. Validate academic hierarchy: Department → Course → Batch → Section
  const hierarchyError = await studentRepository.validateRegistrationHierarchy({
    departmentId, courseId, batchId, sectionId,
  });
  if (hierarchyError) throw new AppError(hierarchyError, 422, 'INVALID_RELATIONSHIP');

  // 5. Hash password
  const passwordHash = await hashPassword(password);

  // 6. Generate server-side IDs
  const userId    = generateId('user');
  const studentId = generateId('stu');
  const registerNumber = generateRegisterNumber();
  const rollNumber     = generateRollNumber();
  const admissionYear  = new Date().getFullYear();
  const graduationYear = admissionYear + 4;

  const user = {
    userId,
    username:  username.trim(),
    email:     email.trim().toLowerCase(),
    passwordHash,
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    fullName:  `${firstName.trim()} ${lastName.trim()}`,
    dateOfBirth: dateOfBirth || null,
    gender:      gender || null,
    bloodGroup:  bloodGroup || null,
    phone:       phone || null,
  };

  const student = {
    studentId,
    registerNumber,
    rollNumber,
    admissionDate: new Date().toISOString().split('T')[0],
    graduationYear,
  };

  const refs = { departmentId, courseId, batchId, sectionId };

  // 7. Transactional creation — all or nothing
  const result = await userRepository.createStudentWithUser({ user, student, refs });

  return {
    message: 'Student registered successfully.',
    userId: result.userId,
    studentId: result.studentId,
  };
};

// ─── Get Current User (me) ────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await userRepository.findAuthUserById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  return sanitizeUser(user);
};

// ─── Change Password ──────────────────────────────────────────────────────────

const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required.', 400, 'VALIDATION_ERROR');
  }

  try { validatePasswordPolicy(newPassword); }
  catch (err) { throw new AppError(err.message, 400, 'VALIDATION_ERROR'); }

  const existingHash = await userRepository.getPasswordHash(userId);
  if (!existingHash) throw new AppError('User not found.', 404);

  const isValid = await verifyPassword(currentPassword, existingHash);
  if (!isValid) throw new AppError('Current password is incorrect.', 401, 'INVALID_PASSWORD');

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePasswordHash(userId, newHash);

  return { message: 'Password changed successfully.' };
};

module.exports = { login, registerStudent, getMe, changePassword };
