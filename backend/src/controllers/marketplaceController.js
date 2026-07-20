const MarketplaceProduct = require("../models/MarketplaceProduct");
const Student = require("../models/Student");

// @desc    Get all available marketplace products
// @route   GET /api/marketplace/products
// @access  Private (Student / Faculty / Admin)
const getMarketplaceProducts = async (req, res, next) => {
  const { q, category } = req.query;

  try {
    const filter = { status: "available" };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q && q.trim() !== "") {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const products = await MarketplaceProduct.find(filter)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a new product listing
// @route   POST /api/marketplace/product
// @access  Private (Student)
const createProductListing = async (req, res, next) => {
  const { title, description, price, category, images } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    if (!title || !description || price === undefined || !category) {
      const error = new Error("Title, description, price, and category are required");
      error.statusCode = 400;
      return next(error);
    }

    const product = await MarketplaceProduct.create({
      studentId: student._id,
      title,
      description,
      price,
      category,
      images: images && images.length > 0 ? images : undefined,
    });

    const populatedProduct = await MarketplaceProduct.findById(product._id).populate({
      path: "studentId",
      populate: {
        path: "userId",
        select: "name email",
      },
    });

    res.status(201).json({
      status: "success",
      data: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product listings posted by logged-in student
// @route   GET /api/marketplace/my-listings
// @access  Private (Student)
const getStudentListings = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const products = await MarketplaceProduct.find({ studentId: student._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark product status as sold or available
// @route   PATCH /api/marketplace/product/:productId/status
// @access  Private (Student Listing Owner)
const updateProductStatus = async (req, res, next) => {
  const { productId } = req.params;
  const { status } = req.body;

  try {
    if (!["available", "sold"].includes(status)) {
      const error = new Error("Invalid status update value");
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const product = await MarketplaceProduct.findById(productId);
    if (!product) {
      const error = new Error("Product listing not found");
      error.statusCode = 404;
      return next(error);
    }

    // Verify ownership
    if (product.studentId.toString() !== student._id.toString()) {
      const error = new Error("Unauthorized to modify this listing");
      error.statusCode = 403;
      return next(error);
    }

    product.status = status;
    await product.save();

    const populatedProduct = await MarketplaceProduct.findById(product._id).populate({
      path: "studentId",
      populate: {
        path: "userId",
        select: "name email",
      },
    });

    res.status(200).json({
      status: "success",
      data: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarketplaceProducts,
  createProductListing,
  getStudentListings,
  updateProductStatus,
};
