const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const registerRoutes = require('./register.routes');
const studentRoutes = require('./student.routes');
const facultyRoutes = require('./faculty.routes');
const adminRoutes = require('./admin.routes');

/**
 * @route   GET /api
 * @desc    API Root entry point
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusOne API is available'
  });
});

// Authentication & Public Options Routes
router.use('/auth', authRoutes);
router.use('/register', registerRoutes);

// Role-scoped API routes
router.use('/students', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
