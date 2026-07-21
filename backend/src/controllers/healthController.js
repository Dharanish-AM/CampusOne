const HealthAppointment = require("../models/HealthAppointment");
const Student = require("../models/Student");

// @desc    Book a new health center appointment
// @route   POST /api/health/appointments
// @access  Private (Student)
const bookAppointment = async (req, res, next) => {
  const { doctorName, reason, dateTime } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const appointment = await HealthAppointment.create({
      studentId: student._id,
      doctorName,
      reason,
      dateTime: new Date(dateTime),
    });

    res.status(201).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's health appointments history
// @route   GET /api/health/appointments/student
// @access  Private (Student)
const getStudentAppointments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const appointments = await HealthAppointment.find({ studentId: student._id })
      .sort({ dateTime: -1 });

    res.status(200).json({
      status: "success",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (Faculty/Admin)
// @route   GET /api/health/appointments
// @access  Private (Faculty/Admin)
const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await HealthAppointment.find()
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ dateTime: -1 });

    res.status(200).json({
      status: "success",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update health appointment status, prescription, or medical leave
// @route   PATCH /api/health/appointments/:id
// @access  Private (Student/Faculty/Admin)
const updateAppointment = async (req, res, next) => {
  const { id } = req.params;
  const { status, prescription, medicalLeaveApproved, medicalLeaveDays } = req.body;

  try {
    const appointment = await HealthAppointment.findById(id);
    if (!appointment) {
      const error = new Error("Appointment not found");
      error.statusCode = 404;
      return next(error);
    }

    // Role-based validations
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || String(appointment.studentId) !== String(student._id)) {
        const error = new Error("Not authorized to update this appointment");
        error.statusCode = 403;
        return next(error);
      }

      // Students can only cancel scheduled appointments
      if (status !== "cancelled") {
        const error = new Error("Students can only cancel appointments");
        error.statusCode = 400;
        return next(error);
      }

      if (appointment.status !== "scheduled") {
        const error = new Error("Can only cancel scheduled appointments");
        error.statusCode = 400;
        return next(error);
      }

      appointment.status = "cancelled";
    } else if (["admin", "faculty"].includes(req.user.role)) {
      // Faculty / Admin can update everything
      if (status !== undefined) appointment.status = status;
      if (prescription !== undefined) appointment.prescription = prescription;
      if (medicalLeaveApproved !== undefined) appointment.medicalLeaveApproved = medicalLeaveApproved;
      if (medicalLeaveDays !== undefined) appointment.medicalLeaveDays = medicalLeaveDays;
    } else {
      const error = new Error("Unauthorized to perform this action");
      error.statusCode = 403;
      return next(error);
    }

    await appointment.save();

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getStudentAppointments,
  getAllAppointments,
  updateAppointment,
};
