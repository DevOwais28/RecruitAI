import { google } from "googleapis";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { scanGmailForCVs } from "../services/gmail.service.js";
import {
    downloadGmailAttachment,
} from "../services/gmail.service.js";
import { createOAuth2Client } from "../services/google-auth.service.js";

import {
    uploadResumeBufferToCloudinary,
    deleteResumeFromCloudinary,
} from "../services/cloudinary.service.js";

import { publishResumeJob } from "../config/rabbitmq.js";
import { redis } from "../lib/redis.js";
import path from "node:path";

// Generate Google login URL
export const connectGmail = async (req, res) => {
    try {
        const oauth2Client = createOAuth2Client();
        const state = crypto.randomBytes(32).toString("hex");
        const stateHash = crypto
            .createHash("sha256")
            .update(state)
            .digest("hex");

        await pool.query(
            `INSERT INTO google_oauth_states (state_hash, recruiter_id, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [stateHash, req.user.id]
        );

        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: [
                "openid",
                "email",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            state,
        });

        res.json({ success: true, url });
    } catch (error) {
        console.error("Gmail OAuth URL error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate Google authorization URL.",
        });
    }
};

// Handle Google's OAuth callback
export const gmailCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error || !code || !state) {
            return res.status(400).json({
                success: false,
                message: "Google authorization was unsuccessful.",
            });
        }

        const stateHash = crypto
            .createHash("sha256")
            .update(state)
            .digest("hex");

        const stateResult = await pool.query(
            `DELETE FROM google_oauth_states
             WHERE state_hash = $1 AND expires_at > NOW()
             RETURNING recruiter_id`,
            [stateHash]
        );

        if (stateResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OAuth state.",
            });
        }

        const recruiterId = stateResult.rows[0].recruiter_id;
        const oauth2Client = createOAuth2Client();

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            version: "v2",
            auth: oauth2Client,
        });

        const { data } = await oauth2.userinfo.get();

        await pool.query(
            `INSERT INTO google_connections
                (recruiter_id, google_email, access_token, refresh_token,
                 token_expiry, scopes)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (recruiter_id)
             DO UPDATE SET
                google_email = EXCLUDED.google_email,
                access_token = EXCLUDED.access_token,
                refresh_token = COALESCE(
                    EXCLUDED.refresh_token,
                    google_connections.refresh_token
                ),
                token_expiry = EXCLUDED.token_expiry,
                scopes = EXCLUDED.scopes,
                updated_at = CURRENT_TIMESTAMP`,
            [
                recruiterId,
                data.email,
                tokens.access_token,
                tokens.refresh_token || null,
                tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null,
                tokens.scope ? tokens.scope.split(" ") : [],
            ]
        );

        return res.redirect(
            `${process.env.FRONTEND_URL}/gmail?connected=true`
        );

    } catch (error) {
        console.error("Gmail callback error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to connect Gmail.",
        });
    }
};

export const getGmailStatus = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT google_email, connected_at
             FROM google_connections
             WHERE recruiter_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                connected: false,
            });
        }

        res.json({
            success: true,
            connected: true,
            email: result.rows[0].google_email,
            connectedAt: result.rows[0].connected_at,
        });
    } catch (error) {
        console.error("Gmail status error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch Gmail connection status.",
        });
    }
};

export const disconnectGmail = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT access_token, refresh_token
             FROM google_connections
             WHERE recruiter_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Gmail account is connected.",
            });
        }

        const { access_token, refresh_token } = result.rows[0];

        let tokenRevoked = false;
        const oauth2Client = createOAuth2Client();

        try {
            await oauth2Client.revokeToken(
                refresh_token || access_token
            );
            tokenRevoked = true;
        } catch (error) {
            console.error("Google token revocation failed:", error.message);
        }

        await pool.query(
            `DELETE FROM google_connections
             WHERE recruiter_id = $1`,
            [req.user.id]
        );

        res.json({
            success: true,
            tokenRevoked,
            message: "Gmail disconnected successfully.",
        });

    } catch (error) {
        console.error("Gmail disconnect error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to disconnect Gmail.",
        });
    }
};

export const scanGmail = async (req, res) => {
    try {
        const cvs = await scanGmailForCVs(req.user.id);

        res.json({
            success: true,
            total: cvs.length,
            cvs,
        });
    } catch (error) {
        console.error("Gmail scan error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to scan Gmail.",
        });
    }
};

export const importGmailCV = async (req, res) => {
    let cloudFile;

    try {
        const { jobId, messageId, attachment } = req.body;

        if (!jobId || !messageId || !attachment?.filename || !attachment?.attachmentId) {
            return res.status(400).json({
                success: false,
                message: "Job ID and valid Gmail attachment details are required.",
            });
        }

        const jobResult = await pool.query(
            `SELECT id FROM jobs
             WHERE id = $1 AND recruiter_id = $2`,
            [jobId, req.user.id],
        );

        if (jobResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        const extension = path.extname(attachment.filename).toLowerCase();

        if (![".pdf", ".docx"].includes(extension)) {
            return res.status(400).json({
                success: false,
                message: "Only PDF and DOCX resumes are supported.",
            });
        }

        const existing = await pool.query(
            `SELECT id FROM candidates
             WHERE recruiter_id = $1
               AND gmail_message_id = $2
               AND gmail_attachment_id = $3
               AND source = 'gmail'`,
            [req.user.id, messageId, attachment.attachmentId],
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This Gmail attachment has already been imported.",
            });
        }

        const buffer = await downloadGmailAttachment(
            req.user.id,
            messageId,
            attachment.attachmentId,
        );

        cloudFile = await uploadResumeBufferToCloudinary(
            buffer,
            attachment.filename,
        );

        const result = await pool.query(
            `INSERT INTO candidates (
                recruiter_id, job_id, resume_filename,
                resume_url, resume_public_id, resume_resource_type,
                source, gmail_message_id, gmail_attachment_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'gmail', $7, $8)
            RETURNING *`,
            [
                req.user.id,
                jobId,
                attachment.filename,
                cloudFile.secureUrl,
                cloudFile.publicId,
                cloudFile.resourceType,
                messageId,
                attachment.attachmentId,
            ],
        );

        cloudFile = null;
        await pool.query(
            `UPDATE gmail_discovered_attachments
     SET status = 'imported'
     WHERE recruiter_id = $1
       AND message_id = $2
       AND attachment_id = $3`,
            [req.user.id, messageId, attachment.attachmentId]
        );
        let processingQueued = true;

        try {
            await publishResumeJob(result.rows[0].id);
        } catch (error) {
            processingQueued = false;
            console.error("RabbitMQ publishing failed:", error.message);
        }

        try {
            await redis.del(`ranked_candidates:${req.user.id}:${jobId}`);
        } catch (error) {
            console.error("Redis cache invalidation failed:", error.message);
        }

        return res.status(201).json({
            success: true,
            message: "Gmail CV imported successfully.",
            processingQueued,
            candidate: result.rows[0],
        });

    } catch (error) {
        if (cloudFile) {
            await deleteResumeFromCloudinary(
                cloudFile.publicId,
                cloudFile.resourceType,
            ).catch(() => { });
        }

        console.error("Gmail CV import error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to import Gmail CV.",
        });
    }
};
export const getDiscoveredGmailCVs = async (req, res, next) => {
    try {
        // Auto-purge any discovered items that were sent by the recruiter themselves
        const connResult = await pool.query(
            "SELECT google_email FROM google_connections WHERE recruiter_id = $1",
            [req.user.id]
        );
        const recruiterEmail = connResult.rows[0]?.google_email?.toLowerCase();

        if (recruiterEmail) {
            await pool.query(
                `DELETE FROM gmail_discovered_attachments
                 WHERE recruiter_id = $1
                   AND status != 'imported'
                   AND LOWER(sender) LIKE $2`,
                [req.user.id, `%${recruiterEmail}%`]
            ).catch(() => { });
        }

        // Auto-purge any bank statements, invoices, admit cards, or newsletters
        await pool.query(
            `DELETE FROM gmail_discovered_attachments
             WHERE recruiter_id = $1
               AND status != 'imported'
               AND (
                 LOWER(subject) LIKE '%statement%'
                 OR LOWER(subject) LIKE '%invoice%'
                 OR LOWER(subject) LIKE '%receipt%'
                 OR LOWER(subject) LIKE '%bill%'
                 OR LOWER(subject) LIKE '%admit card%'
                 OR LOWER(sender) LIKE '%bank%'
                 OR LOWER(sender) LIKE '%noreply%'
                 OR LOWER(sender) LIKE '%no-reply%'
               )`,
            [req.user.id]
        ).catch(() => { });

        const result = await pool.query(
            `SELECT
                id,
                message_id,
                attachment_id,
                filename,
                mime_type,
                file_size,
                sender,
                subject,
                email_date,
                status,
                created_at
             FROM gmail_discovered_attachments
             WHERE recruiter_id = $1
             ORDER BY email_date DESC NULLS LAST`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            cvs: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

export const clearDiscoveredGmailCVs = async (req, res, next) => {
    try {
        const result = await pool.query(
            `DELETE FROM gmail_discovered_attachments
             WHERE recruiter_id = $1 AND status != 'imported'`,
            [req.user.id]
        );

        // Reset last scan timestamp so the next scan is a fresh full inbox scan
        await pool.query(
            `UPDATE google_connections
             SET last_gmail_scan_at = NULL
             WHERE recruiter_id = $1`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: `Cleared ${result.rowCount} discovered attachments. Ready for fresh inbox scan.`,
            clearedCount: result.rowCount,
        });
    } catch (error) {
        next(error);
    }
};