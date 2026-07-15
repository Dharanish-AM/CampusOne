const HostelAllocation = require("../models/HostelAllocation");
const GatePassRequest = require("../models/GatePassRequest");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

// @desc    Get current student's hostel room allocation and roommates list
// @route   GET /api/hostels/allocation
// @access  Private (Student)
const getHostelAllocation = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const allocation = await HostelAllocation.findOne({
      studentId: student._id,
    }).populate({
      path: "wardenId",
      populate: { path: "userId", select: "name email" },
    });

    if (!allocation) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "You do not have a hostel room allocated.",
      });
    }

    // Find roommates (students allocated in the same block and room, excluding self)
    const roommateAllocations = await HostelAllocation.find({
      block: allocation.block,
      roomNumber: allocation.roomNumber,
      studentId: { $ne: student._id },
    }).populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" },
    });

    const roommates = roommateAllocations.map((alloc) => ({
      studentId: alloc.studentId._id,
      name: alloc.studentId.userId.name,
      email: alloc.studentId.userId.email,
      rollNumber: alloc.studentId.rollNumber,
      department: alloc.studentId.department,
    }));

    res.status(200).json({
      status: "success",
      data: {
        allocation: {
          id: allocation._id,
          block: allocation.block,
          roomNumber: allocation.roomNumber,
          allocatedAt: allocation.allocatedAt,
        },
        warden: {
          id: allocation.wardenId?._id,
          name: allocation.wardenId?.userId?.name || "N/A",
          email: allocation.wardenId?.userId?.email || "N/A",
          department: allocation.wardenId?.department,
        },
        roommates,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a new gate pass
// @route   POST /api/hostels/gatepass
// @access  Private (Student)
const requestGatePass = async (req, res, next) => {
  const { reason, leaveType, departureTime, expectedReturnTime } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if there is already a pending gate pass request
    const existingPending = await GatePassRequest.findOne({
      studentId: student._id,
      status: "pending",
    });

    if (existingPending) {
      const error = new Error("You already have a pending gate pass request.");
      error.statusCode = 400;
      return next(error);
    }

    const gatePass = await GatePassRequest.create({
      studentId: student._id,
      reason,
      leaveType,
      departureTime,
      expectedReturnTime,
    });

    // Notify wardens via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("notification:new", {
        type: "hostel",
        title: "New Gate Pass Request",
        message: `${req.user.name} has requested a gate pass for ${leaveType}.`,
        gatePassId: gatePass._id,
      });
    }

    res.status(201).json({
      status: "success",
      data: gatePass,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's gate passes history
// @route   GET /api/hostels/gatepass/student
// @access  Private (Student)
const getStudentGatePasses = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const requests = await GatePassRequest.find({
      studentId: student._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all gate passes for warden review
// @route   GET /api/hostels/gatepass/warden
// @access  Private (Warden / Admin)
const getWardenGatePasses = async (req, res, next) => {
  try {
    const requests = await GatePassRequest.find({})
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" },
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

// @desc    Approve or reject a gate pass request
// @route   PATCH /api/hostels/gatepass/:id/status
// @access  Private (Warden / Admin)
const updateGatePassStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const gatePass = await GatePassRequest.findById(id).populate("studentId");
    if (!gatePass) {
      const error = new Error("Gate pass request not found");
      error.statusCode = 404;
      return next(error);
    }

    if (gatePass.status !== "pending") {
      const error = new Error(
        "This gate pass request has already been processed.",
      );
      error.statusCode = 400;
      return next(error);
    }

    gatePass.status = status;
    gatePass.approvedBy = req.user._id;
    gatePass.approvedAt = new Date();
    if (status === "rejected" && rejectionReason) {
      gatePass.rejectionReason = rejectionReason;
    }

    await gatePass.save();

    // Emit live push notification to the student room channel
    const io = req.app.get("io");
    if (io && gatePass.studentId) {
      io.to(`student_${gatePass.studentId._id}`).emit("notification:new", {
        type: "hostel",
        title: "Gate Pass Update",
        message: `Your gate pass request has been '${status}'.`,
        gatePassId: gatePass._id,
      });
    }

    res.status(200).json({
      status: "success",
      data: gatePass,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin room allocation mapping creation
// @route   POST /api/hostels/allocations
// @access  Private (Admin)
const createHostelAllocation = async (req, res, next) => {
  const { studentId, block, roomNumber, wardenId } = req.body;

  try {
    // 1. Check if student already has room
    const existing = await HostelAllocation.findOne({ studentId });
    if (existing) {
      const error = new Error("Student already has a hostel room allocated.");
      error.statusCode = 400;
      return next(error);
    }

    const allocation = await HostelAllocation.create({
      studentId,
      block,
      roomNumber,
      wardenId,
    });

    res.status(201).json({
      status: "success",
      data: allocation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHostelAllocation,
  requestGatePass,
  getStudentGatePasses,
  getWardenGatePasses,
  updateGatePassStatus,
  createHostelAllocation,
};
