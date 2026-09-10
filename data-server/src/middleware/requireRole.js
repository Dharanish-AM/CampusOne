/**
 * requireRole middleware factory
 *
 * Usage:
 *   router.get('/admin/...', authenticate, requireRole('ADMIN'), controller)
 *   router.get('/faculty/...', authenticate, requireRole('ADMIN', 'FACULTY'), controller)
 *
 * Role is resolved from req.user (set by authenticate middleware), NOT from the request body/params.
 */

const AppError = require('../utils/AppError');

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource.', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = requireRole;
