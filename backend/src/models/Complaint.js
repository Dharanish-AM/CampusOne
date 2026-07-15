const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved", "closed"],
    required: true,
  },
  comment: {
    type: String,
    required: [true, "Update comment is required"],
    trim: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "academic",
        "hostel",
        "transport",
        "cafeteria",
        "infrastructure",
        "others",
      ],
      required: [true, "Complaint category is required"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
      index: true,
    },
    updates: [updateSchema],
  },
  {
    timestamps: true,
  },
);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
