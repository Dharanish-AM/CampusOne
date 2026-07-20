const mongoose = require("mongoose");

const lostAndFoundItemSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Item report type is required"],
      index: true,
    },
    category: {
      type: String,
      enum: ["electronics", "documents", "keys", "clothing", "other"],
      required: [true, "Item category is required"],
    },
    location: {
      type: String,
      required: [true, "Item lost/found location is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "claimed", "resolved"],
      default: "open",
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

lostAndFoundItemSchema.index({ type: 1, status: 1 });

const LostAndFoundItem = mongoose.model("LostAndFoundItem", lostAndFoundItemSchema);

module.exports = LostAndFoundItem;
