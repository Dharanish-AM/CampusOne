const mongoose = require("mongoose");

const healthAppointmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Reason for appointment is required"],
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, "Appointment date and time are required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    prescription: {
      type: String,
      default: null,
      trim: true,
    },
    medicalLeaveApproved: {
      type: Boolean,
      default: false,
    },
    medicalLeaveDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for querying a student's specific appointments by status
healthAppointmentSchema.index({ studentId: 1, status: 1 });

const HealthAppointment = mongoose.model(
  "HealthAppointment",
  healthAppointmentSchema,
);

module.exports = HealthAppointment;
