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

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const delays = [2000, 4000, 8000];
    let result;

    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            result = await model.generateContent(prompt);
            break;
        } catch (error) {
            const msg = error.message || "";
            const isRetryable = msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("high demand");
            
            if (isRetryable && attempt < 3) {
                await sleep(delays[attempt]);
            } else {
                throw error;
            }
        }
    }

    const raw = result.response.text().trim();

    try {
        return JSON.parse(raw);
    } catch {
        // Strip markdown fences if the model wraps output despite instructions
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        return JSON.parse(cleaned);
    }
};

export const generateCapstoneMCQ = async ({
    conceptTag,
    courseTitle,
    count = 5,
    difficulty = "intermediate",
    existingQuestions = [],
}) => {
    const difficultyMap = {
        beginner: "easy",
        intermediate: "medium",
        advanced: "hard",
    };
    const mappedDifficulty = difficultyMap[difficulty] || "medium";
    const existingStems = Array.isArray(existingQuestions)
        ? existingQuestions
            .map((q) => (typeof q?.stem === "string" ? q.stem.trim() : ""))
            .filter(Boolean)
        : [];

    const prompt = `You are generating capstone-level MCQs for an e-learning platform.

Return ONLY a valid JSON array. Do not include any preamble, explanation, or markdown code fences.

Generate exactly ${count} unique questions for:
- conceptTag: ${conceptTag}
- courseTitle: ${courseTitle}
- difficulty: ${mappedDifficulty}

Avoid creating near-duplicates of these existing stems:
${JSON.stringify(existingStems)}

Each array element must strictly match this shape:
{
  "stem": "string",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0,
  "conceptTag": "${conceptTag}",
  "source": "ai_generated",
  "difficulty": "${mappedDifficulty}"
}

Rules:
- options must be exactly 4 distinct plausible options
- correctIndex must be an integer from 0 to 3
- conceptTag must exactly match "${conceptTag}"
- source must be "ai_generated"
- difficulty must be "${mappedDifficulty}"`;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const delays = [2000, 4000, 8000];
    let result;

    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            result = await model.generateContent(prompt);
            break;
        } catch (error) {
            const msg = error.message || "";
            const isRetryable = msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("high demand");

            if (isRetryable && attempt < 3) {
                await sleep(delays[attempt]);
            } else {
                throw error;
            }
        }
    }

    const raw = result.response.text().trim();

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        parsed = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((q) => {
        const hasValidStem = typeof q?.stem === "string" && q.stem.trim().length > 0;
        const hasValidOptions =
            Array.isArray(q?.options) &&
            q.options.length === 4 &&
            q.options.every((opt) => typeof opt === "string");
        const hasValidCorrectIndex =
            typeof q?.correctIndex === "number" &&
            Number.isInteger(q.correctIndex) &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3;
        const hasMatchingConceptTag = q?.conceptTag === conceptTag;

        return hasValidStem && hasValidOptions && hasValidCorrectIndex && hasMatchingConceptTag;
    });
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

export async function generateConceptTag(questionText, courseTitle) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a concept taxonomy assistant for an e-learning platform.

Given this quiz question from the course "${courseTitle}":
"${questionText}"

Return ONLY a JSON object with exactly these two fields, no preamble, no markdown:
{
  "conceptTag": "lowercase-hyphenated-concept-name",
  "phrasingSeed": "snake_case_surface_structure_description"
}

Rules:
- conceptTag: the underlying concept being tested. Lowercase, alphanumeric, hyphens only. Examples: "closures", "for-loops", "array-methods", "async-await", "variable-scope"
- phrasingSeed: a short description of how this specific question is worded/framed. Underscore-separated. Examples: "closure_definition", "for_loop_syntax", "array_splice_mutation"
- Be consistent: questions testing the same concept must get the same conceptTag
- Be specific: questions testing the same concept but worded differently must get different phrasingSeeds`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Validate before returning
    if (
      typeof parsed.conceptTag !== "string" ||
      typeof parsed.phrasingSeed !== "string" ||
      !/^[a-z0-9-]+$/.test(parsed.conceptTag)
    ) {
      throw new Error("Invalid concept tag format from Gemini");
    }

    return { conceptTag: parsed.conceptTag, phrasingSeed: parsed.phrasingSeed };
  } catch (err) {
    console.log("generateConceptTag failed:", err.message);
    return { conceptTag: null, phrasingSeed: null };
  }
}

export async function generateAiAnalysis({ studentName, courseTitle, conceptualGaps, uncertainConcepts, testHistory }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a personalised learning assistant for an e-learning platform.

Student: ${studentName}
Course: ${courseTitle}

Based on this student's performance data:
- Confirmed conceptual gaps (recurring failures across multiple question phrasings): ${conceptualGaps.length > 0 ? conceptualGaps.join(", ") : "none identified yet"}
- Uncertain areas (limited data): ${uncertainConcepts.length > 0 ? uncertainConcepts.join(", ") : "none"}
- Recent test scores: ${testHistory.slice(-5).map(t => `${t.totalScore}%`).join(", ") || "no tests yet"}

Return ONLY a JSON object with exactly these four fields, no preamble, no markdown backticks:
{
  "weakAreas": ["concept1", "concept2"],
  "strengths": ["concept3", "concept4"],
  "personalizedFeedback": "2-3 sentence encouraging and specific feedback for this student",
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"]
}

Rules:
- weakAreas: only include concepts from the confirmed conceptual gaps list. Empty array if none.
- strengths: concepts the student is performing well on based on test history. Empty array if insufficient data.
- personalizedFeedback: warm, specific, encouraging. Reference actual concepts by name. Max 3 sentences.
- recommendations: 2-4 concrete, actionable next steps. Each under 15 words.
- Never mention "fingerprint", "classification", or internal system terminology.`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Validate shape
    if (
      !Array.isArray(parsed.weakAreas) ||
      !Array.isArray(parsed.strengths) ||
      typeof parsed.personalizedFeedback !== "string" ||
      !Array.isArray(parsed.recommendations)
    ) {
      throw new Error("Invalid aiAnalysis shape from Gemini");
    }

    return parsed;
  } catch (err) {
    console.log("generateAiAnalysis failed:", err.message);
    return null;
  }
}