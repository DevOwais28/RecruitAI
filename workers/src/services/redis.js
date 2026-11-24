// Upstash Redis HTTP REST client

const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = {
    async del(key) {
        if (!restUrl || !restToken) {
            return;
        }

        try {
            const endpoint = `${restUrl.replace(/\/$/, "")}/del/${encodeURIComponent(key)}`;
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${restToken}`,
                },
            });

            if (!response.ok) {
                console.warn(`[Upstash Redis] DEL failed with status: ${response.status}`);
            }
        } catch (err) {
            console.warn("[Upstash Redis] HTTP request failed:", err.message);
        }
    },
};
