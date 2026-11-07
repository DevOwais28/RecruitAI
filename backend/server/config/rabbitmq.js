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

    // Create a publisher confirmation channel.
    channel = await connection.createConfirmChannel();

    await channel.assertQueue("resume_processing", {
        durable: true,
    });

    console.log("Backend connected to RabbitMQ!");
};

export const publishResumeJob = async (candidateId) => {
    if (!channel) {
        throw new Error("RabbitMQ is not connected.");
    }

    channel.sendToQueue(
        "resume_processing",
        Buffer.from(JSON.stringify({ candidateId })),
        {
            persistent: true,
            contentType: "application/json",
        },
    );

    // Wait until RabbitMQ confirms receipt.
    await channel.waitForConfirms();

    console.log(`Resume job confirmed by RabbitMQ: ${candidateId}`);
};