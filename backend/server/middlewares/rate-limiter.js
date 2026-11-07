import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { redis } from "../lib/redis.js";

// Allows `points` requests per `duration` seconds for each IP address, then
// blocks that address for `blockDuration` seconds.
export const rateLimiter = ({
  points = 100,
  duration = 60,
  blockDuration = 60,
  keyPrefix = "rateLimiter",
} = {}) => {
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    points,
    duration,
    blockDuration,
    keyPrefix,
    // Per-process fallback, so requests are still served while Redis is down.
    insuranceLimiter: new RateLimiterMemory({
      points,
      duration,
      blockDuration,
      keyPrefix,
    }),
  });

  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip ?? "unknown");
      next();
    } catch (error) {
      // A rejection that is not an Error means the limit was reached.
      if (error instanceof RateLimiterRes) {
        res.set("Retry-After", String(Math.ceil(error.msBeforeNext / 1000)));
        res.status(429).json({ success: false, message: "Too Many Requests" });
        return;
      }

      throw error;
    }
  };
};
