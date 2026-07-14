const Redis = require("ioredis");

let redisClient;

const connectRedis = () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on("connect", () => {
    console.log("Redis Connected successfully");
  });

  redisClient.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient: () => redisClient,
};
