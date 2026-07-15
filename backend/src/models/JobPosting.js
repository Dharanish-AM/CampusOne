const mongoose = require("mongoose");

const jobPostingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    requirements: {
      type: String,
      required: [true, "Job requirements are required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
    },
    salaryPackage: {
      type: String,
      required: [true, "Salary package is required"],
      trim: true,
    },
    minCgpa: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 10.0,
    },
    maxBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },
    eligibleDepartments: {
      type: [String],
      required: [true, "Eligible departments are required"],
    },
    eligibleSemesters: {
      type: [Number],
      required: [true, "Eligible semesters are required"],
    },
    deadline: {
      type: Date,
      required: [true, "Application deadline is required"],
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

module.exports = JobPosting;
