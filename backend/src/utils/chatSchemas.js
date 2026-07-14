const { z } = require("zod");

/**
 * Schema for POST /api/chat request body.
 * conversationId is optional — if omitted, a new conversation UUID is created
 * by the controller. If provided it must be a valid UUID v4.
 */
const chatMessageSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be 1000 characters or fewer"),

  conversationId: z
    .string()
    .uuid("conversationId must be a valid UUID")
    .optional(),
});

module.exports = { chatMessageSchema };
