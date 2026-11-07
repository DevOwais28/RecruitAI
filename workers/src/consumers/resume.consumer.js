
import { getChannel } from "../services/rabbitmq.js";
import { processResume } from "../services/resume-processor.js";

const MAX_RETRIES = 3;

export const startResumeConsumer = async () => {
    const channel = getChannel();

    await channel.prefetch(1);

    await channel.consume(
        "resume_processing",
        async (message) => {
            if (!message) return;

            let candidateId;

            try {
                const data = JSON.parse(message.content.toString());
                candidateId = data.candidateId;

                if (!candidateId) {
                    throw new Error("Candidate ID is missing.");
                }

                console.log(`Processing candidate: ${candidateId}`);

                await processResume(candidateId);

                channel.ack(message);

                console.log(`Task completed: ${candidateId}`);
            } catch (error) {
                console.error("CV processing failed:", error.message);

                const retries = Number(
                    message.properties.headers?.["x-retry-count"] || 0
                );

                if (retries < MAX_RETRIES) {
                    channel.sendToQueue(
                        "resume_processing_retry",
                        message.content,
                        {
                            persistent: true,
                            headers: {
                                ...message.properties.headers,
                                "x-retry-count": retries + 1,
                            },
                        }
                    );

                    console.log(
                        `Retry ${retries + 1}/${MAX_RETRIES} scheduled.`
                    );
                } else {
                    channel.sendToQueue(
                        "resume_processing_dlq",
                        message.content,
                        {
                            persistent: true,
                            headers: {
                                ...message.properties.headers,
                                "x-retry-count": retries,
                                "x-failure-reason": error.message,
                            },
                        }
                    );

                    console.error(
                        `Candidate ${candidateId || "unknown"} moved to DLQ.`
                    );
                }
                await channel.waitForConfirms();
                channel.ack(message);
            }
        },
        { noAck: false }
    );

    console.log("Listening for CV processing jobs...");
};
