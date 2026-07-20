const mongoose = require("mongoose");

const canteenOrderSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CanteenItem",
          required: [true, "Item reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    pickupToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast queries of active student orders
canteenOrderSchema.index({ studentId: 1, status: 1 });

const CanteenOrder = mongoose.model("CanteenOrder", canteenOrderSchema);

module.exports = CanteenOrder;
