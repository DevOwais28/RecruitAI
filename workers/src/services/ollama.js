
const getOllamaUrl = () =>
    `${(process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "")}/api/generate`;

export const validateResume = async (resumeText) => {
    const response = await fetch(getOllamaUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "phi3:latest",
            format: "json",
            stream: false,
            options: {
                temperature: 0,
            },
            prompt: `
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
            `,
        }),
    });

    if (!response.ok) {
        throw new Error("Ollama CV validation failed.");
    }

    const data = await response.json();

    try {
        const result = JSON.parse(data.response);

        if (typeof result.isResume !== "boolean") {
            throw new Error("Invalid validation result.");
        }

        return result;
    } catch {
        throw new Error("Ollama returned invalid CV validation JSON.");
    }
};

export const analyzeResume = async (resumeText) => {
    const response = await fetch(getOllamaUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "phi3:latest",
            format: "json",
            stream: false,
            options: {
                temperature: 0,
            },
            prompt: `
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
`,
        }),
    });

    if (!response.ok) {
        throw new Error("Ollama API request failed.");
    }

    const data = await response.json();

    try {
        return JSON.parse(data.response);
    } catch {
        throw new Error("Ollama returned invalid JSON.");
    }
};


export const evaluateEducation = async (
    candidateEducation,
    requiredEducation,
) => {
    const response = await fetch(getOllamaUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "phi3:latest",
            format: "json",
            stream: false,
            options: {
                temperature: 0,
            },
            prompt: `
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
            `,
        }),
    });

    if (!response.ok) {
        throw new Error("Ollama education evaluation failed.");
    }

    const data = await response.json();

    try {
        return JSON.parse(data.response);
    } catch {
        throw new Error("Ollama returned invalid education evaluation JSON.");
    }
};