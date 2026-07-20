const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAlumniDirectory,
  requestMentorship,
  getStudentMentorshipRequests,
} = require("../controllers/alumniController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/", getAlumniDirectory);
router.post("/mentorship", requestMentorship);
router.get("/my-requests", getStudentMentorshipRequests);

module.exports = router;
