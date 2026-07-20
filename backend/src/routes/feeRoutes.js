const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getStudentInvoices,
  initiatePayment,
  paymentWebhook,
} = require("../controllers/feeController");

const router = express.Router();

// Webhook endpoint (Public, called by mock gateway)
router.post("/webhook", paymentWebhook);

// Student endpoints (Protected)
router.use(protect);
router.get("/invoices", getStudentInvoices);
router.post("/pay/:invoiceId", initiatePayment);

module.exports = router;
