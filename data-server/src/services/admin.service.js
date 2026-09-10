/**
 * Admin Service
 * Business logic for admin-controlled user creation and institutional data management.
 */

const userRepository = require('../repositories/user.repository');
const studentRepository = require('../repositories/student.repository');
const facultyRepository = require('../repositories/faculty.repository');
const academicRepository = require('../repositories/academic.repository');
const { hashPassword, validatePasswordPolicy } = require('../utils/auth/password');
const { generateId, generateRegisterNumber, generateRollNumber } = require('../utils/idGenerator');
const AppError = require('../utils/AppError');

// ─── Create Faculty (Admin only) ──────────────────────────────────────────────

const createFaculty = async (body, createdByUserId) => {
  const { username, email, password, firstName, lastName, phone, departmentId,
          designation, qualification, specialization, joinDate } = body;

  if (!username || !email || !password || !firstName || !lastName) {
    throw new AppError('Missing required fields: username, email, password, firstName, lastName.', 400, 'VALIDATION_ERROR');
  }

  try { validatePasswordPolicy(password); }
  catch (err) { throw new AppError(err.message, 400, 'VALIDATION_ERROR'); }

  const isUnique = await userRepository.checkUserUniqueness(username.trim(), email.trim().toLowerCase());
  if (!isUnique) throw new AppError('Username or email already in use.', 409, 'CONFLICT');

  if (departmentId) {
    const dept = await academicRepository.getDepartmentById(departmentId);
    if (!dept) throw new AppError('Department does not exist.', 422, 'INVALID_RELATIONSHIP');
  }

  const passwordHash = await hashPassword(password);
  const userId    = generateId('user');
  const facultyId = generateId('fac');
  const employeeId = `EMP${Date.now().toString(36).toUpperCase()}`;

  const user = {
    userId, username: username.trim(), email: email.trim().toLowerCase(), passwordHash,
    firstName: firstName.trim(), lastName: lastName.trim(),
    fullName: `${firstName.trim()} ${lastName.trim()}`, phone: phone || null,
  };

  const faculty = {
    facultyId, employeeId,
    designation:   designation   || 'Assistant Professor',
    qualification: qualification || null,
    specialization: specialization || null,
    joinDate: joinDate || new Date().toISOString().split('T')[0],
  };

  const refs = { departmentId: departmentId || null };
  return userRepository.createFacultyWithUser({ user, faculty, refs });
};

// ─── Create Admin (Admin only) ────────────────────────────────────────────────

const createAdmin = async (body, createdByUserId) => {
  const { username, email, password, firstName, lastName, phone, level } = body;

  if (!username || !email || !password || !firstName || !lastName) {
    throw new AppError('Missing required fields.', 400, 'VALIDATION_ERROR');
  }

  try { validatePasswordPolicy(password); }
  catch (err) { throw new AppError(err.message, 400, 'VALIDATION_ERROR'); }

  const isUnique = await userRepository.checkUserUniqueness(username.trim(), email.trim().toLowerCase());
  if (!isUnique) throw new AppError('Username or email already in use.', 409, 'CONFLICT');

  const passwordHash = await hashPassword(password);
  const userId  = generateId('user');
  const adminId = generateId('adm');

  const user = {
    userId, username: username.trim(), email: email.trim().toLowerCase(), passwordHash,
    firstName: firstName.trim(), lastName: lastName.trim(),
    fullName: `${firstName.trim()} ${lastName.trim()}`, phone: phone || null,
  };

  const admin = { adminId, level: level || 'DEPARTMENT' };
  return userRepository.createAdminWithUser({ user, admin });
};

// ─── Create Student (Admin only) ──────────────────────────────────────────────

const createStudent = async (body, createdByUserId) => {
  const { username, email, password, firstName, lastName, phone,
          dateOfBirth, gender, bloodGroup, departmentId, courseId, batchId, sectionId } = body;

  if (!username || !email || !password || !firstName || !lastName || !departmentId || !courseId || !batchId || !sectionId) {
    throw new AppError('Missing required fields.', 400, 'VALIDATION_ERROR');
  }

  try { validatePasswordPolicy(password); }
  catch (err) { throw new AppError(err.message, 400, 'VALIDATION_ERROR'); }

  const isUnique = await userRepository.checkUserUniqueness(username.trim(), email.trim().toLowerCase());
  if (!isUnique) throw new AppError('Username or email already in use.', 409, 'CONFLICT');

  const hierarchyError = await studentRepository.validateRegistrationHierarchy({ departmentId, courseId, batchId, sectionId });
  if (hierarchyError) throw new AppError(hierarchyError, 422, 'INVALID_RELATIONSHIP');

  const passwordHash = await hashPassword(password);
  const userId    = generateId('user');
  const studentId = generateId('stu');

  const user = {
    userId, username: username.trim(), email: email.trim().toLowerCase(), passwordHash,
    firstName: firstName.trim(), lastName: lastName.trim(),
    fullName: `${firstName.trim()} ${lastName.trim()}`,
    dateOfBirth: dateOfBirth || null, gender: gender || null,
    bloodGroup: bloodGroup || null, phone: phone || null,
  };

  const student = {
    studentId, registerNumber: generateRegisterNumber(), rollNumber: generateRollNumber(),
    admissionDate: new Date().toISOString().split('T')[0],
    graduationYear: new Date().getFullYear() + 4,
  };

  return userRepository.createStudentWithUser({ user, student, refs: { departmentId, courseId, batchId, sectionId } });
};

