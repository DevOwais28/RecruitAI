
import amqp from "amqplib";

let connection;
let channel;

export const connectRabbitMQ = async () => {
    connection = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.RABBITMQ_HOST || "localhost",
        port: Number(process.env.RABBITMQ_PORT) || 5672,
        username: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASSWORD,
    });

    channel = await connection.createConfirmChannel();
    // Main CV processing queue
    await channel.assertQueue("resume_processing", {
        durable: true,
    });

    // Retry queue: sends messages back after 10 seconds
    await channel.assertQueue("resume_processing_retry", {
        durable: true,
        arguments: {
            "x-message-ttl": 10000,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": "resume_processing",
        },
    });

    // Dead Letter Queue: stores messages that exhaust retries
    await channel.assertQueue("resume_processing_dlq", {
        durable: true,
    });

    console.log("Worker connected to RabbitMQ!");
    console.log("Main, retry and DLQ queues are ready.");

    return channel;
};

export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not connected.");
    }

    return channel;
};
