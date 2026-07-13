const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z.string().regex(mongoIdRegex, 'Invalid MongoDB ObjectId format');

const createSubjectSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Subject name is required',
    }).min(2, 'Subject name must be at least 2 characters long'),
    code: z.string({
      required_error: 'Subject code is required',
    }).min(3, 'Subject code must be at least 3 characters long'),
    department: z.string({
      required_error: 'Department is required',
    }).min(2, 'Department name must be at least 2 characters long'),
    credits: z.number().min(1).max(6).optional(),
  }),
});

const markAttendanceSchema = z.object({
  body: z.object({
    studentId: mongoIdSchema,
    subjectId: mongoIdSchema,
    status: z.enum(['present', 'absent', 'leave'], {
      errorMap: () => ({ message: "Status must be 'present', 'absent', or 'leave'" }),
    }),
    date: z.string().optional().refine((val) => {
      if (!val) return true;
      const date = Date.parse(val);
      return !isNaN(date);
    }, 'Invalid date format (must be YYYY-MM-DD or equivalent)'),
  }),
});

module.exports = {
  createSubjectSchema,
  markAttendanceSchema,
};
