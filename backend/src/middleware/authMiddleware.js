const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if header contains Authorization Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcampusone');

      // Get user from database, exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        const error = new Error('The user belonging to this token no longer exists.');
        error.statusCode = 401;
        return next(error);
      }

      if (!req.user.isActive) {
        const error = new Error('This user account has been deactivated.');
        error.statusCode = 401;
        return next(error);
      }

      next();
    } catch (error) {
      // Token verification failed (e.g., expired or malformed)
      error.statusCode = 401;
      return next(error);
    }
  }

  if (!token) {
    const error = new Error('You are not logged in. Please provide a valid token.');
    error.statusCode = 401;
    return next(error);
  }
};

// Role-Based Access Control (RBAC) middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required for this operation.');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error(`Role '${req.user.role}' is not authorized to access this resource.`);
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
