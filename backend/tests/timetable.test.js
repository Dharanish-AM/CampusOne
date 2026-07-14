const request = require("supertest");
const server = require("../src/index");
const Subject = require("../src/models/Subject");
const Timetable = require("../src/models/Timetable");

describe("Timetable API Test Suite", () => {
  let studentToken = "";
  let facultyToken = "";
  let studentId = "";
  let facultyId = "";
  let subjectId = "";

  beforeEach(async () => {
    // 1. Student
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Timetable Student",
      email: "stud_tt@campus.edu",
      password: "studentpassword123",
      role: "student",
      rollNumber: "ROLL-TT",
      department: "Information Technology",
      semester: 3,
      batch: "2024-2028",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Faculty
    const facultyRes = await request(server).post("/api/auth/register").send({
      name: "Timetable Faculty",
      email: "fac_tt@campus.edu",
      password: "facultypassword123",
      role: "faculty",
      employeeId: "FAC-TT",
      department: "Information Technology",
      designation: "Lecturer",
    });
    facultyToken = facultyRes.body.data.accessToken;
    facultyId = facultyRes.body.data.profile._id;

    // 3. Subject
    const subjectRes = await request(server)
      .post("/api/attendance/subjects")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        name: "Mobile App Development",
        code: "IT304",
        department: "Information Technology",
        credits: 3,
      });
    subjectId = subjectRes.body.data._id;
  });

  it("should allow faculty to create a weekly recurring timetable class slot", async () => {
    const res = await request(server)
      .post("/api/timetable")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        subjectId,
        facultyId,
        roomNumber: "LHC-201",
        type: "lecture",
        isRecurring: true,
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        department: "Information Technology",
        semester: 3,
        batch: "2024-2028",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.roomNumber).toBe("LHC-201");

    const check = await Timetable.findOne({ subjectId });
    expect(check).not.toBeNull();
    expect(check.isRecurring).toBe(true);
    expect(check.dayOfWeek).toBe("Monday");
  });

  it("should allow faculty to schedule a single date-based exam slot", async () => {
    const res = await request(server)
      .post("/api/timetable")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        subjectId,
        facultyId,
        roomNumber: "Exam-Hall-B",
        type: "exam",
        isRecurring: false,
        date: "2026-11-20T00:00:00.000Z",
        startTime: "10:00",
        endTime: "13:00",
        department: "Information Technology",
        semester: 3,
        batch: "2024-2028",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("exam");

    const check = await Timetable.findOne({ type: "exam" });
    expect(check).not.toBeNull();
    expect(check.isRecurring).toBe(false);
  });

  it("should reject timetable creation with invalid time ranges (startTime >= endTime)", async () => {
    const res = await request(server)
      .post("/api/timetable")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        subjectId,
        facultyId,
        roomNumber: "LHC-201",
        type: "lecture",
        isRecurring: true,
        dayOfWeek: "Monday",
        startTime: "11:00",
        endTime: "09:00", // Invalid: start time is after end time
        department: "Information Technology",
        semester: 3,
        batch: "2024-2028",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
  });

  it("should prevent student from creating a timetable class slot", async () => {
    const res = await request(server)
      .post("/api/timetable")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        subjectId,
        facultyId,
        roomNumber: "LHC-201",
        type: "lecture",
        isRecurring: true,
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        department: "Information Technology",
        semester: 3,
        batch: "2024-2028",
      });

    expect(res.status).toBe(403);
  });

  it("should allow student to query their specific class & exam timetable schedule", async () => {
    // Seed one class and one exam
    await request(server)
      .post("/api/timetable")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        subjectId,
        facultyId,
        roomNumber: "LHC-201",
        type: "lecture",
        isRecurring: true,
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        department: "Information Technology",
        semester: 3,
        batch: "2024-2028",
      });

    const res = await request(server)
      .get("/api/timetable")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].subjectId.code).toBe("IT304");
  });
});
