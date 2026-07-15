const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  createCompany,
  getCompanies,
  createJobPosting,
  getJobPostings,
  getJobDetails,
  applyToJob,
  getStudentApplications,
  getJobApplications,
  updateApplicationStatus,
} = require("../controllers/placementController");
const {
  createCompanySchema,
  createJobSchema,
  applyJobSchema,
  updateApplicationStatusSchema,
} = require("../utils/placementSchemas");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Company endpoints
router.post(
  "/companies",
  authorizeRoles("admin", "placement_officer"),
  validate(createCompanySchema),
  createCompany,
);
router.get("/companies", getCompanies);

// Job Posting endpoints
router.post(
  "/jobs",
  authorizeRoles("admin", "placement_officer"),
  validate(createJobSchema),
  createJobPosting,
);
router.get("/jobs", getJobPostings);
router.get("/jobs/:id", getJobDetails);

// Application endpoints
router.post(
  "/jobs/:id/apply",
  authorizeRoles("student"),
  validate(applyJobSchema),
  applyToJob,
);
router.get(
  "/applications/student",
  authorizeRoles("student"),
  getStudentApplications,
);
router.get(
  "/jobs/:id/applications",
  authorizeRoles("admin", "placement_officer"),
  getJobApplications,
);
router.patch(
  "/applications/:id/status",
  authorizeRoles("admin", "placement_officer"),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

module.exports = router;
