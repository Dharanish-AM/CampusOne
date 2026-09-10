const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// ─── User Management ──────────────────────────────────────────────────────────
router.post('/users/faculty', adminController.createFaculty);
router.post('/users/student', adminController.createStudent);
router.post('/users/admin',   adminController.createAdmin);
router.patch('/users/:userId/status', adminController.setAccountStatus);

router.get('/users',    adminController.getAllUsers);
router.get('/students', adminController.getAllStudents);
router.get('/faculty',  adminController.getAllFaculty);

// ─── Institution Overview ─────────────────────────────────────────────────────
router.get('/overview', adminController.getOverview);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments',        adminController.getDepartments);
router.post('/departments',       adminController.createDepartment);
router.get('/departments/:id',    adminController.getDepartmentDetail);

// ─── Courses (Reusable Master Courses) ────────────────────────────────────────
router.get('/courses',            adminController.getCourses);
router.post('/courses',           adminController.createCourse);
router.get('/courses/:id',        adminController.getCourseDetail);

// ─── Batches & Semester Course Assignment ─────────────────────────────────────
router.get('/batches',            adminController.getBatches);
router.post('/batches',           adminController.createBatch);
router.get('/batches/:id',        adminController.getBatchDetail);
router.get('/batches/:batchId/semesters/:semNum', adminController.getBatchSemesterDetail);
router.post('/batches/:batchId/semesters/:semNum/courses', adminController.assignCourseToSemester);
router.delete('/batches/:batchId/semesters/:semNum/courses/:courseId', adminController.removeCourseFromSemester);

// ─── Sections ─────────────────────────────────────────────────────────────────
router.get('/sections',           adminController.getSections);
router.post('/sections',          adminController.createSection);
router.get('/sections/:id',       adminController.getSectionDetail);

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects',           adminController.getSubjects);
router.post('/subjects',          adminController.createSubject);
router.get('/subjects/:id',       adminController.getSubjectDetail);

// ─── Faculty Detail ───────────────────────────────────────────────────────────
router.get('/faculty/:id',        adminController.getFacultyDetail);

module.exports = router;
