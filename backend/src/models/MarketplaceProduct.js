const mongoose = require("mongoose");

const marketplaceProductSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Seller reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["textbooks", "hostel_supplies", "electronics", "cycles", "others"],
      required: [true, "Category is required"],
      index: true,
    },
    images: {
      type: [String],
      default: ["https://placehold.co/150x150/1e2634/ffffff?text=Item"],
    },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Search optimization text indexes
marketplaceProductSchema.index({ title: "text", description: "text" });

const MarketplaceProduct = mongoose.model("MarketplaceProduct", marketplaceProductSchema);

module.exports = MarketplaceProduct;
