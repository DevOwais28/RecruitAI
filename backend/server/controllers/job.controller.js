import { pool } from "../config/db.js";

export const createJob = async (req, res, next) => {
    try {
        const {
            title,
            description,
            mandatorySkills = [],
            preferredSkills = [],
            minExperience = 0,
            educationRequired = null,
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job title is required.",
            });
        }

        if (
            !Array.isArray(mandatorySkills) ||
            !Array.isArray(preferredSkills)
        ) {
            return res.status(400).json({
                success: false,
                message: "Skills must be provided as arrays.",
            });
        }

        if (
            !Number.isFinite(Number(minExperience)) ||
            Number(minExperience) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum experience must be a valid non-negative number.",
            });
        }

        const result = await pool.query(
            `INSERT INTO jobs (
        recruiter_id,
        title,
        description,
        mandatory_skills,
        preferred_skills,
        min_experience,
        education_required
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
            [
                req.user.id,
                title.trim(),
                description || null,
                mandatorySkills,
                preferredSkills,
                Number(minExperience),
                educationRequired,
            ],
        );

        return res.status(201).json({
            success: true,
            message: "Job created successfully.",
            job: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

export const getMyJobs = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT *
       FROM jobs
       WHERE recruiter_id = $1
       ORDER BY created_at DESC`,
            [req.user.id],
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            jobs: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

export const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
       FROM jobs
       WHERE id = $1 AND recruiter_id = $2`,
            [id, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        return res.status(200).json({
            success: true,
            job: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

export const updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            mandatorySkills,
            preferredSkills,
            minExperience,
            educationRequired,
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job title is required.",
            });
        }

        if (
            !Array.isArray(mandatorySkills) ||
            !Array.isArray(preferredSkills)
        ) {
            return res.status(400).json({
                success: false,
                message: "Skills must be provided as arrays.",
            });
        }

        if (
            !Number.isFinite(Number(minExperience)) ||
            Number(minExperience) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid minimum experience.",
            });
        }

        const result = await pool.query(
            `UPDATE jobs
       SET title = $1,
           description = $2,
           mandatory_skills = $3,
           preferred_skills = $4,
           min_experience = $5,
           education_required = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND recruiter_id = $8
       RETURNING *`,
            [
                title.trim(),
                description || null,
                mandatorySkills,
                preferredSkills,
                Number(minExperience),
                educationRequired || null,
                id,
                req.user.id,
            ],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Job updated successfully.",
            job: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM jobs
       WHERE id = $1 AND recruiter_id = $2
       RETURNING id, title`,
            [id, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully.",
            job: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};