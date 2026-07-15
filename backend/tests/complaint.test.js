const request = require("supertest");
const server = require("../src/index");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Faculty = require("../src/models/Faculty");
const Complaint = require("../src/models/Complaint");

describe("Complaint API Test Suite", () => {
  let studentToken, studentId, studentProfileId;
  let facultyToken, facultyId, facultyProfileId;
  let otherFacultyToken, otherFacultyId, otherFacultyProfileId;
  let adminToken;

  const testStudent = {
    name: "Complaint Student",
    email: "complaint_student@campus.edu",
    password: "studentpassword123",
    role: "student",
    rollNumber: "ROLL-COM-99",
    department: "Computer Science",
    semester: 4,
    batch: "2023-2027",
  };

  const testFaculty = {
    name: "Complaint Faculty",
    email: "complaint_faculty@campus.edu",
    password: "facultypassword123",
    role: "faculty",
    employeeId: "FAC-COM-88",
    department: "Computer Science",
    designation: "Associate Professor",
  };

  const testOtherFaculty = {
    name: "Other Faculty",
    email: "other_faculty@campus.edu",
    password: "facultypassword123",
    role: "faculty",
    employeeId: "FAC-COM-77",
    department: "Mechanical Engineering",
    designation: "Assistant Professor",
  };

  const testAdmin = {
    name: "Complaint Admin",
    email: "complaint_admin@campus.edu",
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

    // 2. Create and authenticate Faculty
    res = await request(server).post("/api/auth/register").send(testFaculty);
    facultyToken = res.body.data.accessToken;
    facultyId = res.body.data.user.id;
    facultyProfileId = res.body.data.profile._id;

    // 3. Create and authenticate Other Faculty
    res = await request(server)
      .post("/api/auth/register")
      .send(testOtherFaculty);
    otherFacultyToken = res.body.data.accessToken;
    otherFacultyId = res.body.data.user.id;
    otherFacultyProfileId = res.body.data.profile._id;

    // 4. Create and authenticate Admin
    res = await request(server).post("/api/auth/register").send(testAdmin);
    adminToken = res.body.data.accessToken;
  });

  describe("POST /api/complaints", () => {
    it("should allow student to file a complaint", async () => {
      const res = await request(server)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Leaky Hostel Pipe",
          description:
            "There is a water leak in room 302 bathroom since yesterday.",
          category: "hostel",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.title).toBe("Leaky Hostel Pipe");
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.studentId).toBeDefined();
      expect(res.body.data.updates.length).toBe(1);
      expect(res.body.data.updates[0].comment).toBe(
        "Complaint filed successfully.",
      );
    });

    it("should reject complaint filing with validation errors", async () => {
      const res = await request(server)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Short",
          description: "Short desc",
          category: "invalid_category",
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Validation Error");
    });

    it("should prevent non-students from filing complaints", async () => {
      const res = await request(server)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${facultyToken}`)
        .send({
          title: "Faculty Grievance",
          description: "Water filter in the department staff room is broken.",
          category: "infrastructure",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/complaints/student", () => {
    beforeEach(async () => {
      // Seed a complaint for the student to query
      await Complaint.create({
        studentId: studentProfileId,
        title: "Leaky Hostel Pipe",
        description:
          "There is a water leak in room 302 bathroom since yesterday.",
        category: "hostel",
        updates: [
          {
            status: "pending",
            comment: "Complaint filed successfully.",
            updatedBy: studentId,
          },
        ],
      });
    });

    it("should retrieve only student's filed complaints", async () => {
      const res = await request(server)
        .get("/api/complaints/student")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe("Leaky Hostel Pipe");
    });
  });

  describe("PATCH /api/complaints/:id/assign", () => {
    let complaintId;

    beforeEach(async () => {
      const comp = await Complaint.create({
        studentId: studentProfileId,
        title: "Broken fan",
        description: "Ceiling fan is making squeaky noise.",
        category: "hostel",
        updates: [],
      });
      complaintId = comp._id;
    });

    it("should allow admin to assign complaint to faculty", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/assign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assignedTo: facultyProfileId.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.assignedTo._id).toBe(facultyProfileId.toString());
      expect(res.body.data.updates.length).toBe(1);
      expect(res.body.data.updates[0].comment).toContain("Ticket assigned to");
    });

    it("should prevent student from assigning complaint", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/assign`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          assignedTo: facultyProfileId.toString(),
        });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/complaints/:id/status", () => {
    let complaintId;

    beforeEach(async () => {
      const comp = await Complaint.create({
        studentId: studentProfileId,
        title: "Broken lock",
        description: "Door lock of room 302 is broken.",
        category: "hostel",
        assignedTo: facultyProfileId,
        updates: [],
      });
      complaintId = comp._id;
    });

    it("should allow assigned faculty to update ticket status", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${facultyToken}`)
        .send({
          status: "in_progress",
          comment: "Warden inspected. Plumber dispatched.",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("in_progress");
      expect(res.body.data.updates.length).toBe(1);
      expect(res.body.data.updates[0].comment).toBe(
        "Warden inspected. Plumber dispatched.",
      );
    });

    it("should allow admin to update ticket status", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "resolved",
          comment: "Lock replaced by administration.",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("resolved");
    });

    it("should reject status update if faculty is not assigned to the ticket", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${otherFacultyToken}`)
        .send({
          status: "in_progress",
          comment: "I am trying to resolve it anyway.",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("not authorized");
    });

    it("should prevent student from updating status", async () => {
      const res = await request(server)
        .patch(`/api/complaints/${complaintId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          status: "resolved",
          comment: "I fixed it myself.",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/complaints", () => {
    beforeEach(async () => {
      // Clear specific collection so we only have the seeded ones
      await Complaint.deleteMany({});
      await Complaint.create([
        {
          studentId: studentProfileId,
          title: "Math grades",
          description: "Re-evaluation request for final exams.",
          category: "academic",
          assignedTo: facultyProfileId,
        },
        {
          studentId: studentProfileId,
          title: "Bus delay",
          description: "Route 3 is arriving 20 mins late every day.",
          category: "transport",
          assignedTo: otherFacultyProfileId,
        },
      ]);
    });

    it("should retrieve all complaints for admin user", async () => {
      const res = await request(server)
        .get("/api/complaints")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it("should retrieve only assigned complaints for faculty user", async () => {
      const res = await request(server)
        .get("/api/complaints")
        .set("Authorization", `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Math grades");
    });
  });
});
