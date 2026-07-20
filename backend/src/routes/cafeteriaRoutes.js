const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getCanteenMenu,
  placeCanteenOrder,
  getStudentOrdersHistory,
  updateCanteenOrderStatus,
} = require("../controllers/cafeteriaController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/menu", getCanteenMenu);
router.post("/order", placeCanteenOrder);
router.get("/orders/history", getStudentOrdersHistory);

// Admin/Canteen Staff endpoint to transition order states
router.patch(
  "/order/:orderId/status",
  authorizeRoles("admin", "faculty"), // We can mock canteen staff as admin/faculty roles for simple local verification
  updateCanteenOrderStatus
);

module.exports = router;
