const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  getHostelAllocation,
  requestGatePass,
  getStudentGatePasses,
  getWardenGatePasses,
  updateGatePassStatus,
  createHostelAllocation,
} = require("../controllers/hostelController");
const {
  createGatePassSchema,
  updateGatePassStatusSchema,
  createAllocationSchema,
} = require("../utils/hostelSchemas");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Hostel Room Allocation (Student)
router.get("/allocation", authorizeRoles("student"), getHostelAllocation);

// Gate Pass Request Endpoints (Student)
router.post(
  "/gatepass",
  authorizeRoles("student"),
  validate(createGatePassSchema),
  requestGatePass,
);
router.get(
  "/gatepass/student",
  authorizeRoles("student"),
  getStudentGatePasses,
);

// Gate Pass Warden Review Endpoints (Warden / Admin)
router.get(
  "/gatepass/warden",
  authorizeRoles("admin", "faculty", "placement_officer", "transport_staff"), // Faculty can act as warden
  getWardenGatePasses,
);
router.patch(
  "/gatepass/:id/status",
  authorizeRoles("admin", "faculty", "placement_officer", "transport_staff"),
  validate(updateGatePassStatusSchema),
  updateGatePassStatus,
);

// Admin-only Allocation Setup
router.post(
  "/allocations",
  authorizeRoles("admin"),
  validate(createAllocationSchema),
  createHostelAllocation,
);

module.exports = router;
