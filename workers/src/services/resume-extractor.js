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
        console.log(`[Resume Extractor] Reading PDF file, buffer length: ${buffer.length}`);
        const result = await pdf(buffer);

        const extracted = (result?.text || "").trim();
        console.log(`[Resume Extractor] PDF extraction completed. Pages: ${result?.numpages}, Extracted length: ${extracted.length}`);
        return extracted;
    }

    if (extension === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        const extracted = (result?.value || "").trim();
        console.log(`[Resume Extractor] DOCX extraction completed. Extracted length: ${extracted.length}`);
        return extracted;
    }

    throw new Error("Unsupported resume format.");
};
