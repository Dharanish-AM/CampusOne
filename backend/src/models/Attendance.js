const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
      index: true, // Performance indexing
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject ID is required"],
      index: true, // Performance indexing
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
      index: true, // Performance indexing
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: [true, "Status is required"],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "MarkedBy User ID is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index to prevent marking duplicate attendance for a student, subject, and date.
attendanceSchema.index(
  { studentId: 1, subjectId: 1, date: 1 },
  { unique: true },
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
