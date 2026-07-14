const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Core index as per AGENTS.md
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Core index as per AGENTS.md
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    parentPhoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    codingHandles: {
      leetcode: { type: String, trim: true, default: null },
      codeforces: { type: String, trim: true, default: null },
      github: { type: String, trim: true, default: null },
    },
  },
  {
    timestamps: true,
  },
);

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
