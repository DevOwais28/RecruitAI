import multer from "multer";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import crypto from "node:crypto";

// Use OS temp directory in production (writable by all users including non-root node user in Docker)
const uploadDir = path.join(os.tmpdir(), "recruitai-uploads");

try {
    fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
    console.warn("Could not create custom upload dir, falling back to os.tmpdir():", err.message);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fs.existsSync(uploadDir) ? uploadDir : os.tmpdir());
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${crypto.randomUUID()}${extension}`;

        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".pdf", ".docx"];
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        return cb(new Error("Only PDF and DOCX files are allowed."));
    }

    const allowedMimeTypes = [
        "application/pdf",
        "application/x-pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
        "application/x-zip-compressed",
    ];

    if (!file.mimetype || allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error("Only PDF and DOCX files are allowed."));
};

export const uploadResume = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
        files: 1,
    },
});
