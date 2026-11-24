import amqp from "amqplib";

let connection;
let channel;

export const connectRabbitMQ = async () => {
    connection = await amqp.connect(process.env.rabbitmq_URL);

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