
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

        await fs.writeFile(tempPath, buffer);

        return tempPath;
    } catch (error) {
        await fs.unlink(tempPath).catch(() => { });
        throw error;
    }
};
