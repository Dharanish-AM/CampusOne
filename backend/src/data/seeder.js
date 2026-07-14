const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Timetable = require("../models/Timetable");
const BusRoute = require("../models/BusRoute");
const BusLocation = require("../models/BusLocation");
const LeaderboardEntry = require("../models/LeaderboardEntry");
const ChatHistory = require("../models/ChatHistory");

// Database Connection URI
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/campusone";

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully.");

    // 1. Clear Existing Data
    console.log("Clearing database collections...");
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    await Timetable.deleteMany({});
    await BusRoute.deleteMany({});
    await BusLocation.deleteMany({});
    await LeaderboardEntry.deleteMany({});
    await ChatHistory.deleteMany({});
    console.log("All collections cleared successfully.");

    // 2. Create Users
    console.log("Creating users...");

    // Primary Student User
    const studentUser1 = await User.create({
      name: "Alex Rivera",
      email: "student@campusone.edu",
      password: "password123",
      role: "student",
    });

    // Secondary Student Users
    const studentUser2 = await User.create({
      name: "Elena Rostova",
      email: "elena@campusone.edu",
      password: "password123",
      role: "student",
    });

    const studentUser3 = await User.create({
      name: "Sophia Chen",
      email: "sophia@campusone.edu",
      password: "password123",
      role: "student",
    });

    const studentUser4 = await User.create({
      name: "Marcus Vance",
      email: "marcus@campusone.edu",
      password: "password123",
      role: "student",
    });

    const studentUser5 = await User.create({
      name: "Jane Doe",
      email: "jane@campusone.edu",
      password: "password123",
      role: "student",
    });

    const studentUser6 = await User.create({
      name: "John Smith",
      email: "john@campusone.edu",
      password: "password123",
      role: "student",
    });

    // Faculty Users
    const facultyUser1 = await User.create({
      name: "Prof. Alan Turing",
      email: "turing@campusone.edu",
      password: "password123",
      role: "faculty",
    });

    const facultyUser2 = await User.create({
      name: "Prof. Grace Hopper",
      email: "hopper@campusone.edu",
      password: "password123",
      role: "faculty",
    });

    // Transport Driver User
    const driverUser = await User.create({
      name: "Bob Miller",
      email: "bob_driver@campusone.edu",
      password: "password123",
      role: "transport_staff",
    });

    // Admin User
    const adminUser = await User.create({
      name: "CampusOne Admin",
      email: "admin@campusone.edu",
      password: "password123",
      role: "admin",
    });

    console.log("Users created successfully.");

    // 3. Create Student & Faculty Profiles
    console.log("Creating Student and Faculty profiles...");

    // Student Profiles
    const alexProfile = await Student.create({
      userId: studentUser1._id,
      rollNumber: "CS-2023-042",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198420",
      parentPhoneNumber: "+15550198421",
      address: "742 Evergreen Terrace, Campus Hills",
      codingHandles: {
        leetcode: "alex_codes_99",
        codeforces: "alex_cf",
        github: "arivera-dev",
      },
    });

    const elenaProfile = await Student.create({
      userId: studentUser2._id,
      rollNumber: "CS-2023-156",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198156",
      parentPhoneNumber: "+15550198157",
      address: "Flat 4B, Crimson Arcade, Campus South",
      codingHandles: {
        leetcode: "elena_rostova",
        codeforces: "elena_r",
        github: "elena-rostova",
      },
    });

    const sophiaProfile = await Student.create({
      userId: studentUser3._id,
      rollNumber: "CS-2023-088",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198088",
      parentPhoneNumber: "+15550198089",
      address: "Room 302, Hostel Block C, Main Campus",
      codingHandles: {
        leetcode: "sophia_chen",
        codeforces: "sophia_c",
        github: "schen-dev",
      },
    });

    const marcusProfile = await Student.create({
      userId: studentUser4._id,
      rollNumber: "CS-2023-112",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198112",
      parentPhoneNumber: "+15550198113",
      address: "12 Oak Lane, Campus North",
      codingHandles: {
        leetcode: "marcus_vance",
        codeforces: "marcus_v",
        github: "mvance",
      },
    });

    const janeProfile = await Student.create({
      userId: studentUser5._id,
      rollNumber: "EC-2023-005",
      department: "Electronics & Communication",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198005",
      parentPhoneNumber: "+15550198006",
      address: "56 Pine Boulevard, Metro West",
      codingHandles: {
        leetcode: "jane_doe_ec",
        codeforces: "jane_doe",
        github: "jdoe-ec",
      },
    });

    const johnProfile = await Student.create({
      userId: studentUser6._id,
      rollNumber: "IT-2023-019",
      department: "Information Technology",
      semester: 5,
      batch: "2023-2027",
      phoneNumber: "+15550198019",
      parentPhoneNumber: "+15550198020",
      address: "Room 114, Hostel Block A, Main Campus",
      codingHandles: {
        leetcode: "jsmith_it",
        codeforces: "john_smith",
        github: "jsmith-dev",
      },
    });

    // Faculty Profiles
    const turingProfile = await Faculty.create({
      userId: facultyUser1._id,
      employeeId: "EMP-TURING-101",
      department: "Computer Science",
      designation: "Professor & Chair",
      phoneNumber: "+15550123401",
    });

    const hopperProfile = await Faculty.create({
      userId: facultyUser2._id,
      employeeId: "EMP-HOPPER-102",
      department: "Computer Science",
      designation: "Associate Professor",
      phoneNumber: "+15550123402",
    });

    console.log("Profiles created successfully.");

    // 4. Create Subjects
    console.log("Creating subjects...");
    const mlSubject = await Subject.create({
      name: "Machine Learning",
      code: "CS-301",
      department: "Computer Science",
      credits: 4,
    });

    const osSubject = await Subject.create({
      name: "Operating Systems",
      code: "CS-302",
      department: "Computer Science",
      credits: 4,
    });

    const cnSubject = await Subject.create({
      name: "Computer Networks",
      code: "CS-303",
      department: "Computer Science",
      credits: 3,
    });

    const seSubject = await Subject.create({
      name: "Software Engineering",
      code: "CS-304",
      department: "Computer Science",
      credits: 3,
    });

    const dbSubject = await Subject.create({
      name: "Database Systems",
      code: "CS-305",
      department: "Computer Science",
      credits: 4,
    });

    console.log("Subjects created successfully.");

    // 5. Create Attendance Logs (Rich 3-week weekday logs for Alex)
    console.log("Generating attendance logs for primary student...");

    const subjectsList = [
      { subject: mlSubject, presentRate: 0.93 }, // ~93% (Safe)
      { subject: osSubject, presentRate: 0.8 }, // ~80% (Safe)
      { subject: cnSubject, presentRate: 0.6 }, // ~60% (Shortage Warning!)
      { subject: seSubject, presentRate: 0.86 }, // ~86% (Safe)
      { subject: dbSubject, presentRate: 0.73 }, // ~73% (Shortage Warning!)
    ];

    const attendanceRecords = [];
    const weekdaysCount = 15; // Number of days to back-date (representing ~3 weeks of weekdays)
    let currentDaysBack = 0;
    let checkedDate = new Date();

    while (currentDaysBack < weekdaysCount) {
      checkedDate.setDate(checkedDate.getDate() - 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (checkedDate.getDay() === 0 || checkedDate.getDay() === 6) {
        continue;
      }

      currentDaysBack++;
      const attendanceDay = new Date(checkedDate);
      attendanceDay.setHours(0, 0, 0, 0); // Keep time normalized

      for (const item of subjectsList) {
        // Roll random status based on target attendance percentage
        const isPresent = Math.random() < item.presentRate;
        const status = isPresent
          ? "present"
          : Math.random() < 0.3
            ? "leave"
            : "absent";

        attendanceRecords.push({
          studentId: alexProfile._id,
          subjectId: item.subject._id,
          date: new Date(attendanceDay),
          status: status,
          markedBy: facultyUser1._id, // Marked by Prof. Turing
        });
      }
    }

    // Insert all attendance records
    await Attendance.create(attendanceRecords);
    console.log(
      `Successfully generated ${attendanceRecords.length} attendance logs for Alex.`,
    );

    // 6. Create Timetable (Weekly Lecture and Lab Slots)
    console.log("Seeding timetable schedule...");

    // Monday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: seSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-103",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Monday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Tuesday
    await Timetable.create({
      subjectId: cnSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-201",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LAB-3",
      type: "lab",
      isRecurring: true,
      dayOfWeek: "Tuesday",
      startTime: "14:00",
      endTime: "16:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Wednesday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: cnSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-201",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Wednesday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Thursday
    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: seSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-103",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LAB-1",
      type: "lab",
      isRecurring: true,
      dayOfWeek: "Thursday",
      startTime: "14:00",
      endTime: "16:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    // Friday
    await Timetable.create({
      subjectId: mlSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-101",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "09:00",
      endTime: "10:00",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: osSubject._id,
      facultyId: hopperProfile._id,
      roomNumber: "LH-102",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "10:15",
      endTime: "11:15",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    await Timetable.create({
      subjectId: dbSubject._id,
      facultyId: turingProfile._id,
      roomNumber: "LH-202",
      type: "lecture",
      isRecurring: true,
      dayOfWeek: "Friday",
      startTime: "11:30",
      endTime: "12:30",
      department: "Computer Science",
      semester: 5,
      batch: "2023-2027",
    });

    console.log("Timetable schedule seeded.");

    // 7. Create Bus Routes & Locations
    console.log("Seeding Bus Routes and Live Location coordinates...");

    // Route A
    const routeA = await BusRoute.create({
      routeName: "Route A: Metro Link Terminal",
      routeCode: "ROUTE-A",
      driverId: driverUser._id,
      stops: [
        { name: "Metro Terminal Gates", latitude: 12.9716, longitude: 77.5946 },
        {
          name: "Majestic Crossing Stop",
          latitude: 12.9774,
          longitude: 77.5729,
        },
        {
          name: "Malleshwaram 8th Cross Circle",
          latitude: 13.0031,
          longitude: 77.5717,
        },
        {
          name: "Campus Main Entrance Gate",
          latitude: 13.0282,
          longitude: 77.5896,
        },
      ],
    });

    // Route B
    const routeB = await BusRoute.create({
      routeName: "Route B: South City Hub Line",
      routeCode: "ROUTE-B",
      driverId: driverUser._id,
      stops: [
        {
          name: "Jayanagar Complex Stand",
          latitude: 12.9279,
          longitude: 77.5824,
        },
        { name: "JP Nagar Subway Stop", latitude: 12.9077, longitude: 77.5746 },
        {
          name: "Bannerghatta Highroad Junc",
          latitude: 12.9238,
          longitude: 77.6006,
        },
        {
          name: "Campus Main Entrance Gate",
          latitude: 13.0282,
          longitude: 77.5896,
        },
      ],
    });

    // Seed Active Live Bus Location (Route A is currently active)
    await BusLocation.create({
      routeId: routeA._id,
      latitude: 13.0031, // Currently at Malleshwaram stop
      longitude: 77.5717,
      occupancy: 28,
      speed: 38,
    });

    console.log("Bus routes and active locations seeded.");

    // 8. Create Leaderboard Entries
    console.log("Seeding Leaderboard Entries for all students...");

    // Elena (#1 Rank)
    await LeaderboardEntry.create({
      studentId: elenaProfile._id,
      userId: studentUser2._id,
      platform: {
        leetcode: {
          solved: 482,
          ranking: 4528,
          easyCount: 120,
          mediumCount: 260,
          hardCount: 102,
        },
        codeforces: {
          rating: 1850,
          maxRating: 1900,
          rank: "candidate master",
          maxRank: "candidate master",
        },
        github: { publicRepos: 45, totalStars: 156, followers: 42 },
      },
      totalScore: 5890,
      lastSyncedAt: new Date(),
    });

    // Sophia (#2 Rank)
    await LeaderboardEntry.create({
      studentId: sophiaProfile._id,
      userId: studentUser3._id,
      platform: {
        leetcode: {
          solved: 290,
          ranking: 12844,
          easyCount: 100,
          mediumCount: 150,
          hardCount: 40,
        },
        codeforces: {
          rating: 1620,
          maxRating: 1650,
          rank: "expert",
          maxRank: "expert",
        },
        github: { publicRepos: 32, totalStars: 45, followers: 15 },
      },
      totalScore: 3820,
      lastSyncedAt: new Date(),
    });

    // John (#3 Rank)
    await LeaderboardEntry.create({
      studentId: johnProfile._id,
      userId: studentUser6._id,
      platform: {
        leetcode: {
          solved: 210,
          ranking: 24890,
          easyCount: 70,
          mediumCount: 120,
          hardCount: 20,
        },
        codeforces: {
          rating: 1510,
          maxRating: 1550,
          rank: "specialist",
          maxRank: "specialist",
        },
        github: { publicRepos: 28, totalStars: 18, followers: 9 },
      },
      totalScore: 2980,
      lastSyncedAt: new Date(),
    });

    // Alex (#4 Rank)
    await LeaderboardEntry.create({
      studentId: alexProfile._id,
      userId: studentUser1._id,
      platform: {
        leetcode: {
          solved: 184,
          ranking: 34102,
          easyCount: 80,
          mediumCount: 88,
          hardCount: 16,
        },
        codeforces: {
          rating: 1420,
          maxRating: 1450,
          rank: "specialist",
          maxRank: "specialist",
        },
        github: { publicRepos: 24, totalStars: 12, followers: 8 },
      },
      totalScore: 2540,
      lastSyncedAt: new Date(),
    });

    // Jane (#5 Rank)
    await LeaderboardEntry.create({
      studentId: janeProfile._id,
      userId: studentUser5._id,
      platform: {
        leetcode: {
          solved: 95,
          ranking: 95804,
          easyCount: 50,
          mediumCount: 40,
          hardCount: 5,
        },
        codeforces: {
          rating: 1210,
          maxRating: 1250,
          rank: "pupil",
          maxRank: "pupil",
        },
        github: { publicRepos: 15, totalStars: 8, followers: 4 },
      },
      totalScore: 1360,
      lastSyncedAt: new Date(),
    });

    // Marcus (#6 Rank)
    await LeaderboardEntry.create({
      studentId: marcusProfile._id,
      userId: studentUser4._id,
      platform: {
        leetcode: {
          solved: 84,
          ranking: 114520,
          easyCount: 40,
          mediumCount: 40,
          hardCount: 4,
        },
        codeforces: {
          rating: 1150,
          maxRating: 1200,
          rank: "pupil",
          maxRank: "pupil",
        },
        github: { publicRepos: 18, totalStars: 5, followers: 3 },
      },
      totalScore: 1210,
      lastSyncedAt: new Date(),
    });

    console.log("Leaderboard entries seeded.");
    console.log("----------------------------------------------------");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("----------------------------------------------------");
    console.log("Primary Test Credentials:");
    console.log("  Email:    student@campusone.edu");
    console.log("  Password: password123");
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("Seeding encountered an error:", error.message);
  } finally {
    console.log("Closing database connection...");
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run Seeder
seedDatabase();
