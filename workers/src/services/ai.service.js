// AI service using Groq API as primary provider with multi-model fallback and local Ollama fallback.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Popular Groq models to try in sequence if one returns 404/model_not_found
const GROQ_MODELS = [
    process.env.GROQ_MODEL,
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "qwen/qwen3.8-27b",
].filter(Boolean);

const getOllamaUrl = () =>
    `${(process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "")}/api/generate`;

const cleanJsonResponse = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleaned.trim();
};

/**
 * Call Groq API with a specific model
 */
const requestGroqModel = async (modelName, prompt, systemPrompt, apiKey) => {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const error = new Error(`Groq API error (${response.status}): ${errText}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Empty response from Groq API.");
    }

    return cleanJsonResponse(content);
};

/**
 * Call Groq trying configured model first, then known available fallback models
 */
const callGroq = async (prompt, systemPrompt = "You are an AI assistant that outputs only valid JSON.") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    let lastError = null;

    // Deduplicate models
    const candidateModels = Array.from(new Set(GROQ_MODELS));

    for (const model of candidateModels) {
        try {
            console.log(`[AI] Attempting Groq with model: ${model}...`);
            const result = await requestGroqModel(model, prompt, systemPrompt, apiKey);
            return result;
        } catch (err) {
            lastError = err;
            console.warn(`[AI Warning] Groq model ${model} failed (${err.message}). Trying next candidate...`);
            // If it's authentication error (401), trying other models won't help
            if (err.status === 401) {
                throw err;
            }
        }
    }

    throw lastError || new Error("All Groq models failed.");
};

/**
 * Fallback: Call local Ollama instance
 */
const callOllama = async (prompt) => {
    const response = await fetch(getOllamaUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || "phi3:latest",
            format: "json",
            stream: false,
            options: {
                temperature: 0,
            },
            prompt,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama API error (${response.status}).`);
    }

    const data = await response.json();
    return cleanJsonResponse(data.response);
};

/**
 * Execute AI call with Groq primary and Ollama fallback
 */
const executeWithFallback = async (prompt, systemPrompt, taskName) => {
    // 1. Try Groq (Production standard)
    if (process.env.GROQ_API_KEY) {
        try {
            const raw = await callGroq(prompt, systemPrompt);
            return JSON.parse(raw);
        } catch (groqError) {
            console.warn(`[AI Warning] Groq completely failed for ${taskName}: ${groqError.message}. Falling back to Ollama...`);
        }
    } else {
        console.warn(`[AI Warning] GROQ_API_KEY missing. Falling back directly to Ollama for ${taskName}...`);
    }

    // 2. Fallback to Ollama
    try {
        console.log(`[AI Fallback] Running ${taskName} via Ollama...`);
        const raw = await callOllama(prompt);
        return JSON.parse(raw);
    } catch (ollamaError) {
        console.error(`[AI Error] Ollama fallback also failed for ${taskName}:`, ollamaError.message);
        throw new Error(`AI processing failed on both Groq and Ollama fallback for ${taskName}.`);
    }
};

export const validateResume = async (resumeText) => {
    const prompt = `
Determine whether this document is a CV or resume.

A CV/resume generally presents a person's professional or
academic profile, such as:
- Personal or contact information
- Education
- Skills
- Work experience
- Projects or professional achievements

Do not classify a certificate, academic notes, assignment,
textbook chapter, or unrelated document as a CV.

A CV does not need to contain every section listed above.

Return ONLY this JSON:
{
    "isResume": true,
    "reason": "Short explanation"
}

Rules:
- isResume must be a boolean.
- reason must be a short string.
- Do not invent information.

DOCUMENT:
${resumeText.slice(0, 12000)}
`;

    const result = await executeWithFallback(
        prompt,
        "You are an expert document classifier. Respond only in valid JSON format matching the schema requested.",
        "validateResume"
    );

    if (typeof result.isResume !== "boolean") {
        throw new Error("Invalid validation result returned by AI.");
    }

    return result;
};

export const analyzeResume = async (resumeText) => {
    const prompt = `
You are a precise resume information extraction system.

Extract information directly from the resume.
Accuracy is more important than completing every field.

Return ONLY one valid JSON object using this structure:
{
    "fullName": null,
    "email": null,
    "phone": null,
    "skills": [],
    "education": [],
    "experienceYears": null,
    "notableProjects": []
}

STRICT EXTRACTION RULES:

1. FULL NAME:
- The candidate's name is usually written at the top of the resume.
- Carefully inspect the first few lines.
- Preserve every character of the actual name.
- If the name is written without a space, add appropriate spacing.
- Example: "OWAISAHMED" becomes "Owais Ahmed".
- Never remove, replace, or invent characters.
- Do not use email addresses as names.

2. EMAIL AND PHONE:
- Extract the exact email address and phone number.
- Do not modify their digits or characters.

3. EDUCATION:
- Extract degree titles and institution names accurately.
- Preserve the original degree meaning and wording.
- Example: "BS – Artificial Intelligence" must remain
  "BS – Artificial Intelligence".
- Do not convert degree names into abbreviations.
- Do not invent completed degrees.

4. SKILLS:
- Return individual skill names.
- Never group skills into categories.
- Include programming languages, frameworks, libraries,
  databases, AI technologies and developer tools.
- Do not invent skills.

5. EXPERIENCE:
- Calculate professional experience only when supported
  by explicit dates or durations in the resume.
- Include internships and employment.
- Do not count university study as work experience.
- If duration cannot be reliably determined, return null.
- Never assume experience is zero just because it is unclear.

6. PROJECTS:
- Extract actual project names and descriptions.
- Do not invent projects.

7. GENERAL:
- Use null or empty arrays when information is unavailable.
- Never guess missing information.
- Do not corrupt names, degree titles or other details.
- Return valid JSON only.

RESUME:
${resumeText}
`;

    const result = await executeWithFallback(
        prompt,
        "You are a precise resume extraction system that outputs only JSON according to the given schema.",
        "analyzeResume"
    );

    if (!Array.isArray(result.skills)) result.skills = [];
    if (!Array.isArray(result.education)) result.education = [];

    return result;
};

export const evaluateEducation = async (
    candidateEducation,
    requiredEducation,
) => {
    const prompt = `
Compare the candidate's education with the job's education requirement.

Candidate education:
${candidateEducation}

Required education:
${requiredEducation}

Determine whether the candidate's education is relevant to the requirement.

Return only this JSON structure:
{
    "educationMatch": true,
    "reason": "Short explanation"
}

Rules:
- educationMatch must be a boolean.
- Consider related academic fields, not just exact degree-title matches.
- Do not assume a degree is completed if the information does not say so.
- Do not invent qualifications.
`;

    const result = await executeWithFallback(
        prompt,
        "You are an HR education evaluator. Respond only in valid JSON format matching the schema requested.",
        "evaluateEducation"
    );

    if (typeof result.educationMatch !== "boolean") {
        throw new Error("Invalid education evaluation result returned by AI.");
    }

    return result;
};
