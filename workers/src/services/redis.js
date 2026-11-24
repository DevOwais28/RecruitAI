import { Redis } from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;

let redisClient = null;

if (redisUrl) {
    try {
        redisClient = new Redis(redisUrl, {
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        });

        redisClient.on("error", (error) => {
            console.warn("[Redis Warning]", error.message);
        });

        redisClient.connect().catch(() => {});
    } catch (err) {
        console.warn("[Redis] Failed to initialize Redis:", err.message);
    }
} else {
    console.log("[Redis] REDIS_URL not provided, running without cache invalidation.");
}

export const redis = {
    async del(key) {
        if (!redisClient) return;
        try {
            await redisClient.del(key);
        } catch (error) {
            console.warn(`[Redis del failed for ${key}]:`, error.message);
        }
    },
};
