/**
 * Registration Service
 * Public read-only academic hierarchy lookups for student self-registration.
 */

const academicRepository = require('../repositories/academic.repository');
const AppError = require('../utils/AppError');

const getDepartments = async () => academicRepository.getAllDepartments();

const getCourses = async (departmentId) => {
  if (!departmentId) throw new AppError('departmentId query parameter is required.', 400, 'VALIDATION_ERROR');
  return academicRepository.getCoursesByDepartment(departmentId);
};

const getBatches = async (courseId) => {
  if (!courseId) throw new AppError('courseId query parameter is required.', 400, 'VALIDATION_ERROR');
  return academicRepository.getBatchesByCourse(courseId);
};

const getSections = async (batchId) => {
  if (!batchId) throw new AppError('batchId query parameter is required.', 400, 'VALIDATION_ERROR');
  return academicRepository.getSectionsByBatch(batchId);
};

module.exports = { getDepartments, getCourses, getBatches, getSections };
