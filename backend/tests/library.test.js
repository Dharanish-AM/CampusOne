const request = require("supertest");
const server = require("../src/index");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Book = require("../src/models/Book");
const BookBorrow = require("../src/models/BookBorrow");

describe("Library Management API Test Suite", () => {
  let studentToken, studentId, studentProfileId;
  let adminToken;
  let testBookId, testBookIsbn;

  const testStudent = {
    name: "Library Student",
    email: "lib_student@campus.edu",
    password: "studentpassword123",
    role: "student",
    rollNumber: "ROLL-LS-01",
    department: "Computer Science",
    semester: 6,
    batch: "2023-2027",
  };

  const testAdmin = {
    name: "Library Admin",
    email: "lib_admin@campus.edu",
    password: "adminpassword123",
    role: "admin",
  };

  beforeEach(async () => {
    // 1. Create and authenticate Student
    let res = await request(server)
      .post("/api/auth/register")
      .send(testStudent);
    studentToken = res.body.data.accessToken;
    studentId = res.body.data.user.id;
    studentProfileId = res.body.data.profile._id;

    // 2. Create and authenticate Admin
    res = await request(server).post("/api/auth/register").send(testAdmin);
    adminToken = res.body.data.accessToken;

    // 3. Create a book in catalog
    testBookIsbn = `ISBN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const book = await Book.create({
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: testBookIsbn,
      subject: "Software Engineering",
      totalCopies: 2,
      availableCopies: 2,
    });
    testBookId = book._id;
  });

  describe("GET /api/library/books (Search Book Catalog)", () => {
    it("should search and return matching books", async () => {
      const res = await request(server)
        .get("/api/library/books")
        .set("Authorization", `Bearer ${studentToken}`)
        .query({ q: "Clean Code" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe("Clean Code");
    });
  });

  describe("POST /api/library/borrow (Checkout Book)", () => {
    it("should allow admin/staff to checkout a book for a student", async () => {
      const due = new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(); // 7 days future

      const res = await request(server)
        .post("/api/library/borrow")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentProfileId,
          bookId: testBookId,
          dueDate: due,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("borrowed");

      // Verify stock decremented
      const book = await Book.findById(testBookId);
      expect(book.availableCopies).toBe(1);
    });

    it("should reject checkout if student already has a copy borrowed", async () => {
      const due = new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString();

      // First borrow
      await BookBorrow.create({
        studentId: studentProfileId,
        bookId: testBookId,
        dueDate: due,
      });

      // Second borrow attempt
      const res = await request(server)
        .post("/api/library/borrow")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentProfileId,
          bookId: testBookId,
          dueDate: due,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already borrowed a copy");
    });

    it("should reject checkout if book is out of stock", async () => {
      const due = new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString();

      // Set stock to 0
      await Book.findByIdAndUpdate(testBookId, { availableCopies: 0 });

      const res = await request(server)
        .post("/api/library/borrow")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentProfileId,
          bookId: testBookId,
          dueDate: due,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("currently out of stock");
    });
  });

  describe("POST /api/library/return (Return Book & Fines)", () => {
    it("should successfully return a book and increment stock", async () => {
      const due = new Date(Date.now() + 3600 * 1000 * 24 * 7);
      const borrow = await BookBorrow.create({
        studentId: studentProfileId,
        bookId: testBookId,
        dueDate: due,
      });

      // Decrease stock to represent borrowed state
      await Book.findByIdAndUpdate(testBookId, {
        $inc: { availableCopies: -1 },
      });

      const res = await request(server)
        .post("/api/library/return")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          borrowId: borrow._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("returned");
      expect(res.body.data.fineAmount).toBe(0);

      // Verify stock incremented back to 2
      const book = await Book.findById(testBookId);
      expect(book.availableCopies).toBe(2);
    });

    it("should calculate late return fines if returned after due date", async () => {
      const due = new Date(Date.now() - 3600 * 1000 * 24 * 3.5); // ceil(3.5) = 4 days past
      const borrow = await BookBorrow.create({
        studentId: studentProfileId,
        bookId: testBookId,
        dueDate: due,
      });

      const res = await request(server)
        .post("/api/library/return")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          borrowId: borrow._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fineAmount).toBe(20); // 4 days overdue * 5 units = 20
    });
  });

  describe("GET /api/library/student", () => {
    it("should return student's borrow history and total unpaid fines", async () => {
      const due = new Date(Date.now() - 3600 * 1000 * 24 * 1.5); // ceil(1.5) = 2 days past (overdue)
      await BookBorrow.create({
        studentId: studentProfileId,
        bookId: testBookId,
        dueDate: due,
        status: "borrowed",
      });

      const res = await request(server)
        .get("/api/library/student")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.borrows.length).toBe(1);
      expect(res.body.data.totalUnpaidFine).toBe(10); // 2 days overdue * 5 = 10
    });
  });
});
