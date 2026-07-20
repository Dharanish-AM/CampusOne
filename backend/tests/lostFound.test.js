const request = require("supertest");
const server = require("../src/index");
const LostAndFoundItem = require("../src/models/LostAndFoundItem");

describe("Lost & Found API Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let studentUserId = "";

  beforeEach(async () => {
    const studentRes = await request(server).post("/api/auth/register").send({
      name: "LostFound Student",
      email: "lostfound_stud@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-LOST-1",
      department: "Information Technology",
      semester: 4,
      batch: "2024-2028",
    });
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.profile._id;
    studentUserId = studentRes.body.data.user.id;
  });

  it("should successfully retrieve all items listings", async () => {
    // Seed one item
    await LostAndFoundItem.create({
      reporterId: studentUserId,
      title: "Seed Keys",
      description: "Found a set of keys near hostel canteen.",
      type: "found",
      category: "keys",
      location: "Hostel Canteen",
      status: "open",
    });

    const res = await request(server)
      .get("/api/lost-found")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Seed Keys");
  });

  it("should successfully report a new lost/found item listing", async () => {
    const res = await request(server)
      .post("/api/lost-found")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Lost AirPods Pro",
        description: "Left my wireless airpods on desk 4 of library computer lab.",
        type: "lost",
        category: "electronics",
        location: "Library computer lab",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.title).toBe("Lost AirPods Pro");
    expect(res.body.data.status).toBe("open");

    const item = await LostAndFoundItem.findById(res.body.data._id);
    expect(item).not.toBeNull();
    expect(item.type).toBe("lost");
  });

  it("should successfully update item status by original reporter", async () => {
    // Create item
    const item = await LostAndFoundItem.create({
      reporterId: studentUserId,
      title: "Found Glasses",
      description: "Black frame reading glasses.",
      type: "found",
      category: "other",
      location: "Classroom 101",
      status: "open",
    });

    const res = await request(server)
      .patch(`/api/lost-found/${item._id}/status`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "claimed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.status).toBe("claimed");

    const checkItem = await LostAndFoundItem.findById(item._id);
    expect(checkItem.status).toBe("claimed");
  });

  it("should block non-reporter from updating item status", async () => {
    // Create item by student
    const item = await LostAndFoundItem.create({
      reporterId: studentUserId,
      title: "Found Glasses",
      description: "Black frame reading glasses.",
      type: "found",
      category: "other",
      location: "Classroom 101",
      status: "open",
    });

    // Create another student user
    const otherStudentRes = await request(server).post("/api/auth/register").send({
      name: "Other Student",
      email: "other_stud_lost@campusone.edu",
      password: "password123",
      role: "student",
      rollNumber: "ROLL-LOST-2",
      department: "IT",
      semester: 4,
      batch: "2024-2028",
    });
    const otherToken = otherStudentRes.body.data.accessToken;

    const res = await request(server)
      .patch(`/api/lost-found/${item._id}/status`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ status: "claimed" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Only the reporter can update");
  });

  it("should successfully fetch student listings history", async () => {
    // Create one item
    await LostAndFoundItem.create({
      reporterId: studentUserId,
      title: "My Lost Notebook",
      description: "Maths formula notebook.",
      type: "lost",
      category: "documents",
      location: "Seminar Hall",
      status: "open",
    });

    const res = await request(server)
      .get("/api/lost-found/my-listings")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("My Lost Notebook");
  });

  it("should block unauthenticated requests with missing authorization token", async () => {
    const res = await request(server).get("/api/lost-found");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("not logged in");
  });
});
