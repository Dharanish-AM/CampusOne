const LostAndFoundItem = require("../models/LostAndFoundItem");

// @desc    Get all lost and found listings
// @route   GET /api/lost-found
// @access  Private
const getItems = async (req, res, next) => {
  const { q, category, type } = req.query;

  try {
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    let items = await LostAndFoundItem.find(filter)
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 });

    // Local filter if search query 'q' matches title, description, or location
    if (q && q.trim() !== "") {
      const regex = new RegExp(q, "i");
      items = items.filter(
        (item) =>
          regex.test(item.title) ||
          regex.test(item.description) ||
          regex.test(item.location)
      );
    }

    res.status(200).json({
      status: "success",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a new lost or found item
// @route   POST /api/lost-found
// @access  Private
const createItem = async (req, res, next) => {
  const { title, description, type, category, location, imageUrl } = req.body;

  try {
    if (!title || !description || !type || !category || !location) {
      const error = new Error("All fields (title, description, type, category, location) are required");
      error.statusCode = 400;
      return next(error);
    }

    const item = await LostAndFoundItem.create({
      reporterId: req.user._id,
      title,
      description,
      type,
      category,
      location,
      imageUrl,
      status: "open",
    });

    const populatedItem = await LostAndFoundItem.findById(item._id).populate(
      "reporterId",
      "name email"
    );

    res.status(201).json({
      status: "success",
      data: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item claimed/resolved status
// @route   PATCH /api/lost-found/:itemId/status
// @access  Private (Owner only)
const updateItemStatus = async (req, res, next) => {
  const { itemId } = req.params;
  const { status } = req.body;

  try {
    if (!status || !["open", "claimed", "resolved"].includes(status)) {
      const error = new Error("Valid status (open, claimed, resolved) is required");
      error.statusCode = 400;
      return next(error);
    }

    const item = await LostAndFoundItem.findById(itemId);
    if (!item) {
      const error = new Error("Item listing not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check authorization: must be original reporter
    if (item.reporterId.toString() !== req.user._id.toString()) {
      const error = new Error("Unauthorized: Only the reporter can update this item status");
      error.statusCode = 403;
      return next(error);
    }

    item.status = status;
    await item.save();

    const populatedItem = await LostAndFoundItem.findById(item._id).populate(
      "reporterId",
      "name email"
    );

    res.status(200).json({
      status: "success",
      data: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings reported by current user
// @route   GET /api/lost-found/my-listings
// @access  Private
const getMyItems = async (req, res, next) => {
  try {
    const items = await LostAndFoundItem.find({ reporterId: req.user._id })
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  createItem,
  updateItemStatus,
  getMyItems,
};
