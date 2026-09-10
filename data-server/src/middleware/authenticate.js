/**
 * authenticate middleware
 *
 * Verifies the JWT Bearer token, loads the user's identity and role from Neo4j,
 * and attaches req.user to downstream handlers.
 *
 * req.user shape:
 *   { userId, username, email, accountStatus, role, profileId }
 *
 * Never trusts role from the JWT payload alone — always re-verifies from the DB.
 */

const { verifyToken } = require('../utils/auth/token');
const { findAuthUserById } = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Provide a Bearer token.', 401, 'AUTH_REQUIRED'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token); // throws on invalid/expired

    // Always load fresh user state from DB — never trust stale token data
    const user = await findAuthUserById(decoded.userId);
    if (!user) {
      return next(new AppError('User account not found.', 401, 'USER_NOT_FOUND'));
    }

    if (user.accountStatus !== 'ACTIVE') {
      return next(new AppError('Account is inactive or suspended. Contact administration.', 401, 'ACCOUNT_INACTIVE'));
    }

    req.user = user; // { userId, username, email, accountStatus, role, profileId }
    next();
  } catch (err) {
    if (err.isOperational) return next(err);
    next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
};

module.exports = authenticate;
