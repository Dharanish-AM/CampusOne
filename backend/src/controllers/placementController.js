const Company = require("../models/Company");
const JobPosting = require("../models/JobPosting");
const JobApplication = require("../models/JobApplication");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

// @desc    Create a new company
// @route   POST /api/placements/companies
// @access  Private (Admin / Placement Officer)
const createCompany = async (req, res, next) => {
  const { name, industry, description, website, logo } = req.body;

  try {
    const company = await Company.create({
      name,
      industry,
      description,
      website,
      logo,
    });

    res.status(201).json({
      status: "success",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies
// @route   GET /api/placements/companies
// @access  Private
const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({}).sort({ name: 1 });
    res.status(200).json({
      status: "success",
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a job posting
// @route   POST /api/placements/jobs
// @access  Private (Admin / Placement Officer)
const createJobPosting = async (req, res, next) => {
  const {
    companyId,
    title,
    description,
    requirements,
    location,
    salaryPackage,
    minCgpa,
    maxBacklogs,
    eligibleDepartments,
    eligibleSemesters,
    deadline,
  } = req.body;

  try {
    // 1. Verify if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      const error = new Error("Company profile not found");
      error.statusCode = 404;
      return next(error);
    }

    // 2. Create job posting
    const job = await JobPosting.create({
      companyId,
      title,
      description,
      requirements,
      location,
      salaryPackage,
      minCgpa,
      maxBacklogs,
      eligibleDepartments,
      eligibleSemesters,
      deadline,
    });

    // 3. Emit real-time Socket.IO notification to all active clients
    const io = req.app.get("io");
    if (io) {
      io.emit("notification:new", {
        type: "placement",
        title: "New Placement Opportunity",
        message: `${company.name} is hiring for ${title} (${salaryPackage}).`,
        jobId: job._id,
      });
    }

    res.status(201).json({
      status: "success",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get job postings with dynamic student eligibility evaluations
// @route   GET /api/placements/jobs
// @access  Private
const getJobPostings = async (req, res, next) => {
  try {
    const jobs = await JobPosting.find({ status: "active" })
      .populate("companyId", "name logo website")
      .sort({ deadline: 1 });

    // If student is querying, evaluate eligibility flags dynamically
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        // Fetch student's existing applications to map applied states
        const studentApplications = await JobApplication.find({
          studentId: student._id,
        });
        const appliedJobsMap = {};
        studentApplications.forEach((app) => {
          appliedJobsMap[app.jobId.toString()] = app.status;
        });

        const evaluatedJobs = jobs.map((job) => {
          const reasons = [];

          // 1. CGPA check
          if (student.cgpa < job.minCgpa) {
            reasons.push(
              `CGPA is ${student.cgpa.toFixed(2)} (Required: ${job.minCgpa.toFixed(2)})`,
            );
          }

          // 2. Backlog check
          if (student.backlogs > job.maxBacklogs) {
            reasons.push(
              `Active backlogs: ${student.backlogs} (Allowed: ${job.maxBacklogs})`,
            );
          }

          // 3. Department check
          if (!job.eligibleDepartments.includes(student.department)) {
            reasons.push(`Department '${student.department}' is not eligible`);
          }

          // 4. Semester check
          if (!job.eligibleSemesters.includes(student.semester)) {
            reasons.push(`Semester ${student.semester} is not eligible`);
          }

          const isEligible = reasons.length === 0;
          const hasApplied = appliedJobsMap[job._id.toString()] !== undefined;
          const applicationStatus = appliedJobsMap[job._id.toString()] || null;

          return {
            ...job.toObject(),
            isEligible,
            reasons,
            hasApplied,
            applicationStatus,
          };
        });

        return res.status(200).json({
          status: "success",
          data: evaluatedJobs,
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific job details
// @route   GET /api/placements/jobs/:id
// @access  Private
const getJobDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const job = await JobPosting.findById(id).populate("companyId");
    if (!job) {
      const error = new Error("Job posting not found");
      error.statusCode = 404;
      return next(error);
    }

    // Determine eligibility for specific student
    let details = job.toObject();
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const reasons = [];
        if (student.cgpa < job.minCgpa) reasons.push("CGPA too low");
        if (student.backlogs > job.maxBacklogs)
          reasons.push("Too many active backlogs");
        if (!job.eligibleDepartments.includes(student.department))
          reasons.push("Department mismatch");
        if (!job.eligibleSemesters.includes(student.semester))
          reasons.push("Semester mismatch");

        details.isEligible = reasons.length === 0;
        details.reasons = reasons;

        // Also check if already applied
        const applied = await JobApplication.findOne({
          jobId: id,
          studentId: student._id,
        });
        details.hasApplied = !!applied;
        if (applied) {
          details.applicationStatus = applied.status;
        }
      }
    }

    res.status(200).json({
      status: "success",
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply to a job posting
// @route   POST /api/placements/jobs/:id/apply
// @access  Private (Student)
const applyToJob = async (req, res, next) => {
  const { id } = req.params;
  const { resumeUrl } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const job = await JobPosting.findById(id);
    if (!job) {
      const error = new Error("Job posting not found");
      error.statusCode = 404;
      return next(error);
    }

    if (job.status !== "active") {
      const error = new Error(
        "This job posting is no longer active for applications.",
      );
      error.statusCode = 400;
      return next(error);
    }

    // Evaluate eligibility criteria strictly
    const reasons = [];
    if (student.cgpa < job.minCgpa) {
      reasons.push(`CGPA ${student.cgpa} below required ${job.minCgpa}`);
    }
    if (student.backlogs > job.maxBacklogs) {
      reasons.push(
        `Backlogs count ${student.backlogs} exceeds limit of ${job.maxBacklogs}`,
      );
    }
    if (!job.eligibleDepartments.includes(student.department)) {
      reasons.push(`Department ${student.department} not eligible`);
    }
    if (!job.eligibleSemesters.includes(student.semester)) {
      reasons.push(`Semester ${student.semester} not eligible`);
    }

    if (reasons.length > 0) {
      const error = new Error(`Ineligible to apply: ${reasons.join(", ")}`);
      error.statusCode = 400;
      return next(error);
    }

    // Apply
    const application = await JobApplication.create({
      jobId: id,
      studentId: student._id,
      resumeUrl,
    });

    res.status(201).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    // Handle mongoose composite index unique constraint duplicate application error (code 11000)
    if (error.code === 11000) {
      const dbError = new Error(
        "You have already applied to this job posting.",
      );
      dbError.statusCode = 400;
      return next(dbError);
    }
    next(error);
  }
};

// @desc    Get current student's applications
// @route   GET /api/placements/applications/student
// @access  Private (Student)
const getStudentApplications = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const applications = await JobApplication.find({ studentId: student._id })
      .populate({
        path: "jobId",
        populate: { path: "companyId", select: "name logo" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get job applications for a job posting
// @route   GET /api/placements/jobs/:id/applications
// @access  Private (Admin / Placement Officer)
const getJobApplications = async (req, res, next) => {
  const { id } = req.params;

  try {
    const applications = await JobApplication.find({ jobId: id })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PATCH /api/placements/applications/:id/status
// @access  Private (Admin / Placement Officer)
const updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const application = await JobApplication.findById(id).populate("studentId");
    if (!application) {
      const error = new Error("Job application not found");
      error.statusCode = 404;
      return next(error);
    }

    application.status = status;
    await application.save();

    // Emit live push notification to student room
    const io = req.app.get("io");
    if (io && application.studentId) {
      io.to(`student_${application.studentId._id}`).emit("notification:new", {
        type: "placement",
        title: "Application Status Update",
        message: `Your application status for job has been updated to '${status}'.`,
        applicationId: application._id,
      });
    }

    res.status(200).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getCompanies,
  createJobPosting,
  getJobPostings,
  getJobDetails,
  applyToJob,
  getStudentApplications,
  getJobApplications,
  updateApplicationStatus,
};
