/**
 * Auth Controller
 * Thin HTTP handler — delegates all logic to auth.service.
 * Never logs passwords or tokens.
 */

const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const result = await authService.login({ username, password });
    res.status(200).json({ success: true, message: 'Login successful.', data: result });
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.registerStudent(req.body || {});
    res.status(201).json({ success: true, message: result.message, data: { userId: result.userId, studentId: result.studentId } });
  } catch (err) { next(err); }
};

const logout = (req, res) => {
  // JWT is stateless — client discards token. Server-side: no-op.
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await authService.changePassword(req.user.userId, { currentPassword, newPassword });
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

module.exports = { login, register, logout, getMe, changePassword };
