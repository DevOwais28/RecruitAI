import { analyzeResume } from "./src/services/ollama.js";

const sampleResume = `
Owais Ahmed
Email: owais@example.com
React and Node.js developer.
2 years of experience.
Bachelor's in Artificial Intelligence.
`;

const result = await analyzeResume(sampleResume);

console.log("Ollama Analysis:");
console.log(result);