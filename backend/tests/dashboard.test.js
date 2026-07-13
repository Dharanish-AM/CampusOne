const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../src/index');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Attendance = require('../src/models/Attendance');
const BusRoute = require('../src/models/BusRoute');
const BusLocation = require('../src/models/BusLocation');
const LeaderboardEntry = require('../src/models/LeaderboardEntry');

let studentToken, studentId, userId, facultyId;

const registerStudent = async () => {
  const res = await request(server)
    .post('/api/auth/register')
    .send({
      name: 'Dashboard Student',
      email: 'dash_student@campus.edu',
      password: 'password123',
      role: 'student',
      rollNumber: 'ROLL-DASH-001',
      department: 'CSE',
      semester: 4,
      batch: '2023-2027',
    });

  if (res.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);

  const studentDoc = await Student.findOne({ rollNumber: 'ROLL-DASH-001' });
  return {
    token: res.body.data.accessToken,
    userId: res.body.data.user.id,
    studentId: studentDoc._id,
  };
};

const registerFaculty = async () => {
  const res = await request(server)
    .post('/api/auth/register')
    .send({
      name: 'Dashboard Faculty',
      email: 'dash_faculty@campus.edu',
      password: 'password123',
      role: 'faculty',
      employeeId: 'FAC-DASH-001',
      department: 'CSE',
      designation: 'Professor',
    });

  if (res.status !== 201) throw new Error(`Faculty registration failed: ${JSON.stringify(res.body)}`);
  return res.body.data.user.id;
};

beforeEach(async () => {
  const creds = await registerStudent();
  studentToken = creds.token;
  userId = creds.userId;
  studentId = creds.studentId;
  facultyId = await registerFaculty();
});

describe('Dashboard API Test Suite', () => {
  // 1. Unauthenticated access blocked
  it('GET /api/dashboard — should return 401 without auth', async () => {
    const res = await request(server).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  // 2. Returns full aggregate payload for student
  it('GET /api/dashboard — returns complete dashboard data for student', async () => {
    const res = await request(server)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const data = res.body.data;

    // Check all top-level keys present
    expect(data.role).toBe('student');
    expect(data.profileSummary).toBeDefined();
    expect(data.attendanceSummary).toBeDefined();
    expect(data.todayTimetable).toBeDefined();
    expect(data.busStatus).toBeDefined();
    expect(data.leaderboardRank).toBeDefined();
    expect(data.notifications).toBeDefined();
    expect(data.placementStatus).toBeDefined();

    // Profile summary correctness
    expect(data.profileSummary.rollNumber).toBe('ROLL-DASH-001');
    expect(data.profileSummary.department).toBe('CSE');
    expect(data.profileSummary.semester).toBe(4);

    // Notifications and placements are arrays/objects
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(typeof data.placementStatus.isEligible).toBe('boolean');
  });

  // 3. Attendance summary correctly computed from seeded logs
  it('GET /api/dashboard — attendance summary reflects seeded logs', async () => {
    // Create a subject to satisfy the required FK
    const subject = await Subject.create({
      name: 'Data Structures',
      code: 'CS401-DASH',
      department: 'CSE',
      credits: 4,
    });
    const subjectId = subject._id;

    // Seed: 3 present, 1 absent, 1 leave — using different dates to pass unique index
    await Attendance.insertMany([
      { studentId, subjectId, date: new Date('2026-01-01'), status: 'present', markedBy: facultyId },
      { studentId, subjectId, date: new Date('2026-01-02'), status: 'present', markedBy: facultyId },
      { studentId, subjectId, date: new Date('2026-01-03'), status: 'present', markedBy: facultyId },
      { studentId, subjectId, date: new Date('2026-01-04'), status: 'absent',  markedBy: facultyId },
      { studentId, subjectId, date: new Date('2026-01-05'), status: 'leave',   markedBy: facultyId },
    ]);

    const res = await request(server)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const { attendanceSummary } = res.body.data;

    expect(attendanceSummary.present).toBe(3);
    expect(attendanceSummary.absent).toBe(1);
    expect(attendanceSummary.leave).toBe(1);
    expect(attendanceSummary.totalClasses).toBe(4); // present + absent (leave excluded)
    expect(attendanceSummary.overallPercentage).toBe(75.0);
  });

  // 4. Bus status reflects latest BusLocation entry
  it('GET /api/dashboard — bus status reflects seeded BusLocation', async () => {
    const route = await BusRoute.create({
      routeName: 'Route Alpha',
      routeCode: 'ROUTE-ALPHA',
      stops: [{ name: 'Stop A', latitude: 12.9, longitude: 77.6 }],
      driverId: new mongoose.Types.ObjectId(facultyId),
    });

    await BusLocation.create({
      routeId: route._id,
      latitude: 12.9716,
      longitude: 77.5946,
      speed: 40,
      occupancy: 25,
    });

    const res = await request(server)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const { busStatus } = res.body.data;
    expect(busStatus.activeRoute).toBe('Route Alpha');
    expect(busStatus.speed).toBe(40);
    expect(busStatus.latitude).toBeCloseTo(12.9716, 2);
  });

  // 5. Leaderboard rank correctly resolved
  it('GET /api/dashboard — leaderboard rank reflects entry', async () => {
    await LeaderboardEntry.create({
      studentId,
      userId,
      totalScore: 1500,
      platform: {
        leetcode: { solved: 100, ranking: 50000, easyCount: 40, mediumCount: 50, hardCount: 10 },
        codeforces: { rating: 1200, maxRating: 1300, rank: 'specialist', maxRank: 'specialist' },
        github: { publicRepos: 5, totalStars: 10, followers: 2 },
      },
      lastSyncedAt: new Date(),
    });

    const res = await request(server)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const { leaderboardRank } = res.body.data;
    expect(leaderboardRank.rank).toBe(1); // only entry → rank 1
    expect(leaderboardRank.score).toBe(1500);
  });
});
