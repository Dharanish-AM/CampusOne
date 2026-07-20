const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    alumniId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AlumniProfile",
      required: [true, "Alumni reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Search optimization compound index
mentorshipRequestSchema.index({ studentId: 1, status: 1 });

const MentorshipRequest = mongoose.model("MentorshipRequest", mentorshipRequestSchema);

module.exports = MentorshipRequest;
