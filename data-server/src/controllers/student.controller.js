/**
 * Student Controller
 * Thin HTTP handler for student self-service endpoints.
 */

const studentService = require('../services/student.service');

const getMe = async (req, res, next) => {
  try {
    const profile = await studentService.getMyProfile(req.user.profileId);
    res.status(200).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const result = await studentService.updateMyProfile(req.user.userId, req.body || {});
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

const getMyTimetable = async (req, res, next) => {
  try {
    const { day } = req.query;
    const timetable = await studentService.getMyTimetable(req.user.profileId, day);
    res.status(200).json({ success: true, data: timetable });
  } catch (err) { next(err); }
};

const getMyResults = async (req, res, next) => {
  try {
    const results = await studentService.getMyResults(req.user.profileId);
    res.status(200).json({ success: true, data: results });
  } catch (err) { next(err); }
};

const getMySubjects = async (req, res, next) => {
  try {
    const subjects = await studentService.getMySubjects(req.user.profileId);
    res.status(200).json({ success: true, data: subjects });
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe, getMyTimetable, getMyResults, getMySubjects };
