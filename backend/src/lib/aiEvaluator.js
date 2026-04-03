import { GoogleGenerativeAI } from "@google/generative-ai";


console.log("GEMINI KEY LOADED:", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * Evaluates a single subjective answer using Gemini.
 * @param {Object} params
 * @param {string} params.question       - The question text
 * @param {string} params.rubric         - Grading criteria for the question
 * @param {string} params.studentAnswer  - The student's written answer
 * @param {number} params.maxScore       - Maximum score for this question
 * @param {string} params.difficulty     - Course difficulty level (beginner/intermediate/advanced)
 * @returns {Promise<{ score, confidence, feedback, strengths, improvements }>}
 */
export const evaluateSubjectiveAnswer = async ({
    question,
    rubric,
    studentAnswer,
    maxScore = 100,
    difficulty = "intermediate",
}) => {
    const prompt = `You are an academic grader for a ${difficulty}-level online course. Evaluate the student's answer strictly and fairly based on the rubric provided.

Question: ${question}
Grading rubric: ${rubric}
Maximum score: ${maxScore}
Student's answer: ${studentAnswer}

Respond ONLY with valid JSON in this exact format — no preamble, no markdown, no explanation outside the JSON:
{
  "score": <integer from 0 to ${maxScore}>,
  "confidence": <float from 0.0 to 1.0>,
  "feedback": "<2-3 sentence constructive feedback addressing the student directly>",
  "strengths": ["<one key thing the student did well>"],
  "improvements": ["<one specific area to improve>"]
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    try {
        return JSON.parse(raw);
    } catch {
        // Strip markdown fences if the model wraps output despite instructions
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        return JSON.parse(cleaned);
    }
};

/**
 * Calculates the weighted total score for a test attempt.
 * Handles mixed MCQ (isCorrect-based) and subjective (aiScore-based) answers.
 * @param {Array} answers        - The answers array from a TestResult document
 * @param {Array} questions      - The questions array from the Test document
 * @returns {number}             - Final score as a percentage (0–100)
 */
export const calculateWeightedScore = (answers, questions) => {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const answer of answers) {
        const question = questions.find(
            (q) => q._id.toString() === answer.questionId.toString()
        );
        if (!question) continue;

        const weight = question.weight ?? 1;
        totalWeight += weight;

        if (answer.type === "mcq") {
            weightedSum += answer.isCorrect ? weight * question.maxScore : 0;
        } else {
            // aiScore is already on a 0–maxScore scale, normalise to percentage
            const normalised = ((answer.aiScore ?? 0) / question.maxScore) * 100;
            weightedSum += (normalised / 100) * weight * question.maxScore;
        }
    }

    if (totalWeight === 0) return 0;

    const maxPossible = questions.reduce(
        (sum, q) => sum + (q.weight ?? 1) * q.maxScore,
        0
    );
    return Math.round((weightedSum / maxPossible) * 100);
};