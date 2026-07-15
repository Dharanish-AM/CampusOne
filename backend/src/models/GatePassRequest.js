const mongoose = require("mongoose");

const gatePassRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Reason for gate pass is required"],
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ["outing", "home"],
      required: [true, "Leave type is required"],
    },
    departureTime: {
      type: Date,
      required: [true, "Departure time is required"],
    },
    expectedReturnTime: {
      type: Date,
      required: [true, "Expected return time is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const GatePassRequest = mongoose.model(
  "GatePassRequest",
  gatePassRequestSchema,
);

module.exports = GatePassRequest;
