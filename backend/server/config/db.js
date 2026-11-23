
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon cloud connections
  },
});

export { pool };


pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log("PostgreSQL connected successfully!");
        client.release();
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
        throw error;
    }
};
