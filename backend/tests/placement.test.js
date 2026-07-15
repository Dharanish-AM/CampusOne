const request = require("supertest");
const server = require("../src/index");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Faculty = require("../src/models/Faculty");
const Company = require("../src/models/Company");
const JobPosting = require("../src/models/JobPosting");
const JobApplication = require("../src/models/JobApplication");

describe("Placement Portal API Test Suite", () => {
  let studentToken, studentId, studentProfileId;
  let officerToken;
  let adminToken;

  const testStudent = {
    name: "Placement Student",
    email: "placement_student@campus.edu",
    password: "studentpassword123",
    role: "student",
    rollNumber: "ROLL-PL-99",
    department: "Computer Science",
    semester: 6,
    batch: "2023-2027",
  };

  const testOfficer = {
    name: "Placement Officer",
    email: "placement_officer@campus.edu",
    password: "officerpassword123",
    role: "placement_officer",
    employeeId: "FAC-PL-88",
    department: "Administration",
    designation: "TPO Officer",
  };

  const testAdmin = {
    name: "Placement Admin",
    email: "placement_admin@campus.edu",
    password: "adminpassword123",
    role: "admin",
  };

  beforeEach(async () => {
    // 1. Create and authenticate Student
    let res = await request(server)
      .post("/api/auth/register")
      .send(testStudent);
    studentToken = res.body.data.accessToken;
    studentId = res.body.data.user.id;
    studentProfileId = res.body.data.profile._id;

    // Default student starts with eligible CGPA and 0 backlogs
    await Student.findByIdAndUpdate(studentProfileId, {
      cgpa: 8.5,
      backlogs: 0,
    });

    // 2. Create and authenticate Placement Officer
    res = await request(server).post("/api/auth/register").send(testOfficer);
    officerToken = res.body.data.accessToken;

    // 3. Create and authenticate Admin
    res = await request(server).post("/api/auth/register").send(testAdmin);
    adminToken = res.body.data.accessToken;
  });

  describe("POST /api/placements/companies", () => {
    it("should allow placement officer to create a company profile", async () => {
      const res = await request(server)
        .post("/api/placements/companies")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          name: "Google",
          industry: "Technology",
          description:
            "Organize the world's information and make it universally accessible.",
          website: "https://google.com",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe("Google");
    });

    it("should prevent students from creating a company profile", async () => {
      const res = await request(server)
        .post("/api/placements/companies")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          name: "Hacking Corp",
          industry: "Technology",
          description: "Student owned unauthorized company.",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/placements/jobs", () => {
    let companyId;

    beforeEach(async () => {
      const comp = await Company.create({
        name: "Microsoft",
        industry: "Software",
        description:
          "Empower every person and organization on the planet to achieve more.",
      });
      companyId = comp._id;
    });

    it("should allow placement officer to create a job posting", async () => {
      const futureDate = new Date(
        Date.now() + 3600 * 1000 * 24 * 5,
      ).toISOString(); // 5 days in future
      const res = await request(server)
        .post("/api/placements/jobs")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          companyId: companyId.toString(),
          title: "Software Engineer Intern",
          description: "Work on cloud services.",
          requirements: "Proficient in C# or Java.",
          location: "Bangalore",
          salaryPackage: "15 LPA",
          minCgpa: 7.0,
          maxBacklogs: 0,
          eligibleDepartments: ["Computer Science", "Information Technology"],
          eligibleSemesters: [6, 7],
          deadline: futureDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.title).toBe("Software Engineer Intern");
    });
  });

  describe("GET /api/placements/jobs (Eligibility evaluations)", () => {
    let companyId, jobId;

    beforeEach(async () => {
      const comp = await Company.create({
        name: "Meta",
        industry: "Social Media",
        description: "Connect people.",
      });
      companyId = comp._id;

      const futureDate = new Date(
        Date.now() + 3600 * 1000 * 24 * 5,
      ).toISOString();
      const job = await JobPosting.create({
        companyId: companyId,
        title: "Product Engineer",
        description: "Build interfaces.",
        requirements: "React expertise.",
        location: "Remote",
        salaryPackage: "18 LPA",
        minCgpa: 8.0,
        maxBacklogs: 0,
        eligibleDepartments: ["Computer Science"],
        eligibleSemesters: [6],
        deadline: futureDate,
      });
      jobId = job._id;
    });

    it("should evaluate a student as eligible if they meet all criteria", async () => {
      const res = await request(server)
        .get("/api/placements/jobs")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isEligible).toBe(true);
      expect(res.body.data[0].reasons.length).toBe(0);
    });

    it("should evaluate a student as ineligible if CGPA is below threshold", async () => {
      // Set student CGPA to 7.0
      await Student.findByIdAndUpdate(studentProfileId, { cgpa: 7.0 });

      const res = await request(server)
        .get("/api/placements/jobs")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isEligible).toBe(false);
      expect(res.body.data[0].reasons[0]).toContain("CGPA");
    });

    it("should evaluate a student as ineligible if they have active backlogs", async () => {
      // Set active backlogs to 1
      await Student.findByIdAndUpdate(studentProfileId, { backlogs: 1 });

      const res = await request(server)
        .get("/api/placements/jobs")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isEligible).toBe(false);
      expect(res.body.data[0].reasons[0]).toContain("backlogs");
    });
  });

  describe("POST /api/placements/jobs/:id/apply", () => {
    let companyId, jobId;

    beforeEach(async () => {
      const comp = await Company.create({
        name: "Netflix",
        industry: "Entertainment",
        description: "Streaming service.",
      });
      companyId = comp._id;

      const futureDate = new Date(
        Date.now() + 3600 * 1000 * 24 * 5,
      ).toISOString();
      const job = await JobPosting.create({
        companyId: companyId,
        title: "Frontend Engineer",
        description: "UI interfaces.",
        requirements: "JavaScript proficiency.",
        location: "Mumbai",
        salaryPackage: "20 LPA",
        minCgpa: 8.0,
        maxBacklogs: 0,
        eligibleDepartments: ["Computer Science"],
        eligibleSemesters: [6],
        deadline: futureDate,
      });
      jobId = job._id;
    });

    it("should allow eligible student to apply successfully", async () => {
      const res = await request(server)
        .post(`/api/placements/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          resumeUrl: "https://drive.google.com/resume/alex.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("applied");
    });

    it("should reject student application if student is not eligible", async () => {
      // Lower CGPA to 5.0
      await Student.findByIdAndUpdate(studentProfileId, { cgpa: 5.0 });

      const res = await request(server)
        .post(`/api/placements/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          resumeUrl: "https://drive.google.com/resume/alex.pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Ineligible to apply");
    });

    it("should reject duplicate application from the same student", async () => {
      // Apply once
      await request(server)
        .post(`/api/placements/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          resumeUrl: "https://drive.google.com/resume/alex.pdf",
        });

      // Apply again
      const res = await request(server)
        .post(`/api/placements/jobs/${jobId}/apply`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          resumeUrl: "https://drive.google.com/resume/alex.pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already applied");
    });
  });
});
