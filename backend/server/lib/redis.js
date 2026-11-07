import { Redis } from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || 6379}`,
  {
    // Fail fast instead of queueing commands while Redis is unreachable.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  },
);

// ioredis keeps reconnecting in the background, so only report a change of state.
let connected = true;

redis.on("ready", () => {
  connected = true;
  console.log("Redis connected");
});

redis.on("error", (error) => {
  if (connected) {
    // A refused connection arrives as an AggregateError with an empty message.
    const reason =
      error instanceof AggregateError
        ? error.errors[0]?.message
        : error.message;
    console.error(
      `Redis unavailable (${reason}). Rate limits are counted in memory until it is back.`,
    );
  }
  connected = false;
});
