const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getStudentCard,
  topupWallet,
  getTransactions,
  deductPayment,
} = require("../controllers/studentIdController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/card", getStudentCard);
router.post("/wallet/topup", topupWallet);
router.get("/wallet/transactions", getTransactions);
router.post("/wallet/pay", deductPayment);

module.exports = router;
