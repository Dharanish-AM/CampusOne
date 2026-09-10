/**
 * Faculty Controller
 * Thin HTTP handler for faculty self-service endpoints.
 */

const facultyService = require('../services/faculty.service');

const getMe = async (req, res, next) => {
  try {
    const profile = await facultyService.getMyProfile(req.user.profileId);
    res.status(200).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

const getMySubjects = async (req, res, next) => {
  try {
    const subjects = await facultyService.getMySubjects(req.user.profileId);
    res.status(200).json({ success: true, data: subjects });
  } catch (err) { next(err); }
};

const getMyStudents = async (req, res, next) => {
  try {
    const students = await facultyService.getMyStudents(req.user.profileId);
    res.status(200).json({ success: true, data: students });
  } catch (err) { next(err); }
};

const getMyTimetable = async (req, res, next) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({ success: false, message: 'Query param ?day=MONDAY required.' });
    }
    const timetable = await facultyService.getMyTimetable(req.user.profileId, day.toUpperCase());
    res.status(200).json({ success: true, data: timetable });
  } catch (err) { next(err); }
};

module.exports = { getMe, getMySubjects, getMyStudents, getMyTimetable };
