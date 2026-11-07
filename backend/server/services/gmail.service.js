import { google } from "googleapis";
import { getValidGmailClient } from "./google-auth.service.js";
import { pool } from "../config/db.js";

export const getGmailMessages = async (recruiterId) => {
    const auth = await getValidGmailClient(recruiterId);

    const gmail = google.gmail({
        version: "v1",
        auth,
    });

    const response = await gmail.users.messages.list({
        userId: "me",
        q: "in:inbox has:attachment -from:me",
        maxResults: 50,
    });

    return response.data.messages || [];
};

export const getGmailMessageDetails = async (recruiterId, messageId) => {
    const auth = await getValidGmailClient(recruiterId);

    const gmail = google.gmail({
        version: "v1",
        auth,
    });

    const response = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
    });

    return response.data;
};

export const getEmailHeaders = (message) => {
    const headers = message.payload?.headers || [];

    const getHeader = (name) =>
        headers.find(
            (header) => header.name.toLowerCase() === name.toLowerCase()
        )?.value || "";

    return {
        from: getHeader("From"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
    };
};

export const getCVAttachments = (message) => {
    const allowedExtensions = [".pdf", ".docx"];
    const attachments = [];

    const extractAttachments = (part) => {
        if (!part) return;

        const filename = part.filename || "";

        if (
            filename &&
            part.body?.attachmentId &&
            allowedExtensions.some((ext) =>
                filename.toLowerCase().endsWith(ext)
            )
        ) {
            attachments.push({
                filename,
                mimeType: part.mimeType,
                attachmentId: part.body.attachmentId,
                size: part.body.size || 0,
            });
        }

        (part.parts || []).forEach(extractAttachments);
    };

    extractAttachments(message.payload);

    return attachments;
};

export const downloadGmailAttachment = async (
    recruiterId,
    messageId,
    attachmentId
) => {
    const auth = await getValidGmailClient(recruiterId);

    const gmail = google.gmail({
        version: "v1",
        auth,
    });

    const response = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
    });

    const attachmentData = response.data.data
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return Buffer.from(attachmentData, "base64");
};

export const scanGmailForCVs = async (recruiterId) => {
    const auth = await getValidGmailClient(recruiterId);

    const gmail = google.gmail({
        version: "v1",
        auth,
    });

    const connectionResult = await pool.query(
        `SELECT google_email, last_gmail_scan_at
         FROM google_connections
         WHERE recruiter_id = $1`,
        [recruiterId]
    );

    const recruiterEmail = (connectionResult.rows[0]?.google_email || "").toLowerCase();
    const lastScanAt = connectionResult.rows[0]?.last_gmail_scan_at;
    const scanStartedAt = new Date();

    // Clean up any previously captured sent items by the recruiter
    if (recruiterEmail) {
        await pool.query(
            `DELETE FROM gmail_discovered_attachments
             WHERE recruiter_id = $1
               AND status = 'pending'
               AND LOWER(sender) LIKE $2`,
            [recruiterId, `%${recruiterEmail}%`]
        ).catch(() => { });
    }

    const baseFilter = "in:inbox has:attachment";
    const query = lastScanAt
        ? `${baseFilter} after:${Math.floor(
            (new Date(lastScanAt).getTime() - 2 * 60 * 1000) / 1000
        )}`
        : baseFilter;

    const messages = [];
    let pageToken;

    do {
        const response = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 100,
            pageToken,
        });

        messages.push(...(response.data.messages || []));
        pageToken = response.data.nextPageToken;
    } while (pageToken);

    const results = [];

    for (const message of messages) {
        const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
        });

        // 1. Label check: Must be in INBOX and not in SENT
        const labels = details.data.labelIds || [];
        if (!labels.includes("INBOX") || labels.includes("SENT")) {
            continue;
        }

        const headers = getEmailHeaders(details.data);
        const senderEmail = (headers.from || "").toLowerCase();

        // 2. Sender check: Skip if sent by the recruiter
        if (recruiterEmail && senderEmail.includes(recruiterEmail)) {
            continue;
        }

        const attachments = getCVAttachments(details.data);
        const subject = (headers.subject || '').toLowerCase();
        const snippet = (details.data.snippet || '').toLowerCase();
        const sender = senderEmail;

        // 3. Exclude unrelated non-recruitment emails (bank statements, bills, receipts, OTPs, admit cards, newsletters)
        const ignoredKeywords = [
            'statement', 'e-statement', 'bank', 'invoice', 'receipt',
            'bill', 'admit card', 'distribution plan', 'newsletter',
            'no-reply', 'noreply', 'notification', 'security alert', 'otp'
        ];

        const isIgnored = ignoredKeywords.some(
            keyword => subject.includes(keyword) || sender.includes(keyword)
        );

        if (isIgnored) {
            continue;
        }

        // 4. Identify legitimate CV and job application emails (Subject or Body snippet or Filename)
        const recruitmentKeywords = [
            'resume', 'résumé', 'cv', 'curriculum vitae', 'curriculum',
            'job application', 'application for', 'applying for', 'candidate',
            'applicant', 'position', 'application', 'developer', 'engineer',
            'fullstack', 'frontend', 'backend', 'intern', 'internship', 'hiring',
            'software', 'portfolio', 'mern', 'role', 'job', 'bio-data', 'biodata', 'profile'
        ];

        const matchesRecruitment = recruitmentKeywords.some((keyword) => {
            const regex = new RegExp(`(^|\\W)${keyword}(\\W|$)`, 'i');
            return regex.test(subject) || regex.test(snippet);
        });

        const filteredAttachments = attachments.filter((attachment) => {
            const filename = attachment.filename.toLowerCase();
            const filenameMatches = [
                'resume', 'résumé', 'cv', 'curriculum', 'profile', 'biodata', 'bio-data'
            ].some((keyword) => {
                const regex = new RegExp(`(^|[._ -])${keyword}([._ -]|$)`, 'i');
                return regex.test(filename) || filename.includes(keyword);
            });

            // If the email subject/body indicates a job application, or the file is named CV/Resume
            return filenameMatches || matchesRecruitment || attachments.length === 1;
        });
        if (filteredAttachments.length > 0) {
            const emailDate = headers.date
                ? new Date(headers.date)
                : null;

            const validEmailDate =
                emailDate && !Number.isNaN(emailDate.getTime())
                    ? emailDate
                    : null;

            for (const attachment of filteredAttachments) {
                await pool.query(
                    `INSERT INTO gmail_discovered_attachments (
                recruiter_id,
                message_id,
                attachment_id,
                filename,
                mime_type,
                file_size,
                sender,
                subject,
                email_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (recruiter_id, message_id, attachment_id)
            DO NOTHING`,
                    [
                        recruiterId,
                        message.id,
                        attachment.attachmentId,
                        attachment.filename,
                        attachment.mimeType,
                        attachment.size,
                        headers.from,
                        headers.subject,
                        validEmailDate,
                    ]
                );
            }

            results.push({
                messageId: message.id,
                from: headers.from,
                subject: headers.subject,
                date: headers.date,
                attachments: filteredAttachments,
            });
        }
    }

    await pool.query(
        `UPDATE google_connections
     SET last_gmail_scan_at = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE recruiter_id = $2`,
        [scanStartedAt, recruiterId]
    );

    return results;
};