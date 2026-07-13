const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { getRedisClient } = require('../config/redis');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;

const getSecrets = () => {
  const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkeyforcampusone';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkeyforcampusone';
  return { jwtSecret, refreshSecret };
};

const generateTokens = (user) => {
  const { jwtSecret, refreshSecret } = getSecrets();
  
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    refreshSecret,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );

  return { accessToken, refreshToken };
};

const storeRefreshTokenInRedis = async (userId, token) => {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(`refresh_token:${userId}`, token, 'EX', REFRESH_TOKEN_EXPIRY_SECONDS);
  }
};

const removeRefreshTokenFromRedis = async (userId) => {
  const redis = getRedisClient();
  if (redis) {
    await redis.del(`refresh_token:${userId}`);
  }
};

const getRefreshTokenFromRedis = async (userId) => {
  const redis = getRedisClient();
  if (redis) {
    return await redis.get(`refresh_token:${userId}`);
  }
  return null;
};

// @desc    Register a new user (with Student/Faculty extension)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    // Student specific fields
    rollNumber,
    department,
    semester,
    batch,
    phoneNumber,
    parentPhoneNumber,
    address,
    // Faculty specific fields
    employeeId,
    designation,
  } = req.body;

  let createdUser = null;

  try {
    // 1. Create User
    createdUser = await User.create({
      name,
      email,
      password,
      role,
    });

    let extraDetails = null;

    // 2. Conditionally create role-specific records
    if (role === 'student') {
      try {
        extraDetails = await Student.create({
          userId: createdUser._id,
          rollNumber,
          department,
          semester: Number(semester),
          batch,
          phoneNumber,
          parentPhoneNumber,
          address,
        });
      } catch (studentErr) {
        // Rollback user creation
        await User.findByIdAndDelete(createdUser._id);
        return next(studentErr);
      }
    } else if (role === 'faculty') {
      try {
        extraDetails = await Faculty.create({
          userId: createdUser._id,
          employeeId,
          department,
          designation,
          phoneNumber,
        });
      } catch (facultyErr) {
        // Rollback user creation
        await User.findByIdAndDelete(createdUser._id);
        return next(facultyErr);
      }
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokens(createdUser);
    await storeRefreshTokenInRedis(createdUser._id, refreshToken);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
        profile: extraDetails,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate User & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password, role } = req.body;

  try {
    // 1. Find user & select password
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error('Your account has been deactivated');
      error.statusCode = 401;
      return next(error);
    }

    // Verify role matches intent if provided
    if (role && user.role !== role) {
      const error = new Error(`Access denied. You do not have permissions for the role: ${role}`);
      error.statusCode = 403;
      return next(error);
    }

    // 2. Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    // 3. Fetch details
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id });
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ userId: user._id });
    }

    // 4. Generate tokens & cache in Redis
    const { accessToken, refreshToken } = generateTokens(user);
    await storeRefreshTokenInRedis(user._id, refreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        profile,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (Uses Refresh Token)
const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    const { refreshSecret } = getSecrets();
    
    // 1. Verify token signature & expiry
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token. Please log in again.');
      error.statusCode = 401;
      return next(error);
    }

    // 2. Check if token is present in Redis
    const cachedToken = await getRefreshTokenFromRedis(decoded.id);
    if (!cachedToken || cachedToken !== refreshToken) {
      const error = new Error('Refresh token is invalid or has been revoked.');
      error.statusCode = 401;
      return next(error);
    }

    // 3. Find User
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      const error = new Error('User associated with this token is no longer active.');
      error.statusCode = 401;
      return next(error);
    }

    // 4. Rotate tokens: Generate new access & refresh tokens
    const tokens = generateTokens(user);
    
    // Save new refresh token, remove old
    await storeRefreshTokenInRedis(user._id, tokens.refreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User / Revoke Refresh Token
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await removeRefreshTokenFromRedis(req.user._id);
    }

    // Blacklist access token if header is present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const redis = getRedisClient();
      if (redis) {
        // Blacklist token for 15 minutes (match access token expiry)
        await redis.set(`blacklist:${token}`, 'true', 'EX', 15 * 60);
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
