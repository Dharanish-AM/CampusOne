const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z.string().regex(mongoIdRegex, 'Invalid MongoDB ObjectId format');
const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM 24h format

const createTimetableSchema = z.object({
  body: z.object({
    subjectId: mongoIdSchema,
    facultyId: mongoIdSchema,
    roomNumber: z.string({
      required_error: 'Room number is required',
    }).min(1, 'Room number cannot be empty'),
    type: z.enum(['lecture', 'lab', 'exam'], {
      errorMap: () => ({ message: "Type must be 'lecture', 'lab', or 'exam'" }),
    }),
    isRecurring: z.boolean().default(true),
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
    date: z.string().optional().refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, 'Invalid date format'),
    startTime: z.string({
      required_error: 'Start time is required',
    }).regex(timePattern, 'Start time must be in HH:MM 24h format (e.g. "09:00")'),
    endTime: z.string({
      required_error: 'End time is required',
    }).regex(timePattern, 'End time must be in HH:MM 24h format (e.g. "10:00")'),
    department: z.string({
      required_error: 'Department is required',
    }).min(2, 'Department name must be at least 2 characters long'),
    semester: z.number({
      required_error: 'Semester is required',
    }).min(1).max(10),
    batch: z.string({
      required_error: 'Batch is required',
    }).min(2, 'Batch must be at least 2 characters long'),
  }).superRefine((data, ctx) => {
    // 1. Conditional requirements for dayOfWeek and date
    if (data.isRecurring) {
      if (!data.dayOfWeek) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Day of week is required for recurring schedule slots',
          path: ['dayOfWeek'],
        });
      }
    } else {
      if (!data.date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Date is required for non-recurring timetable items',
          path: ['date'],
        });
      }
    }

    // 2. Validate startTime is before endTime
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    
    const startValue = startHour * 60 + startMin;
    const endValue = endHour * 60 + endMin;

    if (startValue >= endValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time must be before end time',
        path: ['startTime'],
      });
    }
  }),
});

module.exports = {
  createTimetableSchema,
};
