const request = require("supertest");
const server = require("../src/index");
const Student = require("../src/models/Student");
const AlumniProfile = require("../src/models/AlumniProfile");
const MentorshipRequest = require("../src/models/MentorshipRequest");

describe("Alumni API Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let alumniProfileId = "";

  beforeEach(async () => {
    // 1. Create a student user
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Alumni Student",
      email: "alumni_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-ALUM-1",
      department: "Electrical Engineering",
      semester: 6,
      batch: "2023-2027",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // 2. Create an alumnus user and profile
    const alumnusRes = await request(server).post("/api/auth/register").send({
      name: "Alumni Mentor",
      email: "alumni_mentor@campusone.edu",
      password: "password123",
      role: "student", // Alumni are registered as student role, but we flag in AlumniProfile
      rollNumber: "ROLL-ALUM-MNT",
      department: "Electrical Engineering",
      semester: 8,
      batch: "2020-2024",
    });
    const alumnusUserId = alumnusRes.body.data.user.id;

    const alumniProfile = await AlumniProfile.create({
      userId: alumnusUserId,
      graduationYear: 2024,
      department: "Electrical Engineering",
      company: "Tesla",
      position: "Battery Design Engineer",
      isMentor: true,
      linkedInUrl: "https://linkedin.com/in/alumnimentor",
    });
    alumniProfileId = alumniProfile._id;
  });

  it("should successfully retrieve alumni directory list", async () => {
    const res = await request(server)
      .get("/api/alumni")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].company).toBe("Tesla");
    expect(res.body.data[0].userId.name).toBe("Alumni Mentor");
  });

  it("should successfully submit a mentorship request", async () => {
    const res = await request(server)
      .post("/api/alumni/mentorship")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        alumniId: alumniProfileId,
        notes: "I want to learn about electrical battery systems and Tesla work culture.",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.notes).toBe("I want to learn about electrical battery systems and Tesla work culture.");
    expect(res.body.data.status).toBe("pending");

    const checkRequest = await MentorshipRequest.findById(res.body.data._id);
    expect(checkRequest).not.toBeNull();
    expect(checkRequest.status).toBe("pending");
  });

  it("should block duplicate mentorship requests", async () => {
    // Post once
    await request(server)
      .post("/api/alumni/mentorship")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ alumniId: alumniProfileId, notes: "First attempt." });

    // Post again
    const res = await request(server)
      .post("/api/alumni/mentorship")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ alumniId: alumniProfileId, notes: "Second attempt." });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already been submitted");
  });

  it("should successfully fetch student mentorship request history", async () => {
    // Seed one request
    await MentorshipRequest.create({
      studentId: studentId,
      alumniId: alumniProfileId,
      status: "pending",
      notes: "Seed note.",
    });

    const res = await request(server)
      .get("/api/alumni/my-requests")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].notes).toBe("Seed note.");
  });

  it("should block unauthenticated requests with missing authorization token", async () => {
    const res = await request(server).get("/api/alumni");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
