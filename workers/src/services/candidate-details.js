const extractEmail = (text) => {
    const match = text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    return match ? match[0] : null;
};

const extractPhone = (text) => {
    const match = text.match(
        /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}/
    );

    return match ? match[0].trim() : null;
};

const extractName = (text) => {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const ignored = [
        "resume",
        "curriculum vitae",
        "contact",
        "profile",
        "summary",
        "objective",
        "software engineer",
        "full stack developer",
    ];

    for (const line of lines.slice(0, 10)) {
        const normalized = line.toLowerCase();

        if (
            line.length < 4 ||
            line.length > 60 ||
            ignored.some((word) => normalized.includes(word)) ||
            /@|https?:\/\/|www\.|\d/.test(line)
        ) {
            continue;
        }

        if (/^[a-zA-Z]+(?:[ '-][a-zA-Z]+){1,3}$/.test(line)) {
            return line;
        }
    }

    return null;
};

export const extractCandidateDetails = (text) => ({
    fullName: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
});