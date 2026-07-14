const cron = require("node-cron");
const Student = require("../models/Student");
const LeaderboardEntry = require("../models/LeaderboardEntry");
const { syncStudentStats } = require("../services/leaderboardService");

/**
 * Syncs a single student's leaderboard entry.
 * Creates or updates the document in place.
 * @param {Object} student - Mongoose Student document (with userId populated)
 */
const syncStudent = async (student) => {
  try {
    const { platform, totalScore } = await syncStudentStats(student);

    await LeaderboardEntry.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          studentId: student._id,
          userId: student.userId,
          platform,
          totalScore,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    console.log(
      `[LeaderboardJob] Synced student ${student._id} — score: ${totalScore}`,
    );
  } catch (err) {
    console.error(
      `[LeaderboardJob] Failed to sync student ${student._id}:`,
      err.message,
    );
  }
};

/**
 * Runs the full leaderboard sync for all students with at least one coding handle.
 * Processes students in batches of 5 to respect Codeforces' 5 req/s rate limit.
 */
const runLeaderboardSync = async () => {
  console.log("[LeaderboardJob] Starting leaderboard sync...");

  try {
    const students = await Student.find({
      $or: [
        { "codingHandles.leetcode": { $ne: null } },
        { "codingHandles.codeforces": { $ne: null } },
        { "codingHandles.github": { $ne: null } },
      ],
    }).lean();

    console.log(
      `[LeaderboardJob] Found ${students.length} students with handles to sync.`,
    );

    // Process in batches of 5 (respects Codeforces 5 req/s limit)
    const BATCH_SIZE = 5;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map(syncStudent));

      // Throttle between batches to avoid hitting rate limits
      if (i + BATCH_SIZE < students.length) {
        await new Promise((res) => setTimeout(res, 1500));
      }
    }

    console.log("[LeaderboardJob] Sync complete.");
  } catch (err) {
    console.error("[LeaderboardJob] Sync error:", err.message);
  }
};

/**
 * Initializes the cron job. Skips scheduling in test environments.
 * Schedule: every 6 hours (00:00, 06:00, 12:00, 18:00)
 */
const initLeaderboardJob = () => {
  if (process.env.NODE_ENV === "test") return;

  cron.schedule("0 */6 * * *", runLeaderboardSync, {
    timezone: "Asia/Kolkata",
  });

  console.log("[LeaderboardJob] Cron job scheduled: every 6 hours (IST).");
};

module.exports = { initLeaderboardJob, runLeaderboardSync, syncStudent };
