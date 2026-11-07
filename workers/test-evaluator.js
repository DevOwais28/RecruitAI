import "dotenv/config";
import { pool } from "./src/services/database.js";
import { evaluateCandidate } from "./src/services/candidate-evaluator.js";

const test = async () => {
    try {
        const result = await evaluateCandidate(
            "10c91aa8-43a5-4b75-a70f-de2b17ad5035"
        );

        console.log("\nEvaluation Result:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Evaluation failed:", error.message);
    } finally {
        await pool.end();
    }
};

test();