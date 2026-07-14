const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  createSubject,
  getSubjects,
  markAttendance,
  getStudentAttendance,
} = require("../controllers/attendanceController");
const {
  createSubjectSchema,
  markAttendanceSchema,
} = require("../utils/attendanceSchemas");

const router = express.Router();

// Apply protect to all routes in this router
router.use(protect);

// Subjects endpoints
router.post(
  "/subjects",
  authorizeRoles("faculty", "admin"),
  validate(createSubjectSchema),
  createSubject,
);
router.get("/subjects", getSubjects);

// Attendance endpoints
router.post(
  "/",
  authorizeRoles("faculty", "admin"),
  validate(markAttendanceSchema),
  markAttendance,
);
router.get("/student", getStudentAttendance);

module.exports = router;
