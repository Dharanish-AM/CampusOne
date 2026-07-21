const { z } = require("zod");

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z
  .string()
  .regex(mongoIdRegex, "Invalid MongoDB ObjectId format");

const bookAppointmentSchema = z.object({
  body: z.object({
    doctorName: z
      .string({
        required_error: "Doctor name is required",
      })
      .min(3, "Doctor name must be at least 3 characters long")
      .max(100, "Doctor name cannot exceed 100 characters"),
    reason: z
      .string({
        required_error: "Reason for appointment is required",
      })
      .min(5, "Reason must be at least 5 characters long"),
    dateTime: z
      .string({
        required_error: "Date and time are required",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
  }),
});

const updateAppointmentSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    status: z.enum(["scheduled", "completed", "cancelled"], {
      errorMap: () => ({
        message: "Status must be 'scheduled', 'completed', or 'cancelled'",
      }),
    }).optional(),
    prescription: z.string().optional(),
    medicalLeaveApproved: z.boolean().optional(),
    medicalLeaveDays: z
      .number()
      .min(0, "Medical leave days cannot be negative")
      .optional(),
  }),
});

module.exports = {
  bookAppointmentSchema,
  updateAppointmentSchema,
};
