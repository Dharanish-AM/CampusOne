const FeeStructure = require("../models/FeeStructure");
const FeeInvoice = require("../models/FeeInvoice");
const TransactionLog = require("../models/TransactionLog");
const Student = require("../models/Student");
const crypto = require("crypto");

// @desc    Get all fee invoices for the logged-in student
// @route   GET /api/fees/invoices
// @access  Private (Student)
const getStudentInvoices = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const invoices = await FeeInvoice.find({ studentId: student._id })
      .populate("feeStructureId")
      .sort({ dueDate: 1 });

    res.status(200).json({
      status: "success",
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate payment for a specific invoice
// @route   POST /api/fees/pay/:invoiceId
// @access  Private (Student)
const initiatePayment = async (req, res, next) => {
  const { invoiceId } = req.params;
  const { paymentMethod = "UPI" } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const invoice = await FeeInvoice.findById(invoiceId);
    if (!invoice) {
      const error = new Error("Invoice not found");
      error.statusCode = 404;
      return next(error);
    }

    if (invoice.status === "paid") {
      const error = new Error("Invoice is already fully paid");
      error.statusCode = 400;
      return next(error);
    }

    // Amount left to pay
    const amountToPay = invoice.amountDue - invoice.amountPaid;

    // Create unique gateway reference ID
    const gatewayReference = `pay_${crypto.randomBytes(8).toString("hex")}`;

    // Record the transaction log as pending
    const transaction = await TransactionLog.create({
      studentId: student._id,
      invoiceId: invoice._id,
      amount: amountToPay,
      paymentMethod,
      gatewayReference,
      status: "pending",
    });

    res.status(200).json({
      status: "success",
      message: "Payment transaction initiated successfully",
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        gatewayReference: transaction.gatewayReference,
        checkoutUrl: `http://localhost:5000/api/fees/mock-checkout/${gatewayReference}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mock payment gateway webhook to capture transaction resolution
// @route   POST /api/fees/webhook
// @access  Public
const paymentWebhook = async (req, res, next) => {
  const { gatewayReference, status } = req.body;

  try {
    if (!gatewayReference || !status) {
      const error = new Error("Gateway reference and status are required");
      error.statusCode = 400;
      return next(error);
    }

    const transaction = await TransactionLog.findOne({ gatewayReference });
    if (!transaction) {
      const error = new Error("Transaction record not found");
      error.statusCode = 404;
      return next(error);
    }

    if (transaction.status !== "pending") {
      res.status(200).json({
        status: "success",
        message: "Transaction already processed",
        data: transaction,
      });
      return;
    }

    // Update transaction status
    transaction.status = status === "success" ? "success" : "failed";
    await transaction.save();

    if (transaction.status === "success") {
      // Find the invoice and update paid status
      const invoice = await FeeInvoice.findById(transaction.invoiceId);
      if (invoice) {
        invoice.amountPaid += transaction.amount;
        if (invoice.amountPaid >= invoice.amountDue) {
          invoice.status = "paid";
        } else {
          invoice.status = "partially_paid";
        }
        invoice.paymentDate = new Date();
        await invoice.save();

        // Emit real-time Socket.IO notification to student
        const io = req.app.get("io");
        if (io) {
          io.emit("notification:new", {
            id: `notif_fee_${Date.now()}`,
            studentId: transaction.studentId,
            title: "Fee Payment Received",
            message: `Your payment of ₹${transaction.amount} for "${invoice.title}" was successfully processed.`,
            createdAt: new Date(),
          });
        }
      }
    }

    res.status(200).json({
      status: "success",
      message: `Transaction processed as ${transaction.status}`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentInvoices,
  initiatePayment,
  paymentWebhook,
};
