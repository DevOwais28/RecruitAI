import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import os from "node:os";

export const uploadResumeToCloudinary = async (filePath) => {
    const extension = path.extname(filePath).toLowerCase();

    const resourceType = extension === ".pdf" ? "image" : "raw";

    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        type: "authenticated",
        folder: "recruitment/resumes",
    });

    return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
    };
};

export const deleteResumeFromCloudinary = async (
    publicId,
    resourceType,
) => {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: "authenticated",
    });
};

export const generateResumeDownloadUrl = (
    publicId,
    resourceType,
    filename,
) => {
    const extension = path.extname(filename).toLowerCase();
    const format = extension.slice(1);

    if (!["pdf", "docx"].includes(format)) {
        throw new Error("Unsupported resume format.");
    }

    return cloudinary.utils.private_download_url(
        publicId,
        format,
        {
            resource_type: resourceType,
            type: "authenticated",
            expires_at: Math.floor(Date.now() / 1000) + 60,
        },
    );
};

export const uploadResumeBufferToCloudinary = async (
    buffer,
    filename,
) => {
    const tempPath = path.join(
        os.tmpdir(),
        `${Date.now()}-${filename}`,
    );

    try {
        await writeFile(tempPath, buffer);
        return await uploadResumeToCloudinary(tempPath);
    } finally {
        await unlink(tempPath).catch(() => { });
    }
};