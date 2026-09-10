/**
 * Faculty Service
 * Business logic for faculty self-service and assignment-scoped access.
 */

const facultyRepository = require('../repositories/faculty.repository');
const timetableRepository = require('../repositories/timetable.repository');
const AppError = require('../utils/AppError');

const getMyProfile = async (facultyId) => {
  const profile = await facultyRepository.getFacultyProfile(facultyId);
  if (!profile) throw new AppError('Faculty profile not found.', 404, 'NOT_FOUND');
  return profile;
};

const getMySubjects = async (facultyId) => {
  return facultyRepository.getFacultySubjects(facultyId);
};

const getMyStudents = async (facultyId) => {
  return facultyRepository.getAssignedStudents(facultyId);
};

const getMyTimetable = async (facultyId, dayOfWeek) => {
  return timetableRepository.getTimetableByFaculty(facultyId, dayOfWeek);
};

module.exports = { getMyProfile, getMySubjects, getMyStudents, getMyTimetable };
