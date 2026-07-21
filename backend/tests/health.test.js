const request = require("supertest");
const server = require("../src/index");
const HealthAppointment = require("../src/models/HealthAppointment");

describe("Health Center API Test Suite", () => {
  let studentToken = "";
  let facultyToken = "";
  let studentId = "";
  let facultyId = "";

  beforeEach(async () => {
    // 1. Create a student account
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Health Student",
      email: "stud_health@campus.edu",
      password: "studentpassword123",
      role: "student",
      rollNumber: "ROLL-HLTH",
      department: "Information Technology",
      semester: 5,
      batch: "2023-2027",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Create a faculty (doctor) account
    const facultyRes = await request(server).post("/api/auth/register").send({
      name: "Dr. Lakshmi Prasad",
      email: "dr.lakshmi@campus.edu",
      password: "doctorpassword123",
      role: "faculty",
      employeeId: "FAC-DOC-001",
      department: "Health Clinic",
      designation: "Chief Medical Officer",
    });
    facultyToken = facultyRes.body.data.accessToken;
    facultyId = facultyRes.body.data.profile._id;
  });

  it("should successfully book a new appointment by student", async () => {
    const res = await request(server)
      .post("/api/health/appointments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        doctorName: "Dr. Lakshmi Prasad",
        reason: "High fever and persistent cough",
        dateTime: "2026-07-25T10:30:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.doctorName).toBe("Dr. Lakshmi Prasad");
    expect(res.body.data.status).toBe("scheduled");
    expect(res.body.data.studentId).toBe(studentId);

    const dbRecord = await HealthAppointment.findOne({ studentId });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord.reason).toBe("High fever and persistent cough");
  });

  it("should block booking with invalid date format", async () => {
    const res = await request(server)
      .post("/api/health/appointments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        doctorName: "Dr. Lakshmi Prasad",
        reason: "High fever and persistent cough",
        dateTime: "invalid-date-string",
      });

    expect(res.status).toBe(400);
  });

  it("should successfully retrieve student's appointments feed", async () => {
    // Seed an appointment manually in DB
    await HealthAppointment.create({
      studentId,
      doctorName: "Dr. Lakshmi Prasad",
      reason: "Common cold checkup",
      dateTime: new Date(),
    });

    const res = await request(server)
      .get("/api/health/appointments/student")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reason).toBe("Common cold checkup");
  });

  it("should allow student to cancel their own scheduled appointment", async () => {
    const app = await HealthAppointment.create({
      studentId,
      doctorName: "Dr. Lakshmi Prasad",
      reason: "Routine checkup",
      dateTime: new Date(),
      status: "scheduled",
    });

    const res = await request(server)
      .patch(`/api/health/appointments/${app._id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        status: "cancelled",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");

    const dbRecord = await HealthAppointment.findById(app._id);
    expect(dbRecord.status).toBe("cancelled");
  });

  it("should block student from updating prescriptions or medical leaves", async () => {
    const app = await HealthAppointment.create({
      studentId,
      doctorName: "Dr. Lakshmi Prasad",
      reason: "Routine checkup",
      dateTime: new Date(),
      status: "scheduled",
    });

    const res = await request(server)
      .patch(`/api/health/appointments/${app._id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        prescription: "Paracetamol 650mg",
        medicalLeaveApproved: true,
        medicalLeaveDays: 3,
      });

    // Zod update schema might allow parsing it, but controller role validation blocks student updates other than cancel status
    expect(res.status).toBe(400); // Students can only cancel appointments
  });

  it("should allow faculty (doctor) to complete appointment, update prescription, and approve medical leave", async () => {
    const app = await HealthAppointment.create({
      studentId,
      doctorName: "Dr. Lakshmi Prasad",
      reason: "Viral throat infection",
      dateTime: new Date(),
      status: "scheduled",
    });

    const res = await request(server)
      .patch(`/api/health/appointments/${app._id}`)
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        status: "completed",
        prescription: "Antibiotics 500mg, Lozenges, Bed rest.",
        medicalLeaveApproved: true,
        medicalLeaveDays: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("completed");
    expect(res.body.data.prescription).toBe("Antibiotics 500mg, Lozenges, Bed rest.");
    expect(res.body.data.medicalLeaveApproved).toBe(true);
    expect(res.body.data.medicalLeaveDays).toBe(3);

    const dbRecord = await HealthAppointment.findById(app._id);
    expect(dbRecord.status).toBe("completed");
    expect(dbRecord.prescription).toBe("Antibiotics 500mg, Lozenges, Bed rest.");
    expect(dbRecord.medicalLeaveApproved).toBe(true);
    expect(dbRecord.medicalLeaveDays).toBe(3);
  });

  it("should retrieve all appointments for faculty/admin view", async () => {
    await HealthAppointment.create({
      studentId,
      doctorName: "Dr. Lakshmi Prasad",
      reason: "Eye infection",
      dateTime: new Date(),
    });

    const res = await request(server)
      .get("/api/health/appointments")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].studentId).toHaveProperty("userId"); // populated
  });

  it("should block student from accessing all appointments directory", async () => {
    const res = await request(server)
      .get("/api/health/appointments")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it("should block unauthenticated requests", async () => {
    const res = await request(server).get("/api/health/appointments");
    expect(res.status).toBe(401);
  });
});
