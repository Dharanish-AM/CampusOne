const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(2, 'Name must be at least 2 characters long'),
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    password: z.string({
      required_error: 'Password is required',
    }).min(6, 'Password must be at least 6 characters long'),
    role: z.enum(
      ['student', 'faculty', 'admin', 'placement_officer', 'transport_staff', 'club_coordinator'],
      {
        errorMap: () => ({ message: 'Invalid role chosen' }),
      }
    ),
    // Student specific fields (optional in schema, checked conditionally below)
    rollNumber: z.string().optional(),
    department: z.string().optional(),
    semester: z.string().or(z.number()).optional(),
    batch: z.string().optional(),
    phoneNumber: z.string().optional(),
    parentPhoneNumber: z.string().optional(),
    address: z.string().optional(),
    // Faculty specific fields
    employeeId: z.string().optional(),
    designation: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.rollNumber || data.rollNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Roll number is required for students',
          path: ['rollNumber'],
        });
      }
      if (!data.department || data.department.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Department is required for students',
          path: ['department'],
        });
      }
      if (!data.semester) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Semester is required for students',
          path: ['semester'],
        });
      }
      if (!data.batch || data.batch.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Batch is required for students',
          path: ['batch'],
        });
      }
    } else if (data.role === 'faculty') {
      if (!data.employeeId || data.employeeId.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Employee ID is required for faculty',
          path: ['employeeId'],
        });
      }
      if (!data.department || data.department.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Department is required for faculty',
          path: ['department'],
        });
      }
      if (!data.designation || data.designation.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Designation is required for faculty',
          path: ['designation'],
        });
      }
    }
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    password: z.string({
      required_error: 'Password is required',
    }).min(1, 'Password is required'),
    role: z.enum(
      ['student', 'faculty', 'admin', 'placement_officer', 'transport_staff', 'club_coordinator']
    ).optional(), // Optional, but helps verify matching login intent
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required',
    }).min(1, 'Refresh token is required'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
