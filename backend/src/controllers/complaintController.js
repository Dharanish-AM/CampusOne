const Complaint = require("../models/Complaint");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const User = require("../models/User");

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
const createComplaint = async (req, res, next) => {
  const { title, description, category } = req.body;

  try {
    // 1. Fetch student profile corresponding to current user
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    // 2. Create the complaint ticket
    const complaint = await Complaint.create({
      studentId: student._id,
      title,
      description,
      category,
      updates: [
        {
          status: "pending",
          comment: "Complaint filed successfully.",
          updatedBy: req.user._id,
        },
      ],
    });

    // 3. Return fully populated ticket
    const populated = await Complaint.findById(complaint._id)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name" },
      })
      .populate({ path: "updates.updatedBy", select: "name role" });

    res.status(201).json({
      status: "success",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints filed by the current student
// @route   GET /api/complaints/student
// @access  Private (Student)
const getStudentComplaints = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const filter = { studentId: student._id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const complaints = await Complaint.find(filter)
      .populate({
        path: "assignedTo",
        populate: { path: "userId", select: "name email" },
      })
      .populate({ path: "updates.updatedBy", select: "name role" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (or filter by assignment for Faculty)
// @route   GET /api/complaints
// @access  Private (Admin / Faculty)
const getAllComplaints = async (req, res, next) => {
  try {
    let filter = {};

    // Faculty can only view tickets assigned directly to them
    if (req.user.role === "faculty") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        const error = new Error("Faculty profile not found");
        error.statusCode = 404;
        return next(error);
      }
      filter.assignedTo = faculty._id;
    } else if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const complaints = await Complaint.find(filter)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name rollNumber department" },
      })
      .populate({
        path: "assignedTo",
        populate: { path: "userId", select: "name email" },
      })
      .populate({ path: "updates.updatedBy", select: "name role" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of a complaint
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin / Faculty)
const updateComplaintStatus = async (req, res, next) => {
  const { status, comment } = req.body;
  const { id } = req.params;

  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const error = new Error("Complaint not found");
      error.statusCode = 404;
      return next(error);
    }

    // Faculty check: can only update if assigned to them
    if (req.user.role === "faculty") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (
        !faculty ||
        !complaint.assignedTo ||
        complaint.assignedTo.toString() !== faculty._id.toString()
      ) {
        const error = new Error(
          "You are not authorized to update this complaint ticket.",
        );
        error.statusCode = 403;
        return next(error);
      }
    }

    // Add status update record and change main status
    complaint.status = status;
    complaint.updates.push({
      status,
      comment,
      updatedBy: req.user._id,
    });

    await complaint.save();

    // Populate ticket info for response and websocket payload
    const populated = await Complaint.findById(complaint._id)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name" },
      })
      .populate({
        path: "assignedTo",
        populate: { path: "userId", select: "name email" },
      })
      .populate({ path: "updates.updatedBy", select: "name role" });

    // Emit live coordinate status via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`student_${complaint.studentId}`).emit(
        "complaint:update",
        populated,
      );
    }

    res.status(200).json({
      status: "success",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a complaint to a faculty member
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin)
const assignComplaint = async (req, res, next) => {
  const { assignedTo } = req.body;
  const { id } = req.params;

  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      const error = new Error("Complaint not found");
      error.statusCode = 404;
      return next(error);
    }

    const faculty = await Faculty.findById(assignedTo).populate("userId");
    if (!faculty) {
      const error = new Error("Assigned faculty profile not found");
      error.statusCode = 404;
      return next(error);
    }

    complaint.assignedTo = faculty._id;
    complaint.updates.push({
      status: complaint.status,
      comment: `Ticket assigned to ${faculty.userId.name}.`,
      updatedBy: req.user._id,
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name" },
      })
      .populate({
        path: "assignedTo",
        populate: { path: "userId", select: "name email" },
      })
      .populate({ path: "updates.updatedBy", select: "name role" });

    // Emit socket notification to student
    const io = req.app.get("io");
    if (io) {
      io.to(`student_${complaint.studentId}`).emit(
        "complaint:update",
        populated,
      );
    }

    res.status(200).json({
      status: "success",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getStudentComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
};
