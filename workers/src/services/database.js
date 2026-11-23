
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon cloud connections
  },
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

export const connectDB = async () => {
    const client = await pool.connect();

    try {
        console.log("Worker connected to PostgreSQL!");
    } finally {
        client.release();
    }
};
