import { callLLM } from './ai';
import { AppLanguage, getLanguageSystemPromptInstruction } from './language';

export interface DetailedAnswerEvaluation {
  scoreOutOf10: number; // 0 to 10
  scorePercent: number; // 0 to 100
  classification: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNCLEAR';
  feedback: string;
  pointsMentioned: string[];
  missingPoints: string[];
  expectedKeyPoints: string[];
  spokenFeedback: string;
  adaptiveRecommendation: 'INCREASE_DIFFICULTY' | 'SIMPLIFY_FOLLOW_UP' | 'MOVE_TO_NEXT_TOPIC';
  suggestedNextDifficulty: 'Easy' | 'Medium' | 'Hard';
}

/**
 * PDF-Grounded Semantic Answer Evaluator
 * Evaluates student understanding rather than exact wording.
 */
export async function evaluateAnswerWithGroundTruth(
  questionText: string,
  sourceContext: string,
  conceptBeingTested: string,
  expectedKeyPoints: string[],
  studentResponse: string,
  currentDifficulty: 'Easy' | 'Medium' | 'Hard',
  language: AppLanguage = 'ENGLISH'
): Promise<DetailedAnswerEvaluation> {
  const cleanResponse = (studentResponse || '').trim();

  // If response is essentially blank
  if (cleanResponse.length < 3) {
    return {
      scoreOutOf10: 1,
      scorePercent: 10,
      classification: 'UNCLEAR',
      feedback: 'No clear answer was provided. Try articulating the concept in your own words.',
      pointsMentioned: [],
      missingPoints: expectedKeyPoints,
      expectedKeyPoints,
      spokenFeedback: "I didn't quite catch a clear response. Let's try simplifying the concept.",
      adaptiveRecommendation: 'SIMPLIFY_FOLLOW_UP',
      suggestedNextDifficulty: 'Easy',
    };
  }

  const langInstruction = getLanguageSystemPromptInstruction(language);

  const systemPrompt = `You are Sahayak AI, an expert technical examiner evaluating a student's answer against the PDF source context.
${langInstruction}

EVALUATION CRITERIA:
1. Conceptual correctness based STRICTLY on the PDF reference.
2. Evaluate SEMANTIC MEANING, NOT verbatim phrasing. Do not penalize if student uses their own words.
3. Check:
   - Important points correctly mentioned
   - Missing points
   - Incorrect statements or misconceptions
   - Depth of understanding
4. Score:
   - 8-10: CORRECT (Thorough conceptual understanding, key points addressed)
   - 5-7: PARTIALLY_CORRECT (Understands general idea, but misses a key mechanism or detail)
   - 1-4: INCORRECT (Misconception or major inaccuracy)
   - 0-2: UNCLEAR / Off-topic
5. Spoken Feedback: Short, natural, conversational 1-2 sentence spoken summary suitable for Rime TTS (NO markdown, NO formatting).

Return JSON ONLY matching this schema:
{
  "scoreOutOf10": number (0 to 10),
  "classification": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "UNCLEAR",
  "feedback": "Concise written feedback explaining what was correct and what was missing",
  "pointsMentioned": ["Point A", "Point B"],
  "missingPoints": ["Point C"],
  "spokenFeedback": "Natural spoken response for interviewer voice without formatting",
  "adaptiveRecommendation": "INCREASE_DIFFICULTY" | "SIMPLIFY_FOLLOW_UP" | "MOVE_TO_NEXT_TOPIC"
}`;

  const prompt = `QUESTION:
${questionText}

PDF SOURCE REFERENCE:
${sourceContext}

CONCEPT BEING TESTED:
${conceptBeingTested}

EXPECTED KEY POINTS:
${JSON.stringify(expectedKeyPoints)}

STUDENT RESPONSE:
"${cleanResponse}"

CURRENT DIFFICULTY: ${currentDifficulty}`;

  const raw = await callLLM(prompt, systemPrompt, true);

  if (raw) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const score = Math.max(0, Math.min(10, Math.round(parsed.scoreOutOf10 ?? 6)));
        const scorePercent = score * 10;

        let classification: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNCLEAR' =
          parsed.classification || (score >= 8 ? 'CORRECT' : score >= 5 ? 'PARTIALLY_CORRECT' : 'INCORRECT');

        let nextDiff: 'Easy' | 'Medium' | 'Hard' = currentDifficulty;
        if (score >= 8) {
          nextDiff = currentDifficulty === 'Easy' ? 'Medium' : 'Hard';
        } else if (score < 5) {
          nextDiff = currentDifficulty === 'Hard' ? 'Medium' : 'Easy';
        }

        return {
          scoreOutOf10: score,
          scorePercent,
          classification,
          feedback: parsed.feedback || `Score: ${score}/10. Review the key points above.`,
          pointsMentioned: Array.isArray(parsed.pointsMentioned) ? parsed.pointsMentioned : [],
          missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
          expectedKeyPoints,
          spokenFeedback:
            parsed.spokenFeedback ||
            (score >= 8
              ? 'That was a solid explanation. Good grasp of the concept.'
              : score >= 5
              ? "That's mostly correct, though a few important details were missing."
              : "That didn't quite capture the core idea from the material."),
          adaptiveRecommendation:
            parsed.adaptiveRecommendation ||
            (score >= 8 ? 'INCREASE_DIFFICULTY' : score < 5 ? 'SIMPLIFY_FOLLOW_UP' : 'MOVE_TO_NEXT_TOPIC'),
          suggestedNextDifficulty: nextDiff,
        };
      }
    } catch (e) {
      console.warn('Failed parsing evaluation JSON from LLM:', e);
    }
  }

  // Fallback semantic evaluation
  return fallbackEvaluation(cleanResponse, expectedKeyPoints, currentDifficulty);
}

function fallbackEvaluation(
  studentResponse: string,
  expectedKeyPoints: string[],
  currentDifficulty: 'Easy' | 'Medium' | 'Hard'
): DetailedAnswerEvaluation {
  const words = studentResponse.toLowerCase().split(/\s+/);
  let matchedPoints = 0;

  expectedKeyPoints.forEach((point) => {
    const pointKeywords = point
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const hasOverlap = pointKeywords.some((kw) => words.includes(kw));
    if (hasOverlap) matchedPoints++;
  });

  const totalPoints = Math.max(1, expectedKeyPoints.length);
  const ratio = matchedPoints / totalPoints;
  const score = Math.round(ratio * 7 + 3); // 3 to 10
  const scorePercent = score * 10;

  const classification = score >= 8 ? 'CORRECT' : score >= 5 ? 'PARTIALLY_CORRECT' : 'INCORRECT';
  const nextDiff: 'Easy' | 'Medium' | 'Hard' =
    score >= 8 ? (currentDifficulty === 'Easy' ? 'Medium' : 'Hard') : score < 5 ? 'Easy' : currentDifficulty;

  return {
    scoreOutOf10: score,
    scorePercent,
    classification,
    feedback: `Your response touched on ${matchedPoints} of ${totalPoints} core points.`,
    pointsMentioned: expectedKeyPoints.slice(0, matchedPoints),
    missingPoints: expectedKeyPoints.slice(matchedPoints),
    expectedKeyPoints,
    spokenFeedback:
      score >= 8
        ? 'Well explained. You covered the main ideas.'
        : "You covered part of the concept, but let's see how you do on the next one.",
    adaptiveRecommendation: score >= 8 ? 'INCREASE_DIFFICULTY' : 'MOVE_TO_NEXT_TOPIC',
    suggestedNextDifficulty: nextDiff,
  };
}
