
import { pool } from "./database.js";
import { evaluateEducation } from "./ollama.js";

const normalizeSkill = (skill) =>
    skill.toLowerCase().trim().replace(/\s+/g, " ");

// Mandatory skills	50
// Preferred skills	20
// Experience	15
// Education	15
// Total	100

export const evaluateCandidate = async (candidateId) => {
    // 1. Fetch candidate and associated job requirements
    const result = await pool.query(
        `SELECT
            c.id,
            c.skills,
            c.education,
            c.experience_years,
            j.mandatory_skills,
            j.preferred_skills,
            j.min_experience,
            j.education_required
         FROM candidates c
         JOIN jobs j ON c.job_id = j.id
         WHERE c.id = $1`,
        [candidateId],
    );

    if (result.rows.length === 0) {
        throw new Error("Candidate or associated job not found.");
    }

    const candidate = result.rows[0];

    // 2. Prepare candidate skills
    const candidateSkills = new Set(
        (candidate.skills || []).map(normalizeSkill),
    );

    // 3. Compare mandatory skills
    const mandatorySkills = candidate.mandatory_skills || [];

    const matchedMandatory = mandatorySkills.filter(
        (skill) => candidateSkills.has(normalizeSkill(skill)),
    );

    const missingMandatory = mandatorySkills.filter(
        (skill) => !candidateSkills.has(normalizeSkill(skill)),
    );

    // 4. Compare preferred skills
    const preferredSkills = candidate.preferred_skills || [];

    const matchedPreferred = preferredSkills.filter(
        (skill) => candidateSkills.has(normalizeSkill(skill)),
    );

    // 6. Evaluate experience
    const experienceMatch =
        Number(candidate.min_experience) <= 0 ||
        (
            candidate.experience_years !== null &&
            Number(candidate.experience_years) >= Number(candidate.min_experience)
        );

    const experienceScore = experienceMatch ? 15 : 0;

    // 7. Evaluate education using Ollama
    const educationResult = await evaluateEducation(
        candidate.education,
        candidate.education_required,
    );

    const educationMatch = educationResult.educationMatch;
    const educationScore = educationMatch ? 15 : 0;

    // 5. Calculate skill scores
    const mandatoryScore = mandatorySkills.length
        ? (matchedMandatory.length / mandatorySkills.length) * 50
        : 50;

    const preferredScore = preferredSkills.length
        ? (matchedPreferred.length / preferredSkills.length) * 20
        : 20;
    // 8. Calculate overall score
    const overallScore =
        mandatoryScore +
        preferredScore +
        experienceScore +
        educationScore;

    const recommendation =
        overallScore >= 75
            ? "recommended"
            : overallScore >= 50
                ? "consider"
                : "not_recommended";

    const explanation = `
Overall Match: ${overallScore.toFixed(1)}%

Mandatory Skills (${mandatoryScore.toFixed(1)}/50):
Matched: ${matchedMandatory.join(", ") || "None"}
Missing: ${missingMandatory.join(", ") || "None"}

Preferred Skills (${preferredScore.toFixed(1)}/20):
Matched: ${matchedPreferred.join(", ") || "None"}

Experience (${experienceScore}/15):
Required: ${candidate.min_experience} years
Candidate: ${candidate.experience_years ?? "Not provided"} years
Result: ${experienceMatch ? "Requirements met" : "Requirements not met"}

Education (${educationScore}/15):
Required: ${candidate.education_required || "Not specified"}
Candidate: ${candidate.education || "Not provided"}
Result: ${educationResult.reason || (educationMatch ? "Requirements met" : "Requirements not met")}

Final Recommendation: ${recommendation.toUpperCase().replaceAll("_", " ")}
`;
    // Temporary: education and experience evaluation
    // will be added in the next steps.

    // 9. Save evaluation in PostgreSQL
    await pool.query(
        `INSERT INTO candidate_evaluations (
        candidate_id,
        overall_score,
        mandatory_match_score,
        preferred_match_score,
        matched_mandatory_skills,
        missing_mandatory_skills,
        matched_preferred_skills,
        experience_match,
        education_match,
        explanation,
        recommendation
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (candidate_id)
    DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        mandatory_match_score = EXCLUDED.mandatory_match_score,
        preferred_match_score = EXCLUDED.preferred_match_score,
        matched_mandatory_skills = EXCLUDED.matched_mandatory_skills,
        missing_mandatory_skills = EXCLUDED.missing_mandatory_skills,
        matched_preferred_skills = EXCLUDED.matched_preferred_skills,
        experience_match = EXCLUDED.experience_match,
        education_match = EXCLUDED.education_match,
        explanation = EXCLUDED.explanation,
        recommendation = EXCLUDED.recommendation,
        updated_at = CURRENT_TIMESTAMP`,
        [
            candidateId,
            overallScore,
            mandatoryScore,
            preferredScore,
            matchedMandatory,
            missingMandatory,
            matchedPreferred,
            experienceMatch,
            educationMatch,
            explanation,
            recommendation,
        ],
    );

    // console.log("Mandatory skills matched:", matchedMandatory);
    // console.log("Mandatory skills missing:", missingMandatory);
    // console.log("Preferred skills matched:", matchedPreferred);
    // console.log("Experience required:", candidate.min_experience);
    // console.log("Candidate experience:", candidate.experience_years);
    // console.log("Experience matched:", experienceMatch);
    // console.log("Education required:", candidate.education_required);
    // console.log("Candidate education:", candidate.education);
    // console.log("Education matched:", educationMatch);
    // console.log("Education reason:", educationResult.reason);
    // console.log("Overall score:", overallScore);
    // console.log("Recommendation:", recommendation);

    return {
        mandatoryScore,
        preferredScore,
        matchedMandatory,
        missingMandatory,
        matchedPreferred,
        experienceMatch,
        experienceScore,
        educationMatch,
        educationScore,
        explanation,
        recommendation,
        overallScore,
    };
};
