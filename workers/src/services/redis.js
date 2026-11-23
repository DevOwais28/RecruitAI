import { Redis } from "ioredis";

export const redis = new Redis(
    process.env.UPSTASH_REDIS_REST_URL||
    `redis://${process.env.REDIS_HOST || "localhost"}:6379`
);