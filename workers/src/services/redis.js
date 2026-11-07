import { Redis } from "ioredis";

export const redis = new Redis(
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "localhost"}:6379`
);