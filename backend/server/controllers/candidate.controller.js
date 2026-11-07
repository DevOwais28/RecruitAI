import { pool } from "../config/db.js";
import { unlink } from "node:fs/promises";
import {
    uploadResumeToCloudinary,
    deleteResumeFromCloudinary,
    generateResumeDownloadUrl,
} from "../services/cloudinary.service.js";
import { publishResumeJob } from "../config/rabbitmq.js";
import { redis } from "../lib/redis.js";

export const uploadCandidateResume = async (req, res, next) => {
    let cloudFile;

    try {
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF or DOCX resume.",
            });
        }

        // Verify job ownership.
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

        // Upload the original CV to Cloudinary.
        cloudFile = await uploadResumeToCloudinary(req.file.path);
        let result;

        try {
            result = await pool.query(
                `INSERT INTO candidates (
      recruiter_id,
      job_id,
      resume_filename,
      resume_url,
      resume_public_id,
      resume_resource_type
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
                [
                    req.user.id,
                    jobId,
                    req.file.originalname,
                    cloudFile.secureUrl,
                    cloudFile.publicId,
                    cloudFile.resourceType,
                ],
            );
        } catch (error) {
            await deleteResumeFromCloudinary(
                cloudFile.publicId,
                cloudFile.resourceType,
            );
            throw error;
        }

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
            message: "Resume uploaded successfully.",
            processingQueued,
            candidate: result.rows[0],
        });
    } catch (error) {
        next(error);
    } finally {
        // Remove temporary local file.
        if (req.file?.path) {
            await unlink(req.file.path).catch((error) => {
                console.error("Temporary CV cleanup failed:", error.message);
            });
        }
    }
};

export const getRankedCandidates = async (req, res, next) => {
    try {
        const { jobId } = req.params;

        // Verify that this job belongs to the logged-in recruiter.
        const jobResult = await pool.query(
            `SELECT id, title
             FROM jobs
             WHERE id = $1 AND recruiter_id = $2`,
            [jobId, req.user.id],
        );

        if (jobResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }
        const cacheKey = `ranked_candidates:${req.user.id}:${jobId}`;

        try {
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (error) {
            console.error("Redis cache read failed:", error.message);
        }
        // Fetch candidates and their evaluation results.
        const result = await pool.query(
            `SELECT
                c.id,
                c.full_name,
                c.email,
                c.phone,
                c.resume_filename,
                c.processing_status,
                c.skills,
                e.overall_score,
                e.mandatory_match_score,
                e.preferred_match_score,
                e.matched_mandatory_skills,
                e.missing_mandatory_skills,
                e.matched_preferred_skills,
                e.experience_match,
                e.education_match,
                e.explanation,
                e.recommendation
             FROM candidates c
             LEFT JOIN candidate_evaluations e
                ON c.id = e.candidate_id
             WHERE c.job_id = $1
               AND c.recruiter_id = $2
             ORDER BY
                e.overall_score DESC NULLS LAST,
                c.created_at DESC`,
            [jobId, req.user.id],
        );

        const responseData = {
            success: true,
            job: jobResult.rows[0],
            totalCandidates: result.rows.length,
            candidates: result.rows,
        };

        try {
            await redis.set(cacheKey, JSON.stringify(responseData), "EX", 60);
        } catch (error) {
            console.error("Redis cache write failed:", error.message);
        }

        return res.status(200).json(responseData);
    } catch (error) {
        next(error);
    }
};

export const getCandidateResumeDownload = async (req, res, next) => {
    try {
        const { candidateId } = req.params;

        // Verify candidate ownership and get Cloudinary details.
        const result = await pool.query(
            `SELECT
                resume_filename,
                resume_public_id,
                resume_resource_type
             FROM candidates
             WHERE id = $1 AND recruiter_id = $2`,
            [candidateId, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found.",
            });
        }

        const candidate = result.rows[0];

        if (!candidate.resume_public_id || !candidate.resume_resource_type) {
            return res.status(404).json({
                success: false,
                message: "Resume file not found.",
            });
        }

        const downloadUrl = generateResumeDownloadUrl(
            candidate.resume_public_id,
            candidate.resume_resource_type,
            candidate.resume_filename,
        );

        return res.status(200).json({
            success: true,
            downloadUrl,
            expiresIn: 60,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllCandidates = async (req, res, next) => {
    try {
        const { jobId } = req.query;
        if (jobId) {
            const jobResult = await pool.query(
                `SELECT id
         FROM jobs
         WHERE id = $1 AND recruiter_id = $2`,
                [jobId, req.user.id],
            );

            if (jobResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found.",
                });
            }
        }
        const values = [req.user.id];
        let jobFilter = "";

        if (jobId) {
            values.push(jobId);
            jobFilter = "AND c.job_id = $2";
        }

        const result = await pool.query(
            `SELECT
                c.id,
                c.job_id,
                c.full_name,
                c.email,
                c.phone,
                c.resume_filename,
                c.processing_status,
                c.skills,
                c.education,
                c.experience_years,
                c.created_at,
                j.title AS job_title,
                e.overall_score,
                e.matched_mandatory_skills,
                e.missing_mandatory_skills,
                e.matched_preferred_skills,
                e.explanation,
                e.recommendation
             FROM candidates c
             INNER JOIN jobs j
                ON c.job_id = j.id
             LEFT JOIN candidate_evaluations e
                ON c.id = e.candidate_id
             WHERE c.recruiter_id = $1
               ${jobFilter}
             ORDER BY
                e.overall_score DESC NULLS LAST,
                c.created_at DESC`,
            values,
        );

        return res.status(200).json({
            success: true,
            totalCandidates: result.rows.length,
            candidates: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCandidate = async (req, res, next) => {
    try {
        const { candidateId } = req.params;

        // Verify ownership and get resume details.
        const result = await pool.query(
            `SELECT
                id,
                job_id,
                resume_public_id,
                resume_resource_type,
                source,
                gmail_message_id,
                gmail_attachment_id
             FROM candidates
             WHERE id = $1 AND recruiter_id = $2`,
            [candidateId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found.",
            });
        }

        const candidate = result.rows[0];

        // Delete candidate (related evaluations should cascade).
        await pool.query(
            `DELETE FROM candidates
             WHERE id = $1 AND recruiter_id = $2`,
            [candidateId, req.user.id]
        );

        // Reset Gmail attachment so it can be imported again.
        if (candidate.source === "gmail") {
            await pool.query(
                `UPDATE gmail_discovered_attachments
                 SET status = 'pending'
                 WHERE recruiter_id = $1
                   AND message_id = $2
                   AND attachment_id = $3`,
                [
                    req.user.id,
                    candidate.gmail_message_id,
                    candidate.gmail_attachment_id,
                ]
            );
        }

        // Delete original resume from Cloudinary.
        if (candidate.resume_public_id && candidate.resume_resource_type) {
            try {
                await deleteResumeFromCloudinary(
                    candidate.resume_public_id,
                    candidate.resume_resource_type
                );
            } catch (error) {
                console.error("Cloudinary deletion failed:", error.message);
            }
        }

        // Invalidate ranked candidates cache.
        try {
            await redis.del(
                `ranked_candidates:${req.user.id}:${candidate.job_id}`
            );
        } catch (error) {
            console.error("Redis cache invalidation failed:", error.message);
        }

        return res.status(200).json({
            success: true,
            message: "Candidate deleted successfully.",
        });

    } catch (error) {
        next(error);
    }
};