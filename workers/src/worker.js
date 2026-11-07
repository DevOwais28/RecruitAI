
import "dotenv/config";

import { connectDB } from "./services/database.js";
import { connectRabbitMQ } from "./services/rabbitmq.js";
import { startResumeConsumer } from "./consumers/resume.consumer.js";

const startWorker = async () => {
    try {
        console.log("Starting CV Processing Worker...");

        // Connect to PostgreSQL
        await connectDB();

        // Connect to RabbitMQ
        await connectRabbitMQ();

        // Start listening for CV processing jobs
        await startResumeConsumer();

        console.log("CV Processing Worker is ready!");
    } catch (error) {
        console.error("Worker startup failed:", error);
        process.exit(1);
    }
};

startWorker();
