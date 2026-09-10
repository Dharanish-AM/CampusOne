/**
 * Registration Controller
 * Public endpoints for student registration academic hierarchy lookups.
 */

const registrationService = require('../services/registration.service');

const getDepartments = async (req, res, next) => {
  try {
    const data = await registrationService.getDepartments();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getCourses = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const data = await registrationService.getCourses(departmentId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getBatches = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const data = await registrationService.getBatches(courseId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

const getSections = async (req, res, next) => {
  try {
    const { batchId } = req.query;
    const data = await registrationService.getSections(batchId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getDepartments, getCourses, getBatches, getSections };
