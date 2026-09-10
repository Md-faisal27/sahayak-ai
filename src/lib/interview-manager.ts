import { DocumentChunk } from './rag';
import { AppLanguage } from './language';
import {
  initializeTopicCoverage,
  recordTopicTested,
  selectNextTopicAndFacet,
  calculateTopicCoverageMetrics,
  TopicCoverageMatrix,
  TestingFacet,
} from './topic-extractor';
import { QuestionRecord } from './deduplication-service';
import { generateSingleInterviewQuestion, InterviewQuestionMetadata } from './question-generator';
import { evaluateAnswerWithGroundTruth, DetailedAnswerEvaluation } from './answer-evaluator';

export interface InterviewTurnResult {
  evaluation: DetailedAnswerEvaluation;
  isCompleted: boolean;
  nextQuestionIndex: number;
  nextQuestion?: InterviewQuestionMetadata;
  combinedSpokenText: string;
  updatedCoverageMatrix: TopicCoverageMatrix;
  coverageMetrics: {
    coveredTopics: number;
    totalTopics: number;
    coveragePercent: number;
  };
}

/**
 * Handle student answer submission and generate adaptive next question for the interview
 */
export async function processInterviewTurn(
  chunks: DocumentChunk[],
  detectedSubject: string,
  currentQuestion: {
    questionText: string;
    topic: string;
    sourceContext: string;
    conceptBeingTested: string;
    expectedKeyPoints: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionType: string;
  },
  studentResponse: string,
  allPreviousQuestions: QuestionRecord[],
  currentCoverageMatrix: TopicCoverageMatrix,
  questionIndex: number,
  totalQuestionCount: number,
  language: AppLanguage = 'ENGLISH',
  isSkipped: boolean = false
): Promise<InterviewTurnResult> {
  // 1. Evaluate student's answer grounded in the PDF reference or skip
  const evaluation: DetailedAnswerEvaluation = isSkipped
    ? {
        scoreOutOf10: 0,
        scorePercent: 0,
        classification: 'INCORRECT',
        feedback: 'Question skipped by candidate.',
        pointsMentioned: [],
        missingPoints: currentQuestion.expectedKeyPoints,
        expectedKeyPoints: currentQuestion.expectedKeyPoints,
        spokenFeedback: 'Skipping question.',
        adaptiveRecommendation: 'SIMPLIFY_FOLLOW_UP',
        suggestedNextDifficulty: 'Easy',
      }
    : await evaluateAnswerWithGroundTruth(
        currentQuestion.questionText,
        currentQuestion.sourceContext,
        currentQuestion.conceptBeingTested,
        currentQuestion.expectedKeyPoints,
        studentResponse,
        currentQuestion.difficulty,
        language
      );

  // 2. Update topic coverage
  const facetMap: Record<string, TestingFacet> = {
    Definition: 'definition',
    'Core concept': 'core_concept',
    Why: 'why_how',
    How: 'why_how',
    Application: 'application',
    Comparison: 'comparison',
    Scenario: 'scenario',
  };
  const testedFacet: TestingFacet = facetMap[currentQuestion.questionType] || 'core_concept';
  const updatedCoverageMatrix = recordTopicTested(
    currentCoverageMatrix,
    currentQuestion.topic,
    testedFacet
  );

  const nextIndex = questionIndex + 1;
  const isCompleted = nextIndex >= totalQuestionCount;
  const ackText = isSkipped ? 'Question skipped.' : 'Answer recorded.';

  // 3. If interview completed, format concluding conversational message
  if (isCompleted) {
    const coverageMetrics = calculateTopicCoverageMetrics(updatedCoverageMatrix);
    const conclusionSpoken = `${ackText} That concludes your technical interview. You covered ${coverageMetrics.coveredTopics} core topics. Your complete performance report is now ready.`;

    return {
      evaluation,
      isCompleted: true,
      nextQuestionIndex: nextIndex,
      combinedSpokenText: conclusionSpoken,
      updatedCoverageMatrix,
      coverageMetrics,
    };
  }

  // 4. Determine next topic and target facet
  const nextTarget = selectNextTopicAndFacet(
    updatedCoverageMatrix,
    evaluation.suggestedNextDifficulty,
    currentQuestion.topic
  );

  // Formulate adaptive context prompt
  let adaptiveContext = isSkipped
    ? `Student skipped previous question ("${currentQuestion.questionText}"). Ask a foundational or accessible question on ${nextTarget.topic}.`
    : `Student scored ${evaluation.scoreOutOf10}/10 on previous question ("${currentQuestion.questionText}").
Feedback was: "${evaluation.feedback}".
Recommendation: ${evaluation.adaptiveRecommendation}.`;

  if (!isSkipped && evaluation.adaptiveRecommendation === 'SIMPLIFY_FOLLOW_UP') {
    adaptiveContext += ` The student struggled with ${currentQuestion.conceptBeingTested}. Ask a simpler, foundational question to help them demonstrate understanding.`;
  } else if (!isSkipped && evaluation.adaptiveRecommendation === 'INCREASE_DIFFICULTY') {
    adaptiveContext += ` The student demonstrated strong mastery. Increase technical depth or probe higher-order reasoning.`;
  }

  // 5. Generate ONE non-repeated, grounded next question
  const nextQuestion = await generateSingleInterviewQuestion(
    chunks,
    detectedSubject,
    nextTarget.topic,
    evaluation.suggestedNextDifficulty,
    allPreviousQuestions,
    language,
    adaptiveContext
  );

  // 6. Conversational progression
  const combinedSpokenText = `${ackText} Question ${nextIndex + 1}: ${nextQuestion.question}`;
  const coverageMetrics = calculateTopicCoverageMetrics(updatedCoverageMatrix);

  return {
    evaluation,
    isCompleted: false,
    nextQuestionIndex: nextIndex,
    nextQuestion,
    combinedSpokenText,
    updatedCoverageMatrix,
    coverageMetrics,
  };
}
