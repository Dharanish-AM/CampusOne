const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMarketplaceProducts,
  createProductListing,
  getStudentListings,
  updateProductStatus,
} = require("../controllers/marketplaceController");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

router.get("/products", getMarketplaceProducts);
router.post("/product", createProductListing);
router.get("/my-listings", getStudentListings);
router.patch("/product/:productId/status", updateProductStatus);

module.exports = router;
