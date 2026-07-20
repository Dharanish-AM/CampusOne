const mongoose = require("mongoose");

const studentCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    qrToken: {
      type: String,
      required: [true, "QR token payload is required"],
      unique: true,
    },
    walletBalance: {
      type: Number,
      default: 500,
      min: [0, "Wallet balance cannot be negative"],
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

studentCardSchema.index({ userId: 1, status: 1 });

const StudentCard = mongoose.model("StudentCard", studentCardSchema);

module.exports = StudentCard;
