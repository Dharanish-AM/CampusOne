const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const BusLocation = require('../models/BusLocation');
const LeaderboardEntry = require('../models/LeaderboardEntry');

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

    if (userRole === 'student') {
      // 1. Resolve student profile
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        const error = new Error('Student profile not found');
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
      const presentCount = attendanceLogs.filter((l) => l.status === 'present').length;
      const absentCount = attendanceLogs.filter((l) => l.status === 'absent').length;
      const leaveCount = attendanceLogs.filter((l) => l.status === 'leave').length;
      const totalClasses = presentCount + absentCount; // leave is excluded
      const overallPercentage = totalClasses > 0 ? Number(((presentCount / totalClasses) * 100).toFixed(1)) : 100.0;

      dashboardData.attendanceSummary = {
        overallPercentage,
        totalClasses,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
      };

      // 3. Fetch Today's Timetable
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      
      const todaySlots = await Timetable.find({
        type: 'recurring',
        dayOfWeek: todayDay,
        department: student.department,
        semester: student.semester,
        batch: student.batch,
      }).sort({ startTime: 1 });

      dashboardData.todayTimetable = todaySlots.map((slot) => ({
        id: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        facultyName: slot.facultyName,
      }));

      // 4. Fetch Bus Status
      const latestBus = await BusLocation.findOne()
        .sort({ createdAt: -1, _id: -1 })
        .populate('routeId', 'routeName');

      dashboardData.busStatus = latestBus
        ? {
            activeRoute: latestBus.routeId?.routeName || 'Unknown Route',
            latitude: latestBus.latitude,
            longitude: latestBus.longitude,
            occupancy: latestBus.occupancy,
            speed: latestBus.speed,
            lastUpdated: latestBus.createdAt,
          }
        : {
            activeRoute: 'No Active Bus',
            lastUpdated: null,
          };

      // 5. Fetch Coding Leaderboard Rank
      const lbEntry = await LeaderboardEntry.findOne({ studentId: student._id });
      if (lbEntry) {
        // Query ranks count to calculate actual rank
        const higherScoresCount = await LeaderboardEntry.countDocuments({
          totalScore: { $gt: lbEntry.totalScore }
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
          id: 'notif_welcome',
          title: 'Welcome to CampusOne!',
          message: 'Explore your timetable, attendance, bus tracking, and coding leaderboard directly from the tabs.',
          createdAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hrs ago
        },
        {
          id: 'notif_attendance',
          title: 'Attendance Policy',
          message: `Keep your attendance above 75%. Your current attendance is ${overallPercentage}%.`,
          createdAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
        }
      ];

      // 7. Mock placement status
      dashboardData.placementStatus = {
        isEligible: student.semester >= 6,
        statusMessage: student.semester >= 6 
          ? 'Eligible for upcoming placements. Resume upload active.' 
          : 'Placement registration opens in 6th Semester.',
      };

    } else if (userRole === 'faculty') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        const error = new Error('Faculty profile not found');
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
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = days[new Date().getDay()];
      
      const todaySlots = await Timetable.find({
        type: 'recurring',
        dayOfWeek: todayDay,
        facultyName: req.user.name,
      }).sort({ startTime: 1 });

      dashboardData.todayClassesTaught = todaySlots.map((slot) => ({
        id: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        department: slot.department,
        semester: slot.semester,
        batch: slot.batch,
      }));

      dashboardData.notifications = [
        {
          id: 'notif_fac_welcome',
          title: 'Welcome to Faculty Portal',
          message: 'You can update timetable slots and mark daily attendance for subjects.',
          createdAt: new Date(),
        }
      ];
    } else {
      // General admin / fallback
      dashboardData.notifications = [
        {
          id: 'notif_admin_welcome',
          title: 'Welcome Admin',
          message: 'CampusOne central management server is running successfully.',
          createdAt: new Date(),
        }
      ];
    }

    res.status(200).json({
      status: 'success',
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
