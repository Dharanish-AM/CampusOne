const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// @desc    Create a new timetable schedule slot
// @route   POST /api/timetable
// @access  Private (Admin / Faculty)
const createTimetableItem = async (req, res, next) => {
  try {
    const item = await Timetable.create(req.body);
    res.status(201).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable slot
// @route   PUT /api/timetable/:id
// @access  Private (Admin / Faculty)
const updateTimetableItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const item = await Timetable.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      const error = new Error('Timetable slot not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable slot
// @route   DELETE /api/timetable/:id
// @access  Private (Admin / Faculty)
const deleteTimetableItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const item = await Timetable.findByIdAndDelete(id);

    if (!item) {
      const error = new Error('Timetable slot not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      message: 'Timetable slot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetable schedule list based on user role
// @route   GET /api/timetable
// @access  Private
const getTimetable = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      // Find student academic mapping
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        const error = new Error('Student profile associated with this account not found');
        error.statusCode = 404;
        return next(error);
      }
      query = {
        department: student.department,
        semester: student.semester,
        batch: student.batch,
      };
    } else if (req.user.role === 'faculty') {
      // Find faculty mapping
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        const error = new Error('Faculty profile associated with this account not found');
        error.statusCode = 404;
        return next(error);
      }
      query = { facultyId: faculty._id };
    } else if (req.user.role === 'admin') {
      // Admins can query by parameters or get everything
      const { department, semester, batch, facultyId } = req.query;
      if (department) query.department = department;
      if (semester) query.semester = Number(semester);
      if (batch) query.batch = batch;
      if (facultyId) query.facultyId = facultyId;
    }

    const items = await Timetable.find(query)
      .populate('subjectId')
      .populate({
        path: 'facultyId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .sort({ startTime: 1 }); // Sort by chronologic time slots

    res.status(200).json({
      status: 'success',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTimetableItem,
  updateTimetableItem,
  deleteTimetableItem,
  getTimetable,
};
