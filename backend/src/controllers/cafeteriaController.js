const CanteenItem = require("../models/CanteenItem");
const CanteenOrder = require("../models/CanteenOrder");
const Student = require("../models/Student");
const crypto = require("crypto");

// @desc    Get daily canteen menu
// @route   GET /api/cafeteria/menu
// @access  Private (Student / Faculty / Admin)
const getCanteenMenu = async (req, res, next) => {
  try {
    const menu = await CanteenItem.find({ isAvailable: true }).sort({ name: 1 });
    res.status(200).json({
      status: "success",
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Place a cafeteria pre-order
// @route   POST /api/cafeteria/order
// @access  Private (Student)
const placeCanteenOrder = async (req, res, next) => {
  const { items } = req.body; // Array of { itemId, quantity }

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error("Items array is required");
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    // Calculate total amount and validate items availability
    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const dbItem = await CanteenItem.findById(item.itemId);
      if (!dbItem) {
        const error = new Error(`Item not found: ${item.itemId}`);
        error.statusCode = 404;
        return next(error);
      }
      if (!dbItem.isAvailable) {
        const error = new Error(`Item "${dbItem.name}" is currently unavailable`);
        error.statusCode = 400;
        return next(error);
      }

      totalAmount += dbItem.price * item.quantity;
      formattedItems.push({
        itemId: dbItem._id,
        quantity: item.quantity,
      });
    }

    // Generate unique pickup token (e.g. C1-4F2A)
    const tokenPart = crypto.randomBytes(2).toString("hex").toUpperCase();
    const pickupToken = `C1-${tokenPart}`;

    const order = await CanteenOrder.create({
      studentId: student._id,
      items: formattedItems,
      totalAmount,
      status: "pending",
      paymentStatus: "unpaid",
      pickupToken,
    });

    const populatedOrder = await CanteenOrder.findById(order._id).populate("items.itemId");

    res.status(201).json({
      status: "success",
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order history for current student
// @route   GET /api/cafeteria/orders/history
// @access  Private (Student)
const getStudentOrdersHistory = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const orders = await CanteenOrder.find({ studentId: student._id })
      .populate("items.itemId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order preparation status (Admin / Canteen Staff)
// @route   PATCH /api/cafeteria/order/:orderId/status
// @access  Private (Admin / Canteen Staff)
const updateCanteenOrderStatus = async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

  try {
    if (!validStatuses.includes(status)) {
      const error = new Error("Invalid order status value");
      error.statusCode = 400;
      return next(error);
    }

    const order = await CanteenOrder.findById(orderId).populate("items.itemId");
    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      return next(error);
    }

    order.status = status;
    
    // Automatically mark payment complete upon canteen order collection
    if (status === "completed") {
      order.paymentStatus = "paid";
    }
    
    await order.save();

    // Trigger live WebSocket notification updates to student
    const io = req.app.get("io");
    if (io) {
      io.emit("notification:new", {
        id: `notif_canteen_${Date.now()}`,
        studentId: order.studentId,
        orderId: order._id,
        title: `Canteen Order: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your canteen order ${order.pickupToken} is now ${status}!`,
        createdAt: new Date(),
      });
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCanteenMenu,
  placeCanteenOrder,
  getStudentOrdersHistory,
  updateCanteenOrderStatus,
};
