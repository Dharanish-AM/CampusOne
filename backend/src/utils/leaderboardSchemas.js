const { z } = require("zod");

const updateHandlesSchema = z.object({
  body: z
    .object({
      leetcode: z.string().trim().min(1).max(60).optional().nullable(),
      codeforces: z.string().trim().min(1).max(60).optional().nullable(),
      github: z.string().trim().min(1).max(60).optional().nullable(),
    })
    .refine(
      (data) =>
        data.leetcode !== undefined ||
        data.codeforces !== undefined ||
        data.github !== undefined,
      { message: "At least one platform handle must be provided." },
    ),
});

module.exports = { updateHandlesSchema };
