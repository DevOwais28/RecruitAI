import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid name and email. Password must be at least 8 characters.",
            });
        }

        // 2. Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [cleanEmail],
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        // 3. Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Save user in PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
            [cleanName, cleanEmail, passwordHash],
        );

        const user = result.rows[0];

        // 5. Generate JWT
        const token = jwt.sign(
            { role: user.role },
            process.env.JWT_SECRET,
            {
                subject: user.id,
                expiresIn: "1d",
            },
        );

        // 6. Send response
        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token,
            user,
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 2. Find user in PostgreSQL
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [cleanEmail],
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const user = result.rows[0];

        // 3. Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash,
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { role: user.role },
            process.env.JWT_SECRET,
            {
                subject: user.id,
                expiresIn: "1d",
            },
        );

        // 5. Return authenticated user
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
            [req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { name, currentPassword, newPassword } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required.",
            });
        }

        const cleanName = name.trim();

        // If user wants to change password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is required to set a new password.",
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 8 characters.",
                });
            }

            const userResult = await pool.query(
                "SELECT password_hash FROM users WHERE id = $1",
                [req.user.id],
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found." });
            }

            const isMatch = await bcrypt.compare(
                currentPassword,
                userResult.rows[0].password_hash,
            );

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Incorrect current password.",
                });
            }

            const newHash = await bcrypt.hash(newPassword, 12);

            const updated = await pool.query(
                `UPDATE users
                 SET name = $1, password_hash = $2
                 WHERE id = $3
                 RETURNING id, name, email, role, created_at`,
                [cleanName, newHash, req.user.id],
            );

            return res.status(200).json({
                success: true,
                message: "Profile and password updated successfully.",
                user: updated.rows[0],
            });
        }

        // Just updating name / profile
        const updated = await pool.query(
            `UPDATE users
             SET name = $1
             WHERE id = $2
             RETURNING id, name, email, role, created_at`,
            [cleanName, req.user.id],
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updated.rows[0],
        });
    } catch (error) {
        next(error);
    }
};