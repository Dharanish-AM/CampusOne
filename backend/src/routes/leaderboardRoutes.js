const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { updateHandlesSchema } = require('../utils/leaderboardSchemas');
const { getLeaderboard, updateHandles, triggerSync } = require('../controllers/leaderboardController');

// GET /api/leaderboard — all authenticated users can view the ranked list
router.get('/', protect, getLeaderboard);

// PATCH /api/leaderboard/handles — student updates their own coding platform usernames
router.patch(
  '/handles',
  protect,
  authorizeRoles('student'),
  validate(updateHandlesSchema),
  updateHandles
);

// POST /api/leaderboard/sync — admin manually triggers a full background sync
router.post('/sync', protect, authorizeRoles('admin'), triggerSync);

module.exports = router;
