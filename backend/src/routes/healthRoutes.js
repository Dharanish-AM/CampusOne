const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  bookAppointment,
  getStudentAppointments,
  getAllAppointments,
  updateAppointment,
} = require("../controllers/healthController");
const {
  bookAppointmentSchema,
  updateAppointmentSchema,
} = require("../utils/healthSchemas");

const router = express.Router();

// Protect all routes
router.use(protect);

// Student endpoints
router.post(
  "/appointments",
  authorizeRoles("student"),
  validate(bookAppointmentSchema),
  bookAppointment,
);
router.get(
  "/appointments/student",
  authorizeRoles("student"),
  getStudentAppointments,
);

// Staff / Admin endpoints
router.get(
  "/appointments",
  authorizeRoles("admin", "faculty"),
  getAllAppointments,
);

// Unified update endpoint (accessible by Student for cancel, or Faculty/Admin for status/prescriptions)
router.patch(
  "/appointments/:id",
  validate(updateAppointmentSchema),
  updateAppointment,
);

module.exports = router;
