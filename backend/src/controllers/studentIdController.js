const StudentCard = require("../models/StudentCard");
const WalletTransaction = require("../models/WalletTransaction");
const crypto = require("crypto");

// @desc    Get the student digital ID card
// @route   GET /api/student-id/card
// @access  Private
const getStudentCard = async (req, res, next) => {
  try {
    let card = await StudentCard.findOne({ userId: req.user._id });

    // Lazy initialization of StudentCard if it doesn't exist
    if (!card) {
      const randomToken = crypto.randomBytes(16).toString("hex");
      card = await StudentCard.create({
        userId: req.user._id,
        qrToken: `campusone:id:${req.user._id}:${randomToken}`,
        walletBalance: 500, // Default opening balance
        status: "active",
      });
    }

    res.status(200).json({
      status: "success",
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Top up wallet balance
// @route   POST /api/student-id/wallet/topup
// @access  Private
const topupWallet = async (req, res, next) => {
  const { amount } = req.body;

  try {
    if (!amount || Number(amount) <= 0) {
      const error = new Error("Top up amount must be greater than zero");
      error.statusCode = 400;
      return next(error);
    }

    let card = await StudentCard.findOne({ userId: req.user._id });
    if (!card) {
      const randomToken = crypto.randomBytes(16).toString("hex");
      card = await StudentCard.create({
        userId: req.user._id,
        qrToken: `campusone:id:${req.user._id}:${randomToken}`,
        walletBalance: 0,
        status: "active",
      });
    }

    if (card.status === "suspended") {
      const error = new Error("This student card has been suspended");
      error.statusCode = 403;
      return next(error);
    }

    card.walletBalance += Number(amount);
    await card.save();

    // Create wallet transaction log
    await WalletTransaction.create({
      userId: req.user._id,
      amount: Number(amount),
      type: "credit",
      description: "Wallet top-up (Online Payment)",
    });

    res.status(200).json({
      status: "success",
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student wallet transactions ledger
// @route   GET /api/student-id/wallet/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deduct balance (Point-of-Sale / scanner payment emulation)
// @route   POST /api/student-id/wallet/pay
// @access  Private
const deductPayment = async (req, res, next) => {
  const { amount, description } = req.body;

  try {
    if (!amount || Number(amount) <= 0) {
      const error = new Error("Deduction amount must be greater than zero");
      error.statusCode = 400;
      return next(error);
    }

    let card = await StudentCard.findOne({ userId: req.user._id });
    if (!card) {
      const error = new Error("Student card profile not found");
      error.statusCode = 404;
      return next(error);
    }

    if (card.status === "suspended") {
      const error = new Error("This student card has been suspended");
      error.statusCode = 403;
      return next(error);
    }

    if (card.walletBalance < Number(amount)) {
      const error = new Error("Insufficient balance in your campus wallet");
      error.statusCode = 400;
      return next(error);
    }

    card.walletBalance -= Number(amount);
    await card.save();

    // Create transaction log
    const tx = await WalletTransaction.create({
      userId: req.user._id,
      amount: Number(amount),
      type: "debit",
      description: description || "Merchant Payment",
    });

    res.status(200).json({
      status: "success",
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentCard,
  topupWallet,
  getTransactions,
  deductPayment,
};
