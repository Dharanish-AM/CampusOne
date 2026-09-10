const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

// All faculty routes require authentication + FACULTY role
router.use(authenticate, requireRole('FACULTY'));

router.get('/me',           facultyController.getMe);
router.get('/me/subjects',  facultyController.getMySubjects);
router.get('/me/students',  facultyController.getMyStudents);
router.get('/me/timetable', facultyController.getMyTimetable);

module.exports = router;
