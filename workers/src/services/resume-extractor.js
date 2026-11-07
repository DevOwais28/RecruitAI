import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractResumeText = async (filePath, originalFilename) => {
    const extension = path.extname(originalFilename).toLowerCase();

    if (extension === ".pdf") {
        const buffer = await fs.readFile(filePath);
        const result = await pdf(buffer);

        return result.text.trim();
    }

    if (extension === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });

        return result.value.trim();
    }

    throw new Error("Unsupported resume format.");
};
