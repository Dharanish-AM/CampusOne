const axios = require('axios');

// ─────────────────────────────────────────────
// Scoring Formula Constants
// ─────────────────────────────────────────────
const WEIGHTS = {
  LEETCODE_SOLVED: 10,
  LEETCODE_HARD_BONUS: 20,
  CODEFORCES_RATING: 1,
  GITHUB_STARS: 5,
  GITHUB_REPOS: 2,
};

/**
 * Calculates a composite score from all platform stats.
 * @param {Object} platform - { leetcode, codeforces, github }
 * @returns {number}
 */
const computeScore = (platform) => {
  const lc = platform.leetcode || {};
  const cf = platform.codeforces || {};
  const gh = platform.github || {};

  const lcScore =
    (lc.solved || 0) * WEIGHTS.LEETCODE_SOLVED +
    (lc.hardCount || 0) * WEIGHTS.LEETCODE_HARD_BONUS;

  const cfScore = (cf.rating || 0) * WEIGHTS.CODEFORCES_RATING;

  const ghScore =
    (gh.totalStars || 0) * WEIGHTS.GITHUB_STARS +
    (gh.publicRepos || 0) * WEIGHTS.GITHUB_REPOS;

  return lcScore + cfScore + ghScore;
};

// ─────────────────────────────────────────────
// LeetCode — Public GraphQL endpoint
// ─────────────────────────────────────────────
const fetchLeetCodeStats = async (username) => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        profile { ranking }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const { data } = await axios.post(
    'https://leetcode.com/graphql',
    { query, variables: { username } },
    {
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      timeout: 10000,
    }
  );

  const user = data?.data?.matchedUser;
  if (!user) return null;

  const acStats = user.submitStats?.acSubmissionNum || [];
  const easy = acStats.find((s) => s.difficulty === 'Easy')?.count || 0;
  const medium = acStats.find((s) => s.difficulty === 'Medium')?.count || 0;
  const hard = acStats.find((s) => s.difficulty === 'Hard')?.count || 0;

  return {
    solved: easy + medium + hard,
    ranking: user.profile?.ranking || 0,
    easyCount: easy,
    mediumCount: medium,
    hardCount: hard,
  };
};

// ─────────────────────────────────────────────
// Codeforces — Official public REST API
// ─────────────────────────────────────────────
const fetchCodeforcesStats = async (handle) => {
  const { data } = await axios.get(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
    { timeout: 10000 }
  );

  if (data.status !== 'OK' || !data.result?.length) return null;

  const user = data.result[0];
  return {
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'unrated',
    maxRank: user.maxRank || 'unrated',
  };
};

// ─────────────────────────────────────────────
// GitHub — REST API v3 (auth optional via GITHUB_TOKEN)
// ─────────────────────────────────────────────
const fetchGitHubStats = async (username) => {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const [userRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, timeout: 10000 }),
    axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner`, { headers, timeout: 10000 }),
  ]);

  const totalStars = reposRes.data.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  return {
    publicRepos: userRes.data.public_repos || 0,
    totalStars,
    followers: userRes.data.followers || 0,
  };
};

// ─────────────────────────────────────────────
// Main sync function — fetches a single student's stats
// Any platform failure is caught individually and skipped gracefully.
// ─────────────────────────────────────────────
const syncStudentStats = async (student) => {
  const handles = student.codingHandles || {};
  const platform = {
    leetcode: { solved: 0, ranking: 0, easyCount: 0, mediumCount: 0, hardCount: 0 },
    codeforces: { rating: 0, maxRating: 0, rank: 'unrated', maxRank: 'unrated' },
    github: { publicRepos: 0, totalStars: 0, followers: 0 },
  };

  // LeetCode
  if (handles.leetcode) {
    try {
      const lc = await fetchLeetCodeStats(handles.leetcode);
      if (lc) platform.leetcode = lc;
    } catch (err) {
      console.warn(`[Leaderboard] LeetCode fetch failed for ${handles.leetcode}:`, err.message);
    }
  }

  // Codeforces
  if (handles.codeforces) {
    try {
      const cf = await fetchCodeforcesStats(handles.codeforces);
      if (cf) platform.codeforces = cf;
    } catch (err) {
      console.warn(`[Leaderboard] Codeforces fetch failed for ${handles.codeforces}:`, err.message);
    }
  }

  // GitHub
  if (handles.github) {
    try {
      const gh = await fetchGitHubStats(handles.github);
      if (gh) platform.github = gh;
    } catch (err) {
      console.warn(`[Leaderboard] GitHub fetch failed for ${handles.github}:`, err.message);
    }
  }

  const totalScore = computeScore(platform);

  return { platform, totalScore };
};

module.exports = { syncStudentStats, computeScore };
