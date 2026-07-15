const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Attendance = require("../models/Attendance");
const Timetable = require("../models/Timetable");
const BusLocation = require("../models/BusLocation");
const LeaderboardEntry = require("../models/LeaderboardEntry");

// @desc    Get aggregated dashboard summary data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let dashboardData = {
      role: userRole,
      profileSummary: {
        name: req.user.name,
        email: req.user.email,
      },
    };

    if (userRole === "student") {
      // 1. Resolve student profile
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        const error = new Error("Student profile not found");
        error.statusCode = 4404;
        return next(error);
      }

      dashboardData.profileSummary = {
        ...dashboardData.profileSummary,
        rollNumber: student.rollNumber,
        department: student.department,
        semester: student.semester,
        batch: student.batch,
      };

      // 2. Fetch Attendance Summary
      const attendanceLogs = await Attendance.find({ studentId: student._id });
      const presentCount = attendanceLogs.filter(
        (l) => l.status === "present",
      ).length;
      const absentCount = attendanceLogs.filter(
        (l) => l.status === "absent",
      ).length;
      const leaveCount = attendanceLogs.filter(
        (l) => l.status === "leave",
      ).length;
      const totalClasses = presentCount + absentCount; // leave is excluded
      const overallPercentage =
        totalClasses > 0
          ? Number(((presentCount / totalClasses) * 100).toFixed(1))
          : 100.0;

      dashboardData.attendanceSummary = {
        overallPercentage,
        totalClasses,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
      };

      // 3. Fetch Today's Timetable
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayDay = days[new Date().getDay()];

      const todaySlots = await Timetable.find({
        isRecurring: true,
        dayOfWeek: todayDay,
        department: student.department,
        semester: student.semester,
        batch: student.batch,
      })
        .populate("subjectId", "name code")
        .populate({
          path: "facultyId",
          populate: { path: "userId", select: "name" },
        })
        .sort({ startTime: 1 });

      dashboardData.todayTimetable = todaySlots.map((slot) => ({
        id: slot._id,
        subjectCode: slot.subjectId?.code || "N/A",
        subjectName: slot.subjectId?.name || "Unknown Subject",
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.roomNumber || "TBD",
        facultyName: slot.facultyId?.userId?.name || "N/A",
        type: slot.type,
      }));

      // 4. Fetch Bus Status
      const latestBus = await BusLocation.findOne()
        .sort({ createdAt: -1, _id: -1 })
        .populate("routeId", "routeName");

      dashboardData.busStatus = latestBus
        ? {
            activeRoute: latestBus.routeId?.routeName || "Unknown Route",
            latitude: latestBus.latitude,
            longitude: latestBus.longitude,
            occupancy: latestBus.occupancy,
            speed: latestBus.speed,
            lastUpdated: latestBus.createdAt,
          }
        : {
            activeRoute: "No Active Bus",
            lastUpdated: null,
          };

      // 5. Fetch Coding Leaderboard Rank
      const lbEntry = await LeaderboardEntry.findOne({
        studentId: student._id,
      });
      if (lbEntry) {
        // Query ranks count to calculate actual rank
        const higherScoresCount = await LeaderboardEntry.countDocuments({
          totalScore: { $gt: lbEntry.totalScore },
        });
        dashboardData.leaderboardRank = {
          rank: higherScoresCount + 1,
          score: lbEntry.totalScore,
        };
      } else {
        dashboardData.leaderboardRank = {
          rank: null,
          score: 0,
        };
      }

      // 6. Mock notifications relevant to student
      dashboardData.notifications = [
        {
          id: "notif_welcome",
          title: "Welcome to CampusOne!",
          message:
            "Explore your timetable, attendance, bus tracking, and coding leaderboard directly from the tabs.",
          createdAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hrs ago
        },
        {
          id: "notif_attendance",
          title: "Attendance Policy",
          message: `Keep your attendance above 75%. Your current attendance is ${overallPercentage}%.`,
          createdAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
        },
      ];

      // 7. Dynamic placement eligibility
      const isEligible =
        student.semester >= 6 && student.cgpa >= 6.0 && student.backlogs === 0;
      let statusMessage = "Placement registration opens in 6th Semester.";
      if (student.semester >= 6) {
        if (student.cgpa < 6.0) {
          statusMessage = "Ineligible due to low CGPA (Required: 6.0+).";
        } else if (student.backlogs > 0) {
          statusMessage = `Ineligible due to ${student.backlogs} active backlog(s).`;
        } else {
          statusMessage =
            "Eligible for active placement drives. Resume upload active.";
        }
      }
      dashboardData.placementStatus = {
        isEligible,
        statusMessage,
      };
    } else if (userRole === "faculty") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        const error = new Error("Faculty profile not found");
        error.statusCode = 404;
        return next(error);
      }

      dashboardData.profileSummary = {
        ...dashboardData.profileSummary,
        employeeId: faculty.employeeId,
        department: faculty.department,
        designation: faculty.designation,
      };

      // Fetch Today's Classes taught by this Faculty member
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayDay = days[new Date().getDay()];

      const todaySlots = await Timetable.find({
        isRecurring: true,
        dayOfWeek: todayDay,
        facultyId: faculty._id,
      })
        .populate("subjectId", "name code")
        .sort({ startTime: 1 });

      dashboardData.todayClassesTaught = todaySlots.map((slot) => ({
        id: slot._id,
        subjectCode: slot.subjectId?.code || "N/A",
        subjectName: slot.subjectId?.name || "Unknown Subject",
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.roomNumber || "TBD",
        department: slot.department,
        semester: slot.semester,
        batch: slot.batch,
        type: slot.type,
      }));

      dashboardData.notifications = [
        {
          id: "notif_fac_welcome",
          title: "Welcome to Faculty Portal",
          message:
            "You can update timetable slots and mark daily attendance for subjects.",
          createdAt: new Date(),
        },
      ];
    } else {
      // General admin / fallback
      dashboardData.notifications = [
        {
          id: "notif_admin_welcome",
          title: "Welcome Admin",
          message:
            "CampusOne central management server is running successfully.",
          createdAt: new Date(),
        },
      ];
    }

    res.status(200).json({
      status: "success",
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
