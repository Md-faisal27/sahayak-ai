import { DocumentChunk, retrieveRelevantChunks, cleanTopicString } from './rag';
import { callLLM } from './ai';
import { isQuestionDuplicate, QuestionRecord } from './deduplication-service';
import { AppLanguage, getLanguageSystemPromptInstruction } from './language';

export type QuestionCategory =
  | 'Core concept'
  | 'Definition'
  | 'Understanding'
  | 'Why'
  | 'How'
  | 'Application'
  | 'Comparison'
  | 'Scenario'
  | 'Technical'
  | 'Reasoning'
  | 'Advanced/deep';

export interface InterviewQuestionMetadata {
  question: string;
  topic: string;
  subtopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: QuestionCategory;
  sourceContext: string;
  conceptBeingTested: string;
  expectedKeyPoints: string[];
  naturalSpokenPrompt: string;
  hint5Words: string;
  fullHint: string;
}

/**
 * Generates ONE adaptive, non-repeated, grounded interview question from PDF chunks
 */
export async function generateSingleInterviewQuestion(
  chunks: DocumentChunk[],
  detectedSubject: string,
  targetTopic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  previousQuestions: QuestionRecord[] = [],
  language: AppLanguage = 'ENGLISH',
  contextPrompt?: string
): Promise<InterviewQuestionMetadata> {
  const langInstruction = getLanguageSystemPromptInstruction(language);

  // Sanitize target topic
  const cleanTarget = cleanTopicString(targetTopic) || `${detectedSubject} Architecture & Core Principles`;

  // Retrieve relevant RAG chunks for the targeted topic
  const relevantChunks = retrieveRelevantChunks(chunks, cleanTarget, 4);
  const contextText = relevantChunks
    .map((c) => `[Section: ${cleanTopicString(c.topic) || cleanTarget}]\n${c.text}`)
    .join('\n\n')
    .slice(0, 5500);

  const previousTexts = previousQuestions.map((q) => q.questionText);
  const previouslyTestedConcepts = previousQuestions
    .map((q) => q.conceptBeingTested)
    .filter(Boolean)
    .join(', ');

  const systemPrompt = `You are Sahayak AI, an expert, professional, and friendly technical interviewer.
You are interviewing a student strictly on the uploaded study material.
Subject: ${detectedSubject}
Target Topic: ${cleanTarget}
Difficulty: ${difficulty}
${langInstruction}

ABSOLUTE NEGATIVE RULES (MANDATORY):
1. Under NO circumstances should you ask about slide numbers, unit numbers (e.g. Unit-1, Unit-2), table of contents, syllabus outlines, or page ranges (e.g. 48-58).
2. NEVER ask about or mention college, university, institute, or lecturer names (e.g. NMIET, Polytechnic, Lecturer Das).
3. NEVER ask vague meta-questions like "What are the topics covered in section X?" or "Explain the contents of this unit".
4. You MUST test the deep conceptual mechanism, 'why'/'how' logic, architectural trade-offs, algorithms, or real-world problem scenarios of the technical subject matter.

DIFFICULTY LEVEL SPECIFICATIONS:
- EASY: Clear definition, essential role, or basic operational principle of a specific mechanism.
- MEDIUM: Conceptual mechanism, "why" / "how" an algorithm/system works, comparisons between two ideas, or operational trade-offs.
- HARD: Deep architectural reasoning, failure scenarios, concurrency/edge-case trade-offs, or multi-concept interactions.

CRITICAL INTERVIEW RULES:
1. Ground the question STRICTLY in the provided PDF context chunks.
2. Ask ONE focused, specific question testing a concrete technical mechanism or concept.
3. NEVER repeat or rephrase previously asked questions:
   Previous Questions to Avoid: ${JSON.stringify(previousTexts.slice(-8))}
   Concepts Already Tested: ${previouslyTestedConcepts || 'None yet'}
4. The question must test a NEW facet or concept.
5. Create a 'naturalSpokenPrompt' that sounds like a calm, encouraging, and natural human interviewer speaking out loud (NO markdown, NO asterisks, NO code blocks).
6. Return JSON ONLY matching this schema:
{
  "question": "Focused technical question",
  "topic": "${cleanTarget}",
  "subtopic": "Specific subtopic or mechanism",
  "difficulty": "${difficulty}",
  "questionType": "Core concept" | "Definition" | "Understanding" | "Why" | "How" | "Application" | "Comparison" | "Scenario" | "Technical" | "Reasoning" | "Advanced/deep",
  "sourceContext": "Direct sentence or excerpt from context grounding this question",
  "conceptBeingTested": "Core concept name (e.g. Deadlock Prevention Invariant, Referential Integrity)",
  "expectedKeyPoints": ["Point 1 that a correct answer must cover", "Point 2", "Point 3"],
  "naturalSpokenPrompt": "Spoken-friendly phrasing for TTS without any markdown or formatting symbols",
  "hint5Words": "Five word active recall clue",
  "fullHint": "Helpful conceptual clue without giving away the full answer"
}`;

  let prompt = `DOCUMENT CONTEXT CHUNKS:
${contextText}

Generate ONE ${difficulty}-level question testing a concrete technical aspect of "${cleanTarget}".`;

  if (contextPrompt) {
    prompt += `\n\nADAPTIVE INTERVIEW CONTEXT:
${contextPrompt}`;
  }

  // Deduplication retry loop (up to 3 attempts)
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(prompt, systemPrompt, true);
    if (raw) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.question && parsed.question.trim().length > 10) {
            const dupCheck = await isQuestionDuplicate(
              parsed.question,
              parsed.conceptBeingTested,
              previousQuestions
            );

            if (!dupCheck.isDuplicate) {
              const expectedPoints = Array.isArray(parsed.expectedKeyPoints)
                ? parsed.expectedKeyPoints
                : [parsed.conceptBeingTested || 'Key conceptual accuracy'];

              return {
                question: parsed.question.trim(),
                topic: parsed.topic || targetTopic,
                subtopic: parsed.subtopic || targetTopic,
                difficulty: (parsed.difficulty as any) || difficulty,
                questionType: (parsed.questionType as any) || (difficulty === 'Easy' ? 'Definition' : 'Why'),
                sourceContext: parsed.sourceContext || relevantChunks[0]?.text.slice(0, 300) || '',
                conceptBeingTested: parsed.conceptBeingTested || targetTopic,
                expectedKeyPoints: expectedPoints,
                naturalSpokenPrompt: parsed.naturalSpokenPrompt || parsed.question,
                hint5Words: (parsed.hint5Words || 'Core document concept clue').split(' ').slice(0, 5).join(' '),
                fullHint: parsed.fullHint || 'Recall the essential definition from your document.',
              };
            } else {
              console.log(`Deduplication rejected candidate question (attempt ${attempt + 1}): ${dupCheck.reason}`);
              prompt += `\n\nNOTE: You previously proposed a duplicate or overlapping question. Please generate a DIFFERENT question testing a fresh concept from the text.`;
            }
          }
        }
      } catch (e) {
        console.warn('Failed parsing question JSON attempt:', e);
      }
    }
  }

  // Fallback grounded question from chunks if LLM parsing failed
  return generateFallbackQuestion(relevantChunks, cleanTarget, difficulty, previousQuestions);
}

