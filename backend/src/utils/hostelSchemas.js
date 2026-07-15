const { z } = require("zod");

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z
  .string()
  .regex(mongoIdRegex, "Invalid MongoDB ObjectId format");

const createGatePassSchema = z.object({
  body: z
    .object({
      reason: z
        .string({ required_error: "Reason is required" })
        .min(10, "Reason must be at least 10 characters long"),
      leaveType: z.enum(["outing", "home"], {
        errorMap: () => ({ message: "Leave type must be 'outing' or 'home'" }),
      }),
      departureTime: z.string().refine((val) => {
        const date = Date.parse(val);
        return !isNaN(date) && new Date(date) > new Date();
      }, "Departure time must be in the future"),
      expectedReturnTime: z.string().refine((val) => {
        return !isNaN(Date.parse(val));
      }, "Expected return time must be a valid date"),
    })
    .refine(
      (data) => {
        return new Date(data.expectedReturnTime) > new Date(data.departureTime);
      },
      {
        message: "Expected return time must be after the departure time",
        path: ["expectedReturnTime"],
      },
    ),
});

const updateGatePassStatusSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z
    .object({
      status: z.enum(["approved", "rejected"], {
        errorMap: () => ({
          message: "Status must be 'approved' or 'rejected'",
        }),
      }),
      rejectionReason: z.string().optional(),
    })
    .refine(
      (data) => {
        if (
          data.status === "rejected" &&
          (!data.rejectionReason || !data.rejectionReason.trim())
        ) {
          return false;
        }
        return true;
      },
      {
        message: "Rejection reason is required when status is 'rejected'",
        path: ["rejectionReason"],
      },
    ),
});

const createAllocationSchema = z.object({
  body: z.object({
    studentId: mongoIdSchema,
    block: z
      .string({ required_error: "Block is required" })
      .min(1, "Block cannot be empty"),
    roomNumber: z
      .string({ required_error: "Room number is required" })
      .min(1, "Room number cannot be empty"),
    wardenId: mongoIdSchema,
  }),
});

module.exports = {
  createGatePassSchema,
  updateGatePassStatusSchema,
  createAllocationSchema,
};