// ─── Account Management ───────────────────────────────────────────────────────

const setAccountStatus = async (userId, status) => {
  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
  if (!validStatuses.includes(status)) throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}.`, 400, 'VALIDATION_ERROR');
  await userRepository.updateAccountStatus(userId, status);
  return { message: `Account status updated to ${status}.` };
};

const getAllUsers     = async () => userRepository.getAllUsers();
const getAllStudents  = async () => studentRepository.getAllStudents();
const getAllFaculty   = async () => facultyRepository.getAllFaculty();

// ─── Academic Entity Reads (Admin) ────────────────────────────────────────────

const getDepartments = async () => academicRepository.getAllDepartments();
const getCourses     = async () => academicRepository.getAllCourses();
const getBatches     = async () => academicRepository.getAllBatches();
const getSections    = async () => academicRepository.getAllSections();
const getSubjects    = async () => academicRepository.getAllSubjects();

const createDepartment = async (data) => {
  const departmentId = data.departmentId || data.id || generateId('dept');
  const name = data.name || data.departmentName;
  const code = data.code || data.departmentCode;
  const description = data.description || '';
  if (!name || !code) {
    throw new AppError('name and code are required.', 400, 'VALIDATION_ERROR');
  }
  return academicRepository.createDepartment({ departmentId, name: name.trim(), code: code.trim(), description: description.trim() });
};


const createCourse = async (data, departmentId) => {
  const courseId = data.courseId || generateId('crs');
  const courseName = data.courseName || data.name;
  const courseCode = data.courseCode || data.code;
  const duration = Number(data.duration || 4);
  const totalCredits = Number(data.totalCredits || data.credits || 120);

  if (!courseName || !courseCode) {
    throw new AppError('name and code are required.', 400, 'VALIDATION_ERROR');
  }
  if (departmentId) {
    const dept = await academicRepository.getDepartmentById(departmentId);
    if (!dept) throw new AppError('Department does not exist.', 422, 'INVALID_RELATIONSHIP');
  }
  return academicRepository.createCourse({ courseId, courseName, courseCode, duration, totalCredits, level: data.level || 'UNDERGRADUATE' }, departmentId);
};

const createSubject = async (data, courseId) => {
  const subjectId = data.subjectId || generateId('sub');
  const name = data.name || data.subjectName;
  const code = data.code || data.subjectCode;
  const credits = Number(data.credits || 3);
  const semester = Number(data.semester || 1);

  if (!name || !code) {
    throw new AppError('name and code are required.', 400, 'VALIDATION_ERROR');
  }
  return academicRepository.createSubject({ subjectId, name, code, credits, semester }, courseId);
};

const createBatch = async (data, courseId) => {
  const batchId = data.batchId || generateId('batch');
  const name = data.name || data.batchName;
  const year = Number(data.year || new Date().getFullYear());

  if (!name) {
    throw new AppError('batch name is required.', 400, 'VALIDATION_ERROR');
  }
  return academicRepository.createBatch({ batchId, name, year }, courseId);
};

const createSection = async (data, batchId) => {
  const sectionId = data.sectionId || generateId('sec');
  const name = data.name || data.displayName;

  if (!name) {
    throw new AppError('section name is required.', 400, 'VALIDATION_ERROR');
  }
  return academicRepository.createSection({ sectionId, name }, batchId);
};

// ─── Relationship Detail Reads ────────────────────────────────────────────────

const getDepartmentDetail   = async (id) => academicRepository.getDepartmentWithRelations(id);
const getCourseDetail       = async (id) => academicRepository.getCourseWithRelations(id);
const getBatchDetail        = async (id) => academicRepository.getBatchWithRelations(id);
const getSectionDetail      = async (id) => academicRepository.getSectionWithRelations(id);
const getSubjectDetail      = async (id) => academicRepository.getSubjectWithRelations(id);
const getFacultyDetail      = async (id) => facultyRepository.getFacultyWithRelations(id);
const getOverview           = async ()  => academicRepository.getInstitutionOverview();

const getBatchSemesterDetail = async (batchId, semNum) => academicRepository.getBatchSemesterDetail(batchId, semNum);
const assignCourseToSemester = async (batchId, semNum, data) => academicRepository.assignCourseToBatchSemester(batchId, semNum, data);
const removeCourseFromSemester = async (batchId, semNum, courseId) => academicRepository.removeCourseFromBatchSemester(batchId, semNum, courseId);

module.exports = {
  createFaculty, createAdmin, createStudent,
  setAccountStatus, getAllUsers, getAllStudents, getAllFaculty,
  getDepartments, getCourses, getBatches, getSections, getSubjects,
  createDepartment, createCourse, createSubject, createBatch, createSection,
  // detail & semester course assignment
  getDepartmentDetail, getCourseDetail, getBatchDetail,
  getSectionDetail, getSubjectDetail, getFacultyDetail, getOverview,
  getBatchSemesterDetail, assignCourseToSemester, removeCourseFromSemester,
};