function generateFallbackQuestion(
  chunks: DocumentChunk[],
  targetTopic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  previousQuestions: QuestionRecord[]
): InterviewQuestionMetadata {
  const cleanTarget = cleanTopicString(targetTopic) || 'Core Technical Foundations';
  const chunk = chunks[0] || { text: `${cleanTarget} principles and architecture.`, topic: cleanTarget };
  
  const sentences = chunk.text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const lower = s.toLowerCase();
      return (
        s.length > 25 &&
        s.length < 250 &&
        !lower.includes('lecture note') &&
        !lower.includes('compiled by') &&
        !lower.includes('department of') &&
        !lower.includes('college') &&
        !lower.includes('syllabus') &&
        !lower.includes('contents')
      );
    });

  // Pick a clean technical sentence that hasn't been used
  let selectedSentence = sentences[0] || `${cleanTarget} provides key operational guarantees in this subject.`;
  for (const s of sentences) {
    if (!previousQuestions.some((p) => p.questionText.toLowerCase().includes(s.toLowerCase().slice(0, 20)))) {
      selectedSentence = s;
      break;
    }
  }

  let question = `According to the uploaded material on ${cleanTarget}, what is the fundamental purpose of this concept and how does it operate?`;
  let questionType: QuestionCategory = 'Core concept';

  if (difficulty === 'Easy') {
    question = `Based on your uploaded material, how is ${cleanTarget} defined and what primary role does it serve?`;
    questionType = 'Definition';
  } else if (difficulty === 'Hard') {
    question = `In the context of ${cleanTarget}, analyze the trade-offs described in the statement: "${selectedSentence}"`;
    questionType = 'Reasoning';
  } else {
    question = `Why is ${cleanTarget} critical according to your document, and how does it connect with related mechanisms?`;
    questionType = 'Why';
  }

  return {
    question,
    topic: cleanTarget,
    subtopic: cleanTarget,
    difficulty,
    questionType,
    sourceContext: selectedSentence,
    conceptBeingTested: cleanTarget,
    expectedKeyPoints: [
      `Accurate technical definition of ${cleanTarget}`,
      'Explanation of underlying mechanism',
      'Contextual application described in document',
    ],
    naturalSpokenPrompt: `Let's discuss ${cleanTarget}. ${question}`,
    hint5Words: `${cleanTarget} fundamental operational concept.`.split(' ').slice(0, 5).join(' '),
    fullHint: `Think about how ${cleanTarget} is explained in your uploaded document.`,
  };
}
