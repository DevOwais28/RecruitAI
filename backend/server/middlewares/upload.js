import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import crypto from "node:crypto";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const uploadDir = path.join(currentDir, "../uploads/resumes");

// Create the upload directory if it doesn't exist.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${crypto.randomUUID()}${extension}`;

        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".pdf", ".docx"];
    const extension = path.extname(file.originalname).toLowerCase();

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