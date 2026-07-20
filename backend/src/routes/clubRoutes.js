const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getClubs,
  joinOrLeaveClub,
  getUpcomingEvents,
  rsvpToEvent,
  createClubEvent,
} = require("../controllers/clubController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/", getClubs);
router.post("/:clubId/join", joinOrLeaveClub);
router.get("/events", getUpcomingEvents);
router.post("/events/:eventId/rsvp", rsvpToEvent);
router.post("/:clubId/events", createClubEvent);

module.exports = router;
