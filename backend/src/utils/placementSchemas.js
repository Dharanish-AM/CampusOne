const { z } = require("zod");

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const mongoIdSchema = z
  .string()
  .regex(mongoIdRegex, "Invalid MongoDB ObjectId format");

const createCompanySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Company name is required" })
      .min(2, "Company name must be at least 2 characters long"),
    industry: z
      .string({ required_error: "Industry type is required" })
      .min(2, "Industry must be at least 2 characters long"),
    description: z
      .string({ required_error: "Company description is required" })
      .min(10, "Description must be at least 10 characters long"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    logo: z.string().url("Invalid logo image URL").optional().or(z.literal("")),
  }),
});

const createJobSchema = z.object({
  body: z.object({
    companyId: mongoIdSchema,
    title: z
      .string({ required_error: "Job title is required" })
      .min(3, "Title must be at least 3 characters long"),
    description: z
      .string({ required_error: "Job description is required" })
      .min(10, "Description must be at least 10 characters long"),
    requirements: z
      .string({ required_error: "Requirements are required" })
      .min(10, "Requirements must be at least 10 characters long"),
    location: z
      .string({ required_error: "Location is required" })
      .min(2, "Location must be at least 2 characters long"),
    salaryPackage: z
      .string({ required_error: "Salary package is required" })
      .min(2, "Salary package must be at least 2 characters long"),
    minCgpa: z.number().min(0.0).max(10.0).default(0.0),
    maxBacklogs: z.number().min(0).default(0),
    eligibleDepartments: z
      .array(z.string())
      .nonempty("At least one eligible department must be specified"),
    eligibleSemesters: z
      .array(z.number())
      .nonempty("At least one eligible semester must be specified"),
    deadline: z.string().refine((val) => {
      const date = Date.parse(val);
      return !isNaN(date) && new Date(date) > new Date();
    }, "Deadline must be a valid future date"),
  }),
});

const applyJobSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    resumeUrl: z
      .string({ required_error: "Resume URL is required" })
      .url("Invalid resume URL"),
  }),
});

const updateApplicationStatusSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    status: z.enum(["applied", "shortlisted", "rejected", "selected"], {
      errorMap: () => ({
        message:
          "Status must be 'applied', 'shortlisted', 'rejected', or 'selected'",
      }),
    }),
  }),
});

module.exports = {
  createCompanySchema,
  createJobSchema,
  applyJobSchema,
  updateApplicationStatusSchema,
};
