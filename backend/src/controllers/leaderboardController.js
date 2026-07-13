const Student = require('../models/Student');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const { syncStudent } = require('../jobs/leaderboardJob');

/**
 * GET /api/leaderboard
 * Returns paginated leaderboard entries sorted by totalScore descending.
 * Query params: page (default 1), limit (default 50)
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [entries, totalCount] = await Promise.all([
      LeaderboardEntry.find()
        .sort({ totalScore: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name')
        .populate('studentId', 'rollNumber department semester codingHandles')
        .lean(),
      LeaderboardEntry.countDocuments(),
    ]);

    // Inject 1-based global rank
    const ranked = entries.map((entry, idx) => ({
      rank: skip + idx + 1,
      ...entry,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        entries: ranked,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/leaderboard/handles
 * Authenticated student updates their own coding platform handles.
 * Triggers an immediate re-sync for that student only.
 */
const updateHandles = async (req, res, next) => {
  try {
    const { leetcode, codeforces, github } = req.body;

    // Find student record linked to this user
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
    }

    // Update only the fields that were provided
    if (leetcode !== undefined) student.codingHandles.leetcode = leetcode;
    if (codeforces !== undefined) student.codingHandles.codeforces = codeforces;
    if (github !== undefined) student.codingHandles.github = github;

    await student.save();

    // Trigger an immediate re-sync for this student only (non-blocking)
    syncStudent(student).catch((err) =>
      console.error('[updateHandles] Re-sync error:', err.message)
    );

    res.status(200).json({
      status: 'success',
      message: 'Coding handles updated. Leaderboard sync triggered.',
      data: { codingHandles: student.codingHandles },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/leaderboard/sync
 * Admin-only: manually triggers a full leaderboard sync.
 */
const triggerSync = async (req, res, next) => {
  try {
    const { runLeaderboardSync } = require('../jobs/leaderboardJob');

    // Run sync non-blocking — return immediately
    runLeaderboardSync().catch((err) =>
      console.error('[triggerSync] Full sync error:', err.message)
    );

    res.status(202).json({
      status: 'success',
      message: 'Full leaderboard sync triggered. This runs in the background.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard, updateHandles, triggerSync };
