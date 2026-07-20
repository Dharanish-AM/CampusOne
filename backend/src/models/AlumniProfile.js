const mongoose = require("mongoose");

const alumniProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    graduationYear: {
      type: Number,
      required: [true, "Graduation year is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      index: true,
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    linkedInUrl: {
      type: String,
      trim: true,
    },
    isMentor: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Search optimization compound index
alumniProfileSchema.index({ company: 1, isMentor: 1 });

const AlumniProfile = mongoose.model("AlumniProfile", alumniProfileSchema);

module.exports = AlumniProfile;
