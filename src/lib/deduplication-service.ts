import { calculateTextSimilarity } from './duplicate-checker';
import { callLLM } from './ai';

export interface QuestionRecord {
  questionText: string;
  conceptBeingTested?: string;
  topic?: string;
}

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  similarityScore: number;
  matchedQuestion?: string;
  reason?: string;
}

/**
 * Clean text for robust lexical comparison
 */
function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\b(can you|explain|what is|how does|why does|describe|define|in the uploaded material|according to the text)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a candidate question is an exact, rephrased, or conceptual duplicate
 * of any previously asked question in the interview session.
 */
export async function isQuestionDuplicate(
  candidateText: string,
  candidateConcept: string | undefined,
  previousQuestions: QuestionRecord[]
): Promise<DeduplicationCheckResult> {
  if (!candidateText || candidateText.trim().length < 10) {
    return { isDuplicate: true, similarityScore: 1.0, reason: 'Question too short or empty' };
  }

  if (!previousQuestions || previousQuestions.length === 0) {
    return { isDuplicate: false, similarityScore: 0 };
  }

  const normalizedCandidate = normalizeQuestion(candidateText);

  for (const prev of previousQuestions) {
    // 1. Exact or normalized string match
    const normalizedPrev = normalizeQuestion(prev.questionText);
    if (normalizedCandidate === normalizedPrev) {
      return {
        isDuplicate: true,
        similarityScore: 1.0,
        matchedQuestion: prev.questionText,
        reason: 'Exact or normalized duplicate of previous question',
      };
    }

    // 2. Lexical & character similarity score
    const textSim = calculateTextSimilarity(candidateText, prev.questionText);
    const normSim = calculateTextSimilarity(normalizedCandidate, normalizedPrev);
    const maxSim = Math.max(textSim, normSim);

    // If similarity is very high, immediately reject
    if (maxSim >= 0.65) {
      return {
        isDuplicate: true,
        similarityScore: maxSim,
        matchedQuestion: prev.questionText,
        reason: `Lexical similarity (${Math.round(maxSim * 100)}%) exceeds safe threshold`,
      };
    }

    // 3. Concept overlap check
    if (candidateConcept && prev.conceptBeingTested) {
      const conceptSim = calculateTextSimilarity(candidateConcept, prev.conceptBeingTested);
      if (conceptSim >= 0.70) {
        return {
          isDuplicate: true,
          similarityScore: conceptSim,
          matchedQuestion: prev.questionText,
          reason: `Tests identical concept: "${prev.conceptBeingTested}"`,
        };
      }
    }

    // 4. Ambiguous similarity zone (0.45 - 0.65): Check semantic intent with LLM if available
    if (maxSim >= 0.45 && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
      const isSemanticallySame = await checkSemanticEquivalenceWithLLM(candidateText, prev.questionText);
      if (isSemanticallySame) {
        return {
          isDuplicate: true,
          similarityScore: maxSim,
          matchedQuestion: prev.questionText,
          reason: 'LLM semantic similarity verification flagged questions as testing the same concept',
        };
      }
    }
  }

  return {
    isDuplicate: false,
    similarityScore: 0,
  };
}

/**
 * Fast LLM semantic equivalence check for borderline similarity pairs
 */
async function checkSemanticEquivalenceWithLLM(q1: string, q2: string): Promise<boolean> {
  const prompt = `QUESTION 1: "${q1}"
QUESTION 2: "${q2}"

Do these two questions test essentially the same core concept in the same manner?
Answer with EXACTLY "YES" or "NO" ONLY.`;

  try {
    const res = await callLLM(prompt, 'You are an assessment deduplication auditor. Answer YES or NO only.');
    return res.trim().toUpperCase().includes('YES');
  } catch (e) {
    return false;
  }
}
