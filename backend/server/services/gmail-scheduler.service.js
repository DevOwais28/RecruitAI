import cron from "node-cron";
import { pool } from "../config/db.js";
import { scanGmailForCVs } from "./gmail.service.js";

let isRunning = false;

export const startGmailScheduler = () => {
    cron.schedule("*/5 * * * *", async () => {
        if (isRunning) {
            console.log("Gmail scheduler: Previous scan still running.");
            return;
        }

        isRunning = true;

        try {
            const result = await pool.query(
                "SELECT recruiter_id FROM google_connections"
            );

            console.log(
                `Gmail scheduler: Scanning ${result.rows.length} connected accounts.`
            );

            for (const connection of result.rows) {
                try {
                    const cvs = await scanGmailForCVs(
                        connection.recruiter_id
                    );

                    console.log(
                        `Gmail scan completed for recruiter ${connection.recruiter_id}: ${cvs.length} matching emails.`
                    );
                } catch (error) {
                    console.error(
                        `Gmail scan failed for recruiter ${connection.recruiter_id}:`,
                        error.message
                    );
                }
            }
        } finally {
            isRunning = false;
        }
    });

    console.log("Gmail scheduler started: runs every 5 minutes.");
};