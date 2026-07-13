const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../utils/authSchemas');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;
