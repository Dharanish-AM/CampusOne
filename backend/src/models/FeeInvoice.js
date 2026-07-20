const mongoose = require("mongoose");

const feeInvoiceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: [true, "Fee structure reference is required"],
    },
    title: {
      type: String,
      required: [true, "Invoice title is required"],
      trim: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: [0, "Amount due cannot be negative"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    status: {
      type: String,
      enum: ["paid", "pending", "partially_paid"],
      default: "pending",
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    paymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast student status checks
feeInvoiceSchema.index({ studentId: 1, status: 1 });

const FeeInvoice = mongoose.model("FeeInvoice", feeInvoiceSchema);

module.exports = FeeInvoice;
