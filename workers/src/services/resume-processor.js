
import fs from "node:fs/promises";
import { pool } from "./database.js";
import { downloadResume } from "./resume-download.js";
import { extractResumeText } from "./resume-extractor.js";
import { analyzeResume, validateResume } from "./ollama.js";
import { evaluateCandidate } from "./candidate-evaluator.js";
import { redis } from "./redis.js";

export const processResume = async (candidateId) => {
    let tempPath;

    try {
        // 1. Find candidate and Cloudinary information
        const result = await pool.query(
            `SELECT id, recruiter_id, job_id, resume_filename,
       resume_public_id, resume_resource_type
             FROM candidates
             WHERE id = $1`,
            [candidateId],
        );

        if (result.rows.length === 0) {
            throw new Error("Candidate not found.");
        }

        const candidate = result.rows[0];

        // 2. Mark candidate as processing
        await pool.query(
            `UPDATE candidates
             SET processing_status = 'processing',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [candidateId],
        );

        // 3. Download CV from Cloudinary
        tempPath = await downloadResume(
            candidate.resume_public_id,
            candidate.resume_resource_type,
            candidate.resume_filename,
        );

        // 4. Extract CV text
        const resumeText = await extractResumeText(
            tempPath,
            candidate.resume_filename,
        );

        if (!resumeText) throw new Error("No readable text found in resume.");

        // Validate document before analyzing candidate information
        const validation = await validateResume(resumeText);

        if (!validation.isResume) {
            await pool.query(
                `UPDATE candidates
         SET processing_status = 'invalid',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
                [candidateId]
            );

            console.log("Invalid document rejected:", validation.reason);
            return;
        }

        const candidateDetails = await analyzeResume(resumeText);
        // 6. Save AI-extracted information in PostgreSQL
        await pool.query(
            `UPDATE candidates
             SET full_name = $1,
                 email = $2,
                 phone = $3,
                 skills = $4,
                 education = $5,
                 experience_years = $6,
                 resume_text = $7,
                 processing_status = 'completed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [
                candidateDetails.fullName,
                candidateDetails.email,
                candidateDetails.phone,
                candidateDetails.skills,
                candidateDetails.education.join("\n"),
                candidateDetails.experienceYears,
                resumeText,
                candidateId,
            ],
        );
        // Automatically evaluate the candidate after CV extraction
        const evaluation = await evaluateCandidate(candidateId);
        console.log("Candidate evaluation completed:", evaluation);

        console.log("AI candidate analysis:", candidateDetails);
        console.log(`Resume processed successfully: ${candidateId}`);

        try {
            await redis.del(
                `ranked_candidates:${candidate.recruiter_id}:${candidate.job_id}`
            );
        } catch (error) {
            console.error("Redis cache invalidation failed:", error.message);
        }

        return resumeText;

    } catch (error) {
        await pool.query(
            `UPDATE candidates
             SET processing_status = 'failed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [candidateId],
        ).catch((dbError) => {
            console.error("Failed to update candidate status:", dbError.message);
        });

        console.error(`Resume processing failed: ${candidateId}`, error.message);
        throw error;

    } finally {
        if (tempPath) {
            await fs.unlink(tempPath).catch(() => { });
        }
    }
};
