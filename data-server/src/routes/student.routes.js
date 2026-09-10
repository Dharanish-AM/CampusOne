const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

// All student routes require authentication + STUDENT role
router.use(authenticate, requireRole('STUDENT'));

router.get('/me',           studentController.getMe);
router.patch('/me',         studentController.updateMe);
router.get('/me/timetable', studentController.getMyTimetable);
router.get('/me/results',   studentController.getMyResults);
router.get('/me/subjects',  studentController.getMySubjects);

module.exports = router;
