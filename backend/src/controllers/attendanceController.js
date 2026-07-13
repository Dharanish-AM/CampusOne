const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Create a new subject
// @route   POST /api/attendance/subjects
// @access  Private (Admin / Faculty)
const createSubject = async (req, res, next) => {
  const { name, code, department, credits } = req.body;

  try {
    const subject = await Subject.create({
      name,
      code,
      department,
      credits,
    });

    res.status(201).json({
      status: 'success',
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subjects
// @route   GET /api/attendance/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({});
    res.status(200).json({
      status: 'success',
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark or Update Attendance for a student
// @route   POST /api/attendance
// @access  Private (Admin / Faculty)
const markAttendance = async (req, res, next) => {
  const { studentId, subjectId, status, date } = req.body;

  try {
    // 1. Validate if student exists
    const studentExists = await Student.findById(studentId).populate('userId');
    if (!studentExists) {
      const error = new Error('Student profile not found');
      error.statusCode = 404;
      return next(error);
    }

    // 2. Validate if subject exists
    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      return next(error);
    }

    // 3. Normalize Date (strip hours to day midnight)
    const normalizedDate = date ? new Date(date) : new Date();
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // 4. Upsert Attendance
    const log = await Attendance.findOneAndUpdate(
      { studentId, subjectId, date: normalizedDate },
      { status, markedBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    // 5. Emit real-time Socket.IO notification to student's unique room
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${studentId}`).emit('attendance:update', {
        status: log.status,
        date: log.date,
        subject: {
          id: subjectExists._id,
          name: subjectExists.name,
          code: subjectExists.code,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance details & predictions for a student
// @route   GET /api/attendance/student
// @access  Private
const getStudentAttendance = async (req, res, next) => {
  let studentId = req.query.studentId;

  try {
    // 1. Resolve studentId if requester is a student
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        const error = new Error('Student profile associated with this account not found');
        error.statusCode = 404;
        return next(error);
      }
      studentId = student._id;
    } else if (!studentId) {
      const error = new Error('Student ID is required for this query');
      error.statusCode = 400;
      return next(error);
    }

    // 2. Fetch all logs for the student populated with Subject details
    const logs = await Attendance.find({ studentId })
      .populate('subjectId')
      .sort({ date: -1 });

    // 3. Aggregate logs subject-wise
    const subjectsMap = {};

    logs.forEach((log) => {
      if (!log.subjectId) return; // Skip logs with orphan subject IDs
      
      const subId = log.subjectId._id.toString();
      
      if (!subjectsMap[subId]) {
        subjectsMap[subId] = {
          subject: {
            id: log.subjectId._id,
            name: log.subjectId.name,
            code: log.subjectId.code,
            credits: log.subjectId.credits,
          },
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          history: [],
        };
      }

      if (log.status === 'present') {
        subjectsMap[subId].present += 1;
        subjectsMap[subId].total += 1;
      } else if (log.status === 'absent') {
        subjectsMap[subId].absent += 1;
        subjectsMap[subId].total += 1;
      } else if (log.status === 'leave') {
        subjectsMap[subId].leave += 1; // Leave doesn't count towards calculated total classes
      }

      subjectsMap[subId].history.push({
        id: log._id,
        date: log.date,
        status: log.status,
      });
    });

    // 4. Compute statistics & predictions for each subject
    const subjectList = Object.values(subjectsMap).map((sub) => {
      const { present, total } = sub;
      const percentage = total > 0 ? (present / total) * 100 : 100; // Defaults to 100% if no classes held

      let prediction = {};
      if (percentage < 75) {
        // Must attend Z consecutive classes to recover to 75%
        const classesNeeded = Math.ceil(3 * total - 4 * present);
        prediction = {
          status: 'danger',
          message: `Must attend next ${classesNeeded} consecutive class${classesNeeded > 1 ? 'es' : ''} to reach 75%`,
          value: classesNeeded,
        };
      } else {
        // Can afford to miss Y consecutive classes safely
        const classesCanMiss = Math.max(0, Math.floor((4 * present - 3 * total) / 3));
        prediction = {
          status: 'safe',
          message: classesCanMiss > 0 
            ? `Can afford to miss next ${classesCanMiss} class${classesCanMiss > 1 ? 'es' : ''} safely`
            : `Borderline attendance: Can't afford to miss the next class`,
          value: classesCanMiss,
        };
      }

      return {
        ...sub,
        percentage: Number(percentage.toFixed(1)),
        prediction,
      };
    });

    // 5. Compute Overall Attendance Stats
    let totalPresent = 0;
    let totalClasses = 0;
    subjectList.forEach((sub) => {
      totalPresent += sub.present;
      totalClasses += sub.total;
    });

    const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 100;

    res.status(200).json({
      status: 'success',
      data: {
        overallPercentage: Number(overallPercentage.toFixed(1)),
        totalClasses,
        totalPresent,
        subjects: subjectList,
        logs: logs.map(l => ({
          id: l._id,
          date: l.date,
          status: l.status,
          subjectCode: l.subjectId?.code,
          subjectName: l.subjectId?.name,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubject,
  getSubjects,
  markAttendance,
  getStudentAttendance,
};
