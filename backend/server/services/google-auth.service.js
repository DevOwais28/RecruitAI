import { google } from "googleapis";
import { pool } from "../config/db.js";

export const createOAuth2Client = () =>
    new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

export const getValidGmailClient = async (recruiterId) => {
    const result = await pool.query(
        `SELECT access_token, refresh_token, token_expiry
        FROM google_connections
        WHERE recruiter_id = $1`,
        [recruiterId]
    );

    if (result.rows.length === 0) {
        throw new Error("Gmail account is not connected.");
    }

    const { access_token, refresh_token, token_expiry } = result.rows[0];
    const client = createOAuth2Client();

    if (!token_expiry || new Date(token_expiry).getTime() <= Date.now() + 60000) {
        client.setCredentials({
            access_token,
            refresh_token,
        });

        const { credentials } = await client.refreshAccessToken();

        await pool.query(
            `UPDATE google_connections
         SET access_token = $1,
             token_expiry = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE recruiter_id = $3`,
            [
                credentials.access_token,
                credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : null,
                recruiterId,
            ]
        );

        client.setCredentials(credentials);
    } else {
        client.setCredentials({
            access_token,
            refresh_token,
        });
    }

    return client;
};