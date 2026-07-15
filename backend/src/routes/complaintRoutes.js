const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  createComplaint,
  getStudentComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
} = require("../controllers/complaintController");
const {
  createComplaintSchema,
  updateComplaintSchema,
  assignComplaintSchema,
} = require("../utils/complaintSchemas");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Student endpoints
router.post(
  "/",
  authorizeRoles("student"),
  validate(createComplaintSchema),
  createComplaint,
);
router.get("/student", authorizeRoles("student"), getStudentComplaints);

// Faculty & Admin endpoints
router.get("/", authorizeRoles("admin", "faculty"), getAllComplaints);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "faculty"),
  validate(updateComplaintSchema),
  updateComplaintStatus,
);
router.patch(
  "/:id/assign",
  authorizeRoles("admin"),
  validate(assignComplaintSchema),
  assignComplaint,
);

module.exports = router;
