const { z } = require("zod");

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z
  .string()
  .regex(mongoIdRegex, "Invalid MongoDB ObjectId format");

const createComplaintSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: "Complaint title is required",
      })
      .min(3, "Title must be at least 3 characters long")
      .max(100, "Title cannot exceed 100 characters"),
    description: z
      .string({
        required_error: "Complaint description is required",
      })
      .min(10, "Description must be at least 10 characters long"),
    category: z.enum(
      [
        "academic",
        "hostel",
        "transport",
        "cafeteria",
        "infrastructure",
        "others",
      ],
      {
        errorMap: () => ({
          message:
            "Category must be 'academic', 'hostel', 'transport', 'cafeteria', 'infrastructure', or 'others'",
        }),
      },
    ),
  }),
});

const updateComplaintSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    status: z.enum(["pending", "in_progress", "resolved", "closed"], {
      errorMap: () => ({
        message:
          "Status must be 'pending', 'in_progress', 'resolved', or 'closed'",
      }),
    }),
    comment: z
      .string({
        required_error: "Resolution/update comment is required",
      })
      .min(3, "Comment must be at least 3 characters long"),
  }),
});

const assignComplaintSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    assignedTo: mongoIdSchema,
  }),
});

module.exports = {
  createComplaintSchema,
  updateComplaintSchema,
  assignComplaintSchema,
};
