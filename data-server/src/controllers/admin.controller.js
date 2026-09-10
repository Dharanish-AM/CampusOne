/**
 * Admin Controller
 * Thin HTTP handler for all admin operations.
 * Never logs passwords or hashes.
 */

const adminService = require('../services/admin.service');

// ─── User Management ──────────────────────────────────────────────────────────

const createFaculty = async (req, res, next) => {
  try {
    const result = await adminService.createFaculty(req.body || {}, req.user.userId);
    res.status(201).json({ success: true, message: 'Faculty created.', data: result });
  } catch (err) { next(err); }
};

const createAdmin = async (req, res, next) => {
  try {
    const result = await adminService.createAdmin(req.body || {}, req.user.userId);
    res.status(201).json({ success: true, message: 'Admin created.', data: result });
  } catch (err) { next(err); }
};

const createStudent = async (req, res, next) => {
  try {
    const result = await adminService.createStudent(req.body || {}, req.user.userId);
    res.status(201).json({ success: true, message: 'Student created.', data: result });
  } catch (err) { next(err); }
};

const setAccountStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};
    const result = await adminService.setAccountStatus(userId, status);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
};

const getAllStudents = async (req, res, next) => {
  try {
    const students = await adminService.getAllStudents();
    res.status(200).json({ success: true, data: students });
  } catch (err) { next(err); }
};

const getAllFaculty = async (req, res, next) => {
  try {
    const faculty = await adminService.getAllFaculty();
    res.status(200).json({ success: true, data: faculty });
  } catch (err) { next(err); }
};

// ─── Academic Entities ────────────────────────────────────────────────────────

const getDepartments = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getDepartments() }); }
  catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const result = await adminService.createDepartment(req.body || {});
    res.status(201).json({ success: true, message: 'Department created.', data: result });
  } catch (err) { next(err); }
};

const getCourses = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getCourses() }); }
  catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  try {
    const { departmentId, ...data } = req.body || {};
    const result = await adminService.createCourse(data, departmentId);
    res.status(201).json({ success: true, message: 'Course created.', data: result });
  } catch (err) { next(err); }
};

const getBatches = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getBatches() }); }
  catch (err) { next(err); }
};

const getSections = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getSections() }); }
  catch (err) { next(err); }
};

const getSubjects = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getSubjects() }); }
  catch (err) { next(err); }
};

const createSubject = async (req, res, next) => {
  try {
    const { courseId, ...data } = req.body || {};
    const result = await adminService.createSubject(data, courseId);
    res.status(201).json({ success: true, message: 'Subject created.', data: result });
  } catch (err) { next(err); }
};

const createBatch = async (req, res, next) => {
  try {
    const { courseId, ...data } = req.body || {};
    const result = await adminService.createBatch(data, courseId);
    res.status(201).json({ success: true, message: 'Batch created.', data: result });
  } catch (err) { next(err); }
};

const createSection = async (req, res, next) => {
  try {
    const { batchId, ...data } = req.body || {};
    const result = await adminService.createSection(data, batchId);
    res.status(201).json({ success: true, message: 'Section created.', data: result });
  } catch (err) { next(err); }
};

// ─── Relationship Detail Handlers ─────────────────────────────────────────────

const getOverview = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await adminService.getOverview() }); }
  catch (err) { next(err); }
};

const getDepartmentDetail = async (req, res, next) => {
  try {
    const data = await adminService.getDepartmentDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getCourseDetail = async (req, res, next) => {
  try {
    const data = await adminService.getCourseDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getBatchDetail = async (req, res, next) => {
  try {
    const data = await adminService.getBatchDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSectionDetail = async (req, res, next) => {
  try {
    const data = await adminService.getSectionDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Section not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSubjectDetail = async (req, res, next) => {
  try {
    const data = await adminService.getSubjectDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getFacultyDetail = async (req, res, next) => {
  try {
    const data = await adminService.getFacultyDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getBatchSemesterDetail = async (req, res, next) => {
  try {
    const data = await adminService.getBatchSemesterDetail(req.params.batchId, req.params.semNum);
    if (!data) return res.status(404).json({ success: false, message: 'Semester record not found.' });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const assignCourseToSemester = async (req, res, next) => {
  try {
    const result = await adminService.assignCourseToSemester(req.params.batchId, req.params.semNum, req.body || {});
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

const removeCourseFromSemester = async (req, res, next) => {
  try {
    const result = await adminService.removeCourseFromSemester(req.params.batchId, req.params.semNum, req.params.courseId);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

module.exports = {
  createFaculty, createAdmin, createStudent, setAccountStatus,
  getAllUsers, getAllStudents, getAllFaculty,
  getDepartments, createDepartment,
  getCourses, createCourse,
  getBatches, createBatch,
  getSections, createSection,
  getSubjects, createSubject,
  // detail endpoints
  getOverview,
  getDepartmentDetail, getCourseDetail, getBatchDetail,
  getSectionDetail, getSubjectDetail, getFacultyDetail,
  // batch semester course assignment
  getBatchSemesterDetail, assignCourseToSemester, removeCourseFromSemester,
};

