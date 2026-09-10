/**
 * Resource-level authorization middleware for student endpoints.
 *
 * Ensures a STUDENT can only access their own resources.
 * ADMIN and FACULTY with assigned relationships bypass this check
 * (handled in their own middleware).
 *
 * Usage:
 *   router.get('/students/:studentId', authenticate, authorizeStudentAccess, controller)
 *
 * For /students/me routes this is not needed — the controller uses req.user.profileId directly.
 */

const { getStudentIdByUserId } = require('../repositories/student.repository');
const AppError = require('../utils/AppError');

/**
 * Allows ADMIN full access.
 * Allows FACULTY only if they have an assigned academic relationship to the student.
 * Allows STUDENT only if the studentId matches their own.
 */
const authorizeStudentAccess = async (req, res, next) => {
  try {
    const { role, profileId, userId } = req.user;
    const { studentId } = req.params;

    if (role === 'ADMIN') return next(); // Admin can access any student

    if (role === 'STUDENT') {
      // Student can only access their own record
      if (!studentId || profileId !== studentId) {
        return next(new AppError('You can only access your own student record.', 403, 'FORBIDDEN'));
      }
      return next();
    }

    if (role === 'FACULTY') {
      // Faculty can access a student only if they have a valid academic relationship
      const { hasAssignedRelationship } = require('../repositories/faculty.repository');
      const allowed = await hasAssignedRelationship(profileId, studentId);
      if (!allowed) {
        return next(new AppError('You do not have an assigned academic relationship with this student.', 403, 'FORBIDDEN'));
      }
      return next();
    }

    return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
  } catch (err) {
    next(err);
  }
};

module.exports = { authorizeStudentAccess };
