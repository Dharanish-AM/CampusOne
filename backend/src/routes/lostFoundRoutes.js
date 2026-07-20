const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getItems,
  createItem,
  updateItemStatus,
  getMyItems,
} = require("../controllers/lostFoundController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/", getItems);
router.post("/", createItem);
router.patch("/:itemId/status", updateItemStatus);
router.get("/my-listings", getMyItems);

module.exports = router;
