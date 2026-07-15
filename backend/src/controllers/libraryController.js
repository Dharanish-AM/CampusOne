const Book = require("../models/Book");
const BookBorrow = require("../models/BookBorrow");
const Student = require("../models/Student");

// @desc    Search library books catalog
// @route   GET /api/library/books
// @access  Private
const searchBooks = async (req, res, next) => {
  const { q, subject, available } = req.query;

  try {
    const filter = {};

    if (subject) {
      filter.subject = subject;
    }

    if (available === "true") {
      filter.availableCopies = { $gt: 0 };
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { isbn: { $regex: q, $options: "i" } },
      ];
    }

    const books = await Book.find(filter).sort({ title: 1 });

    res.status(200).json({
      status: "success",
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Borrow/checkout a book
// @route   POST /api/library/borrow
// @access  Private (Admin / Faculty / Staff)
const borrowBook = async (req, res, next) => {
  const { studentId, bookId, dueDate } = req.body;

  try {
    // 1. Check if book exists and is in stock
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("Book not found");
      error.statusCode = 404;
      return next(error);
    }

    if (book.availableCopies <= 0) {
      const error = new Error("Book is currently out of stock.");
      error.statusCode = 400;
      return next(error);
    }

    // 2. Check if student has already borrowed this book and not returned it
    const existing = await BookBorrow.findOne({
      studentId,
      bookId,
      status: { $in: ["borrowed", "overdue"] },
    });

    if (existing) {
      const error = new Error(
        "Student has already borrowed a copy of this book.",
      );
      error.statusCode = 400;
      return next(error);
    }

    // 3. Create borrow record
    const borrow = await BookBorrow.create({
      studentId,
      bookId,
      dueDate,
    });

    // 4. Decrement available copies
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      status: "success",
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return a borrowed book & calculate late fines
// @route   POST /api/library/return
// @access  Private (Admin / Faculty / Staff)
const returnBook = async (req, res, next) => {
  const { borrowId, finePaid } = req.body;

  try {
    const borrow = await BookBorrow.findById(borrowId);
    if (!borrow) {
      const error = new Error("Borrow record not found");
      error.statusCode = 404;
      return next(error);
    }

    if (borrow.status === "returned") {
      const error = new Error("This book has already been returned.");
      error.statusCode = 400;
      return next(error);
    }

    // Calculate fine (5 currency units per day overdue)
    let fine = 0;
    const now = new Date();
    const due = new Date(borrow.dueDate);

    if (now > due) {
      const diffTime = Math.abs(now - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 5;
    }

    // Update borrow log
    borrow.returnedDate = now;
    borrow.status = "returned";
    borrow.fineAmount = fine;
    if (fine > 0) {
      borrow.finePaid = finePaid === true;
    } else {
      borrow.finePaid = true;
    }
    await borrow.save();

    // Increment book availability copies
    const book = await Book.findById(borrow.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    res.status(200).json({
      status: "success",
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's own borrowing logs & outstanding fine totals
// @route   GET /api/library/student
// @access  Private (Student)
const getStudentBorrows = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const borrows = await BookBorrow.find({ studentId: student._id })
      .populate("bookId")
      .sort({ borrowedDate: -1 });

    // Dynamically evaluate overdue statuses & sum unpaid fines
    let totalUnpaidFine = 0;
    const updatedBorrows = await Promise.all(
      borrows.map(async (item) => {
        let fine = item.fineAmount;
        let isOverdue = item.status === "overdue";
        const now = new Date();
        const due = new Date(item.dueDate);

        if (item.status === "borrowed" && now > due) {
          // Update status to overdue dynamically
          item.status = "overdue";
          const diffTime = Math.abs(now - due);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          fine = diffDays * 5;
          item.fineAmount = fine;
          await item.save();
        }

        if (!item.finePaid) {
          totalUnpaidFine += item.fineAmount;
        }

        return item;
      }),
    );

    res.status(200).json({
      status: "success",
      data: {
        borrows: updatedBorrows,
        totalUnpaidFine,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all borrowing logs (Admin / Staff)
// @route   GET /api/library/borrows
// @access  Private (Admin / Faculty / Staff)
const getAllBorrows = async (req, res, next) => {
  try {
    const list = await BookBorrow.find({})
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" },
      })
      .populate("bookId")
      .sort({ borrowedDate: -1 });

    res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add book to physical catalog (Admin only)
// @route   POST /api/library/books
// @access  Private (Admin)
const createBook = async (req, res, next) => {
  const { title, author, isbn, subject, totalCopies } = req.body;

  try {
    // Check if isbn already exists
    const existing = await Book.findOne({ isbn });
    if (existing) {
      const error = new Error("A book with this ISBN already exists.");
      error.statusCode = 400;
      return next(error);
    }

    const copies = totalCopies || 1;
    const book = await Book.create({
      title,
      author,
      isbn,
      subject,
      totalCopies: copies,
      availableCopies: copies,
    });

    res.status(201).json({
      status: "success",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchBooks,
  borrowBook,
  returnBook,
  getStudentBorrows,
  getAllBorrows,
  createBook,
};
