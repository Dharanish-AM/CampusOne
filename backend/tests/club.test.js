const request = require("supertest");
const server = require("../src/index");
const Student = require("../src/models/Student");
const Faculty = require("../src/models/Faculty");
const Club = require("../src/models/Club");
const ClubEvent = require("../src/models/ClubEvent");

describe("Clubs API Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let facultyId = "";
  let clubId = "";
  let eventId = "";

  beforeEach(async () => {
    // 1. Create student and advisor users
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "Club Student",
      email: "club_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-CLUB-1",
      department: "Civil Engineering",
      semester: 4,
      batch: "2024-2028",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;

    // Create faculty advisor
    const facultyRes = await request(server).post("/api/auth/register").send({
      name: "Faculty Advisor",
      email: "club_advisor@campusone.edu",
      password: "password123",
      role: "faculty",
      employeeId: "EMP-ADV-007",
      department: "Physics",
      designation: "Associate Professor",
    });
    facultyId = facultyRes.body.data.profile._id;

    // 2. Create club
    const club = await Club.create({
      name: "Fine Arts Club",
      description: "Nurturing campus creative and drawing skills.",
      facultyAdvisor: facultyId,
      members: [],
      coordinators: [studentId], // Add our student as coordinator
    });
    clubId = club._id;

    // 3. Create event
    const event = await ClubEvent.create({
      clubId: clubId,
      title: "Annual Painting Exhibition",
      description: "Showcase of best canvas arts from all departments.",
      dateTime: new Date(Date.now() + 3600 * 1000 * 48), // 2 days in future
      venue: "Main Auditorium Gallery",
      rsvps: [],
    });
    eventId = event._id;
  });

  it("should successfully retrieve registered campus clubs", async () => {
    const res = await request(server)
      .get("/api/clubs")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Fine Arts Club");
    expect(res.body.data[0].facultyAdvisor.userId.name).toBe("Faculty Advisor");
  });

  it("should successfully toggle club membership join/leave", async () => {
    // Join club
    let res = await request(server)
      .post(`/api/clubs/${clubId}/join`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members).toContain(studentId.toString());

    // Leave club
    res = await request(server)
      .post(`/api/clubs/${clubId}/join`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members).not.toContain(studentId.toString());
  });

  it("should successfully retrieve upcoming club events list", async () => {
    const res = await request(server)
      .get("/api/clubs/events")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Annual Painting Exhibition");
  });

  it("should successfully toggle event rsvp attending status", async () => {
    // RSVP
    let res = await request(server)
      .post(`/api/clubs/events/${eventId}/rsvp`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rsvps).toContain(studentId.toString());

    // Cancel RSVP
    res = await request(server)
      .post(`/api/clubs/events/${eventId}/rsvp`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rsvps).not.toContain(studentId.toString());
  });

  it("should successfully allow club coordinator to post a new event", async () => {
    const res = await request(server)
      .post(`/api/clubs/${clubId}/events`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Clay Modeling Masterclass",
        description: "Hands-on session with potters and modeling artists.",
        dateTime: new Date(Date.now() + 3600 * 1000 * 72),
        venue: "Arts Studio Block B",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.title).toBe("Clay Modeling Masterclass");

    const checkEvent = await ClubEvent.findOne({ title: "Clay Modeling Masterclass" });
    expect(checkEvent).not.toBeNull();
  });

  it("should block non-coordinator from posting a new event", async () => {
    // Create another student
    const otherRes = await request(server).post("/api/auth/register").send({
      name: "Other Student",
      email: "other_stud_club@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-OTHER-2",
      department: "Chemical Science",
      semester: 3,
      batch: "2024-2028",
    });
    const otherToken = otherRes.body.data.accessToken;

    const res = await request(server)
      .post(`/api/clubs/${clubId}/events`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({
        title: "Unauthorized Tech Talk",
        description: "Should fail.",
        dateTime: new Date(Date.now() + 3600 * 1000 * 72),
        venue: "Arts Studio Block B",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Only club coordinators can post events");
  });

  it("should block unauthenticated requests with missing authorization token", async () => {
    const res = await request(server).get("/api/clubs");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
