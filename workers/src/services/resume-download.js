
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import cloudinary from "./cloudinary.js";

export const downloadResume = async (
    publicId,
    resourceType,
    originalFilename,
) => {
    const extension = path.extname(originalFilename).toLowerCase();
    const format = extension.slice(1);

    if (!["pdf", "docx"].includes(format)) {
        throw new Error("Unsupported resume format.");
    }

    const tempPath = path.join(
        os.tmpdir(),
        `resume-${randomUUID()}${extension}`,
    );

    try {
        const url = cloudinary.utils.private_download_url(
            publicId,
            format,
            {
                resource_type: resourceType,
                type: "authenticated",
                expires_at: Math.floor(Date.now() / 1000) + 60,
            },
        );

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to download resume from Cloudinary.");
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        console.log(`[Cloudinary Download] Downloaded ${originalFilename}: ${buffer.length} bytes from URL: ${url.slice(0, 80)}...`);

        // Check if returned content is HTML/error from Cloudinary instead of a PDF/DOCX binary
        if (buffer.length < 500) {
            const preview = buffer.toString("utf8");
            if (preview.includes("<html") || preview.includes("Error") || preview.includes("Unauthorized")) {
                console.error("[Cloudinary Download Error Response]:", preview);
                throw new Error(`Cloudinary returned non-binary content: ${preview.slice(0, 100)}`);
            }
        }

        await fs.writeFile(tempPath, buffer);

        return tempPath;
    } catch (error) {
        await fs.unlink(tempPath).catch(() => { });
        throw error;
    }
};
