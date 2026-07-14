const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Faculty is required"],
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["lecture", "lab", "exam"],
      default: "lecture",
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: function () {
        return this.isRecurring === true;
      },
    },
    date: {
      type: Date,
      required: function () {
        return this.isRecurring === false;
      },
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. "09:00")'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. "10:00")'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      index: true,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      index: true,
    },
    batch: {
      type: String,
      required: [true, "Batch is required"],
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Performance index on filters
timetableSchema.index({ department: 1, semester: 1, batch: 1 });

const Timetable = mongoose.model("Timetable", timetableSchema);

module.exports = Timetable;
