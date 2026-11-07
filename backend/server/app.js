import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { envMode, port } from "./lib/env.js";
import { errorMiddleware } from "./middlewares/error.js";
import { rateLimiter } from "./middlewares/rate-limiter.js";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import gmailRoutes from "./routes/gmail.routes.js";
import { startGmailScheduler } from "./services/gmail-scheduler.service.js";

const app = express();

// Express reads NODE_ENV by itself to decide how much of an error to show and
// whether to cache views: give it the mode worked out in the env file.
app.set("env", envMode);
app.set("view cache", envMode === "production");

app.use(morgan(envMode === "development" ? "dev" : "combined"));
app.use(helmet());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        .map((o) => o.trim());
      if (
        allowed.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      callback(new Error("CORS policy violation"));
    },
    credentials: true,
  }),
);
app.use(rateLimiter());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// your routes here
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/gmail", gmailRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorMiddleware);

let server;

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    startGmailScheduler();

    server = app.listen(port, (error) => {
      if (error) {
        console.error("Server startup error:", error);
        process.exit(1);
      }

      console.log(
        `Server is working on port ${port} in ${envMode} mode`,
      );
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    if (!server) {
      process.exit(0);
    }

    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown.");
      process.exit(1);
    }, 10_000).unref();
  });
}
