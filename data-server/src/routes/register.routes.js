const express = require('express');
const router = express.Router();
const academicRepository = require('../repositories/academic.repository');

// GET /api/register/departments
router.get('/departments', async (req, res, next) => {
  try {
    const list = await academicRepository.getAllDepartments();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/register/courses?departmentId=...
router.get('/courses', async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'Query parameter departmentId is required.' });
    }
    const list = await academicRepository.getCoursesByDepartment(departmentId);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/register/batches?courseId=...
router.get('/batches', async (req, res, next) => {
  try {
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Query parameter courseId is required.' });
    }
    const list = await academicRepository.getBatchesByCourse(courseId);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/register/sections?batchId=...
router.get('/sections', async (req, res, next) => {
  try {
    const { batchId } = req.query;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Query parameter batchId is required.' });
    }
    const list = await academicRepository.getSectionsByBatch(batchId);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
