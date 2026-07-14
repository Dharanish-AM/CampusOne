const request = require("supertest");
const server = require("../src/index");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const LeaderboardEntry = require("../src/models/LeaderboardEntry");

// ─── Helpers ──────────────────────────────────────────────────────────────────

let studentToken, adminToken, studentId, adminUserId;

const registerAndLogin = async (role, suffix) => {
  const basePayload = {
    name: `Test ${role} ${suffix}`,
    email: `${role}${suffix}@leaderboard.test`,
    password: "password123",
    role,
  };

  // Student and admin-like roles may require extra fields
  if (role === "student") {
    basePayload.rollNumber = `LB-${suffix}-${Date.now()}`;
    basePayload.department = "CSE";
    basePayload.semester = 3;
    basePayload.batch = "2023-27";
  }

  const reg = await request(server)
    .post("/api/auth/register")
    .send(basePayload);

  if (reg.status !== 201) {
    throw new Error(
      `Registration failed for role ${role}: ${JSON.stringify(reg.body)}`,
    );
  }

  return { token: reg.body.data.accessToken, userId: reg.body.data.user._id };
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Register a student (auth controller also creates the Student profile)
  const student = await registerAndLogin("student", "lb1");
  studentToken = student.token;

  const studentUser = await User.findOne({
    email: "studentlb1@leaderboard.test",
  });
  const studentDoc = await Student.findOne({ userId: studentUser._id });
  studentId = studentDoc._id;

  // Register an admin
  const admin = await registerAndLogin("admin", "lb1");
  adminToken = admin.token;
  adminUserId = admin.userId;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Leaderboard API", () => {
  // 1. Student updates coding handles
  it("PATCH /api/leaderboard/handles — student can update handles", async () => {
    const res = await request(server)
      .patch("/api/leaderboard/handles")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        leetcode: "testuser_lc",
        codeforces: "testuser_cf",
        github: "testuser_gh",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.codingHandles.leetcode).toBe("testuser_lc");
    expect(res.body.data.codingHandles.codeforces).toBe("testuser_cf");
    expect(res.body.data.codingHandles.github).toBe("testuser_gh");

    // Verify persisted in Student doc
    const updatedStudent = await Student.findById(studentId);
    expect(updatedStudent.codingHandles.leetcode).toBe("testuser_lc");
  });

  // 2. GET leaderboard — returns ranked list
  it("GET /api/leaderboard — returns sorted leaderboard entries", async () => {
    // Seed two entries directly
    const userA = await User.findOne({ email: "studentlb1@leaderboard.test" });
    const userB = await User.findOne({ email: "adminlb1@leaderboard.test" });

    await LeaderboardEntry.create({
      studentId,
      userId: userA._id,
      platform: {
        leetcode: {
          solved: 200,
          ranking: 50000,
          easyCount: 80,
          mediumCount: 90,
          hardCount: 30,
        },
        codeforces: {
          rating: 1500,
          maxRating: 1600,
          rank: "specialist",
          maxRank: "expert",
        },
        github: { publicRepos: 10, totalStars: 20, followers: 5 },
      },
      totalScore: 200 * 10 + 30 * 20 + 1500 + 20 * 5 + 10 * 2,
      lastSyncedAt: new Date(),
    });

    // Lower score entry — admin just to seed
    await LeaderboardEntry.create({
      studentId: new mongoose.Types.ObjectId(),
      userId: userB._id,
      platform: {
        leetcode: {
          solved: 50,
          ranking: 200000,
          easyCount: 30,
          mediumCount: 15,
          hardCount: 5,
        },
        codeforces: {
          rating: 800,
          maxRating: 850,
          rank: "newbie",
          maxRank: "newbie",
        },
        github: { publicRepos: 3, totalStars: 2, followers: 1 },
      },
      totalScore: 50 * 10 + 5 * 20 + 800 + 2 * 5 + 3 * 2,
      lastSyncedAt: new Date(),
    });

    const res = await request(server)
      .get("/api/leaderboard")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.entries.length).toBe(2);
    // First entry must have the highest score
    expect(res.body.data.entries[0].rank).toBe(1);
    expect(res.body.data.entries[0].totalScore).toBeGreaterThan(
      res.body.data.entries[1].totalScore,
    );
  });

  // 3. Unauthorized access returns 401
  it("PATCH /api/leaderboard/handles — returns 401 without token", async () => {
    const res = await request(server)
      .patch("/api/leaderboard/handles")
      .send({ leetcode: "unauthorized_user" });

    expect(res.status).toBe(401);
  });

  // 4. Admin-only sync returns 403 for student role
  it("POST /api/leaderboard/sync — returns 403 for student role", async () => {
    const res = await request(server)
      .post("/api/leaderboard/sync")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  // 5. Admin can trigger sync
  it("POST /api/leaderboard/sync — admin can trigger background sync", async () => {
    const res = await request(server)
      .post("/api/leaderboard/sync")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("success");
  });
});
