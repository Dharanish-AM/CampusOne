const mongoose = require("mongoose");

const busLocationSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
      required: [true, "Route ID is required"],
      unique: true,
      index: true, // Core index lookup as per AGENTS.md
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    occupancy: {
      type: Number,
      default: 0,
    },
    speed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Performance index on updatedAt
busLocationSchema.index({ updatedAt: -1 });

const BusLocation = mongoose.model("BusLocation", busLocationSchema);

module.exports = BusLocation;
