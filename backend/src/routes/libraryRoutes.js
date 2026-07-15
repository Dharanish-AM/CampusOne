const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  searchBooks,
  borrowBook,
  returnBook,
  getStudentBorrows,
  getAllBorrows,
  createBook,
} = require("../controllers/libraryController");
const {
  createBookSchema,
  borrowBookSchema,
  returnBookSchema,
} = require("../utils/librarySchemas");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// Search Book Catalog (Student, Faculty, Staff)
router.get("/books", searchBooks);

// Student checking their own borrowing records
router.get("/student", authorizeRoles("student"), getStudentBorrows);

// Borrow transaction (Staff / Faculty / Admin)
router.post(
  "/borrow",
  authorizeRoles("admin", "faculty", "placement_officer", "transport_staff"),
  validate(borrowBookSchema),
  borrowBook,
);

// Return transaction (Staff / Faculty / Admin)
router.post(
  "/return",
  authorizeRoles("admin", "faculty", "placement_officer", "transport_staff"),
  validate(returnBookSchema),
  returnBook,
);

// Global checkout logs reporting (Staff / Faculty / Admin)
router.get(
  "/borrows",
  authorizeRoles("admin", "faculty", "placement_officer", "transport_staff"),
  getAllBorrows,
);

// Catalog creation (Admin only)
router.post(
  "/books",
  authorizeRoles("admin"),
  validate(createBookSchema),
  createBook,
);

module.exports = router;
