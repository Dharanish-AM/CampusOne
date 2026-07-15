const { z } = require("zod");

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z
  .string()
  .regex(mongoIdRegex, "Invalid MongoDB ObjectId format");

const createBookSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .min(1, "Title cannot be empty"),
    author: z
      .string({ required_error: "Author is required" })
      .min(1, "Author cannot be empty"),
    isbn: z
      .string({ required_error: "ISBN is required" })
      .min(5, "ISBN must be at least 5 characters"),
    subject: z
      .string({ required_error: "Subject is required" })
      .min(1, "Subject cannot be empty"),
    totalCopies: z
      .number()
      .min(1, "Total copies must be at least 1")
      .optional(),
  }),
});

const borrowBookSchema = z.object({
  body: z.object({
    studentId: mongoIdSchema,
    bookId: mongoIdSchema,
    dueDate: z.string().refine((val) => {
      const date = Date.parse(val);
      return !isNaN(date) && new Date(date) > new Date();
    }, "Due date must be in the future"),
  }),
});

const returnBookSchema = z.object({
  body: z.object({
    borrowId: mongoIdSchema,
    finePaid: z.boolean().optional(),
  }),
});

module.exports = {
  createBookSchema,
  borrowBookSchema,
  returnBookSchema,
};
