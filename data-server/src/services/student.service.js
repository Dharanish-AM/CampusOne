/**
 * Student Service
 * Business logic for student self-service endpoints.
 */

const studentRepository = require('../repositories/student.repository');
const AppError = require('../utils/AppError');

const getMyProfile = async (studentId) => {
  const profile = await studentRepository.getStudentProfile(studentId);
  if (!profile) throw new AppError('Student profile not found.', 404, 'NOT_FOUND');
  return profile;
};

const getMyTimetable = async (studentId, dayOfWeek) => {
  return studentRepository.getStudentTimetable(studentId, dayOfWeek || null);
};

const getMyResults = async (studentId) => {
  return studentRepository.getStudentResults(studentId);
};

const getMySubjects = async (studentId) => {
  return studentRepository.getStudentSubjects(studentId);
};

const updateMyProfile = async (userId, fields) => {
  // Only permit updating personal contact fields — never academic/role fields
  const allowed = {
    phone:        fields.phone        ?? null,
    addressLine1: fields.addressLine1 ?? null,
    city:         fields.city         ?? null,
    state:        fields.state        ?? null,
  };
  await studentRepository.updateStudentPersonalInfo(userId, allowed);
  return { message: 'Profile updated successfully.' };
};

module.exports = { getMyProfile, getMyTimetable, getMyResults, getMySubjects, updateMyProfile };
