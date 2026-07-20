const Club = require("../models/Club");
const ClubEvent = require("../models/ClubEvent");
const Student = require("../models/Student");

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Private
const getClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find()
      .populate({
        path: "facultyAdvisor",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ name: 1 });

    res.status(200).json({
      status: "success",
      data: clubs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join or leave a club
// @route   POST /api/clubs/:clubId/join
// @access  Private (Student)
const joinOrLeaveClub = async (req, res, next) => {
  const { clubId } = req.params;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const club = await Club.findById(clubId);
    if (!club) {
      const error = new Error("Club not found");
      error.statusCode = 404;
      return next(error);
    }

    const isMember = club.members.includes(student._id);

    if (isMember) {
      // Leave club
      club.members = club.members.filter((m) => m.toString() !== student._id.toString());
    } else {
      // Join club
      club.members.push(student._id);
    }

    await club.save();

    const populatedClub = await Club.findById(club._id).populate({
      path: "facultyAdvisor",
      populate: {
        path: "userId",
        select: "name email",
      },
    });

    res.status(200).json({
      status: "success",
      data: populatedClub,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all upcoming club events
// @route   GET /api/clubs/events
// @access  Private
const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await ClubEvent.find({ dateTime: { $gte: new Date() } })
      .populate("clubId")
      .sort({ dateTime: 1 });

    res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    RSVP to a club event
// @route   POST /api/clubs/events/:eventId/rsvp
// @access  Private (Student)
const rsvpToEvent = async (req, res, next) => {
  const { eventId } = req.params;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const event = await ClubEvent.findById(eventId).populate("clubId");
    if (!event) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      return next(error);
    }

    const hasRsvpd = event.rsvps.includes(student._id);

    if (hasRsvpd) {
      // Cancel RSVP
      event.rsvps = event.rsvps.filter((r) => r.toString() !== student._id.toString());
    } else {
      // Register RSVP
      event.rsvps.push(student._id);
    }

    await event.save();

    res.status(200).json({
      status: "success",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new club event
// @route   POST /api/clubs/:clubId/events
// @access  Private (Student Coordinator / Admin)
const createClubEvent = async (req, res, next) => {
  const { clubId } = req.params;
  const { title, description, dateTime, venue } = req.body;

  try {
    if (!title || !description || !dateTime || !venue) {
      const error = new Error("Title, description, dateTime, and venue are required");
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const club = await Club.findById(clubId);
    if (!club) {
      const error = new Error("Club not found");
      error.statusCode = 404;
      return next(error);
    }

    // Verify student is coordinator or if user is admin
    const isCoordinator = club.coordinators.some(
      (coordId) => coordId.toString() === student._id.toString()
    );

    if (!isCoordinator && req.user.role !== "admin") {
      const error = new Error("Unauthorized: Only club coordinators can post events");
      error.statusCode = 403;
      return next(error);
    }

    const event = await ClubEvent.create({
      clubId: club._id,
      title,
      description,
      dateTime,
      venue,
    });

    const populatedEvent = await ClubEvent.findById(event._id).populate("clubId");

    res.status(201).json({
      status: "success",
      data: populatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClubs,
  joinOrLeaveClub,
  getUpcomingEvents,
  rsvpToEvent,
  createClubEvent,
};
