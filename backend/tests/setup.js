process.env.MONGO_URI = "mongodb://localhost:27017/campusone_test";
process.env.REDIS_URL = "redis://localhost:6379/1";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecretkey12345";
process.env.JWT_REFRESH_SECRET = "testrefreshsecretkey12345";

const mongoose = require("mongoose");

// Register all models to ensure collections are cleared in beforeEach
require("../src/models/User");
require("../src/models/Student");
require("../src/models/Faculty");
require("../src/models/Subject");
require("../src/models/Attendance");
require("../src/models/Timetable");
require("../src/models/BusRoute");
require("../src/models/BusLocation");
require("../src/models/LeaderboardEntry");
require("../src/models/ChatHistory");

const { connectRedis } = require("../src/config/redis");
const server = require("../src/index");

let redisClient;

beforeAll(async () => {
  // Connect MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  // Connect Redis
  redisClient = connectRedis();
});

afterAll(async () => {
  // Close HTTP Server
  await new Promise((resolve) => server.close(resolve));
  // Close MongoDB Connection
  await mongoose.connection.close();
  // Close Redis Connection
  if (redisClient) {
    await redisClient.quit();
  }
});

beforeEach(async () => {
  // Clear MongoDB Collections
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  // Clear Redis Cache
  if (redisClient) {
    await redisClient.flushdb();
  }
});
