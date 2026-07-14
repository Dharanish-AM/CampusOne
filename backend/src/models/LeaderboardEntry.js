const mongoose = require("mongoose");

const platformStatsSchema = new mongoose.Schema(
  {
    leetcode: {
      solved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      easyCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      hardCount: { type: Number, default: 0 },
    },
    codeforces: {
      rating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      rank: { type: String, default: "unrated" },
      maxRank: { type: String, default: "unrated" },
    },
    github: {
      publicRepos: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const leaderboardEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: platformStatsSchema,
      default: () => ({}),
    },
    totalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const LeaderboardEntry = mongoose.model(
  "LeaderboardEntry",
  leaderboardEntrySchema,
);

module.exports = LeaderboardEntry;
