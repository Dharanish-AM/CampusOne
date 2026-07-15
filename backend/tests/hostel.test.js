const request = require("supertest");
const server = require("../src/index");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Faculty = require("../src/models/Faculty");
const HostelAllocation = require("../src/models/HostelAllocation");
const GatePassRequest = require("../src/models/GatePassRequest");

describe("Hostel Management API Test Suite", () => {
  let studentToken, studentId, studentProfileId;
  let roommateToken, roommateId, roommateProfileId;
  let wardenToken, wardenId, wardenProfileId;
  let adminToken;

  const testStudent = {
    name: "Hostel Student",
    email: "hostel_student@campus.edu",
    password: "studentpassword123",
    role: "student",
    rollNumber: "ROLL-HS-01",
    department: "Computer Science",
    semester: 6,
    batch: "2023-2027",
  };

  const testRoommate = {
    name: "Hostel Roommate",
    email: "hostel_roommate@campus.edu",
    password: "roommatepassword123",
    role: "student",
    rollNumber: "ROLL-HS-02",
    department: "Computer Science",
    semester: 6,
    batch: "2023-2027",
  };

  const testWarden = {
    name: "Hostel Warden",
    email: "hostel_warden@campus.edu",
    password: "wardenpassword123",
    role: "faculty",
    employeeId: "FAC-HS-77",
    department: "Computer Science",
    designation: "Assistant Professor",
  };

  const testAdmin = {
    name: "Hostel Admin",
    email: "hostel_admin@campus.edu",
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

    // 2. Create and authenticate Roommate
    res = await request(server).post("/api/auth/register").send(testRoommate);
    roommateToken = res.body.data.accessToken;
    roommateId = res.body.data.user.id;
    roommateProfileId = res.body.data.profile._id;

    // 3. Create and authenticate Warden (Faculty)
    res = await request(server).post("/api/auth/register").send(testWarden);
    wardenToken = res.body.data.accessToken;
    wardenId = res.body.data.user.id;
    wardenProfileId = res.body.data.profile._id;

    // 4. Create and authenticate Admin
    res = await request(server).post("/api/auth/register").send(testAdmin);
    adminToken = res.body.data.accessToken;
  });

  describe("GET /api/hostels/allocation (Room & Roommates)", () => {
    it("should return null data and message if student has no room allocated", async () => {
      const res = await request(server)
        .get("/api/hostels/allocation")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeNull();
      expect(res.body.message).toContain("do not have a hostel room allocated");
    });

    it("should return allocation, warden, and roommate list when allocated", async () => {
      // Allocate student
      await HostelAllocation.create({
        studentId: studentProfileId,
        block: "A",
        roomNumber: "302",
        wardenId: wardenProfileId,
      });

      // Allocate roommate
      await HostelAllocation.create({
        studentId: roommateProfileId,
        block: "A",
        roomNumber: "302",
        wardenId: wardenProfileId,
      });

      const res = await request(server)
        .get("/api/hostels/allocation")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.allocation.roomNumber).toBe("302");
      expect(res.body.data.allocation.block).toBe("A");
      expect(res.body.data.warden.name).toBe(testWarden.name);
      expect(res.body.data.roommates.length).toBe(1);
      expect(res.body.data.roommates[0].name).toBe(testRoommate.name);
    });
  });

  describe("POST /api/hostels/gatepass", () => {
    it("should allow a student to request a gate pass", async () => {
      const departure = new Date(Date.now() + 3600 * 1000 * 2).toISOString(); // 2 hours future
      const returnTime = new Date(Date.now() + 3600 * 1000 * 6).toISOString(); // 6 hours future

      const res = await request(server)
        .post("/api/hostels/gatepass")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          reason: "Going to local market for project supplies",
          leaveType: "outing",
          departureTime: departure,
          expectedReturnTime: returnTime,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.leaveType).toBe("outing");
      expect(res.body.data.status).toBe("pending");
    });

    it("should reject gate pass if departure time is in past", async () => {
      const departure = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour past
      const returnTime = new Date(Date.now() + 3600 * 1000).toISOString();

      const res = await request(server)
        .post("/api/hostels/gatepass")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          reason: "Going home for weekend",
          leaveType: "home",
          departureTime: departure,
          expectedReturnTime: returnTime,
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain(
        "Departure time must be in the future",
      );
    });

    it("should reject gate pass if return time is before departure time", async () => {
      const departure = new Date(Date.now() + 3600 * 1000 * 4).toISOString();
      const returnTime = new Date(Date.now() + 3600 * 1000 * 2).toISOString(); // Return before departure

      const res = await request(server)
        .post("/api/hostels/gatepass")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          reason: "Going home for weekend",
          leaveType: "home",
          departureTime: departure,
          expectedReturnTime: returnTime,
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain(
        "return time must be after the departure time",
      );
    });
  });

  describe("PATCH /api/hostels/gatepass/:id/status", () => {
    let gatePassId;

    beforeEach(async () => {
      const departure = new Date(Date.now() + 3600 * 1000 * 2).toISOString();
      const returnTime = new Date(Date.now() + 3600 * 1000 * 6).toISOString();

      const gp = await GatePassRequest.create({
        studentId: studentProfileId,
        reason: "Going home for weekend festival",
        leaveType: "home",
        departureTime: departure,
        expectedReturnTime: returnTime,
      });
      gatePassId = gp._id;
    });

    it("should allow warden to approve a gate pass request", async () => {
      const res = await request(server)
        .patch(`/api/hostels/gatepass/${gatePassId}/status`)
        .set("Authorization", `Bearer ${wardenToken}`)
        .send({
          status: "approved",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("approved");
    });

    it("should allow warden to reject a gate pass request with a reason", async () => {
      const res = await request(server)
        .patch(`/api/hostels/gatepass/${gatePassId}/status`)
        .set("Authorization", `Bearer ${wardenToken}`)
        .send({
          status: "rejected",
          rejectionReason: "Exam scheduled on weekend",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("rejected");
      expect(res.body.data.rejectionReason).toBe("Exam scheduled on weekend");
    });

    it("should reject warden patch if rejection reason is missing on reject", async () => {
      const res = await request(server)
        .patch(`/api/hostels/gatepass/${gatePassId}/status`)
        .set("Authorization", `Bearer ${wardenToken}`)
        .send({
          status: "rejected",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain(
        "Rejection reason is required",
      );
    });

    it("should prevent students from processing gate pass status updates", async () => {
      const res = await request(server)
        .patch(`/api/hostels/gatepass/${gatePassId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          status: "approved",
        });

      expect(res.status).toBe(403);
    });
  });
});
