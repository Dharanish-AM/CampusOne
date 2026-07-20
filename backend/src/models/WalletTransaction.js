const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: [true, "Transaction type is required"],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

module.exports = WalletTransaction;
