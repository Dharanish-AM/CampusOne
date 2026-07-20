const mongoose = require("mongoose");

const canteenItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["breakfast", "lunch", "snacks", "dinner"],
      required: [true, "Category is required"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      default: 15,
      min: [1, "Preparation time must be at least 1 minute"],
    },
  },
  {
    timestamps: true,
  },
);

const CanteenItem = mongoose.model("CanteenItem", canteenItemSchema);

module.exports = CanteenItem;
