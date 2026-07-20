const mongoose = require("mongoose");

const transactionLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInvoice",
      required: [true, "Invoice reference is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "NetBanking"],
      required: [true, "Payment method is required"],
    },
    gatewayReference: {
      type: String,
      required: [true, "Gateway reference is required"],
      unique: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const TransactionLog = mongoose.model("TransactionLog", transactionLogSchema);

module.exports = TransactionLog;
