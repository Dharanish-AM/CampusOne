const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Club name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Club description is required"],
      trim: true,
    },
    facultyAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Faculty advisor reference is required"],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        index: true,
      },
    ],
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    logoUrl: {
      type: String,
      default: "https://placehold.co/100x100/1e2634/ffffff?text=Club",
    },
  },
  {
    timestamps: true,
  },
);

const Club = mongoose.model("Club", clubSchema);

module.exports = Club;
