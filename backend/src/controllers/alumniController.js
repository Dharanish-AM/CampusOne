const AlumniProfile = require("../models/AlumniProfile");
const MentorshipRequest = require("../models/MentorshipRequest");
const Student = require("../models/Student");

// @desc    Get all alumni directory listings
// @route   GET /api/alumni
// @access  Private
const getAlumniDirectory = async (req, res, next) => {
  const { q, department, company, isMentor } = req.query;

  try {
    const filter = {};

    if (department && department !== "all") {
      filter.department = department;
    }

    if (company && company.trim() !== "") {
      filter.company = { $regex: company, $options: "i" };
    }

    if (isMentor === "true" || isMentor === true) {
      filter.isMentor = true;
    }

    let alumni = await AlumniProfile.find(filter)
      .populate("userId", "name email")
      .sort({ graduationYear: -1 });

    // Local filter if search query 'q' matches name, company, or position
    if (q && q.trim() !== "") {
      const regex = new RegExp(q, "i");
      alumni = alumni.filter(
        (item) =>
          (item.userId && regex.test(item.userId.name)) ||
          regex.test(item.company) ||
          regex.test(item.position)
      );
    }

    res.status(200).json({
      status: "success",
      data: alumni,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request mentorship from an alumnus
// @route   POST /api/alumni/mentorship
// @access  Private (Student)
const requestMentorship = async (req, res, next) => {
  const { alumniId, notes } = req.body;

  try {
    if (!alumniId) {
      const error = new Error("Alumni ID is required");
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const alumnus = await AlumniProfile.findById(alumniId);
    if (!alumnus) {
      const error = new Error("Alumni profile not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if duplicate request exists
    const existing = await MentorshipRequest.findOne({
      studentId: student._id,
      alumniId: alumnus._id,
    });

    if (existing) {
      const error = new Error("Mentorship request has already been submitted for this alumnus");
      error.statusCode = 400;
      return next(error);
    }

    const requestRecord = await MentorshipRequest.create({
      studentId: student._id,
      alumniId: alumnus._id,
      status: "pending",
      notes,
    });

    const populatedRequest = await MentorshipRequest.findById(requestRecord._id).populate({
      path: "alumniId",
      populate: {
        path: "userId",
        select: "name email",
      },
    });

    res.status(201).json({
      status: "success",
      data: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentorship request logs of student
// @route   GET /api/alumni/my-requests
// @access  Private (Student)
const getStudentMentorshipRequests = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const requests = await MentorshipRequest.find({ studentId: student._id })
      .populate({
        path: "alumniId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlumniDirectory,
  requestMentorship,
  getStudentMentorshipRequests,
};
