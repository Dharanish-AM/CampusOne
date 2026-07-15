const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    resumeUrl: {
      type: String,
      required: [true, "Resume URL is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "selected"],
      default: "applied",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Enforce unique application per student per job
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;
