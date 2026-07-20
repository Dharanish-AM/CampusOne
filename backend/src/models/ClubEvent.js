const mongoose = require("mongoose");

const clubEventSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Club reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, "Event date and time is required"],
      index: true,
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    rsvps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const ClubEvent = mongoose.model("ClubEvent", clubEventSchema);

module.exports = ClubEvent;
