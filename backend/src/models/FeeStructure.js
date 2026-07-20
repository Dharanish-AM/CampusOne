const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
    },
    batch: {
      type: String,
      required: [true, "Batch is required"],
      trim: true,
    },
    tuitionFee: {
      type: Number,
      required: [true, "Tuition fee is required"],
      min: [0, "Fee cannot be negative"],
    },
    hostelFee: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    labFee: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    examFee: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    otherDues: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

// Pre-validate hook to calculate total amount automatically if not provided
feeStructureSchema.pre("validate", function (next) {
  this.totalAmount =
    this.tuitionFee +
    this.hostelFee +
    this.labFee +
    this.examFee +
    this.otherDues;
  next();
});

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);

module.exports = FeeStructure;
