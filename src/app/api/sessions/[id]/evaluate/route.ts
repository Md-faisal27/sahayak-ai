import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { processInterviewTurn } from '@/lib/interview-manager';
import { evaluateAnswerWithGroundTruth } from '@/lib/answer-evaluator';
import { AppLanguage } from '@/lib/language';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      questionId,
      studentResponse,
      hintsUsed = 0,
      interruptionsCount = 0,
      timeTakenSeconds = 0,
    } = body;

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        document: true,
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const question = session.questions.find((q) => q.id === questionId) || session.questions[session.currentQuestionIndex];
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const chunks = JSON.parse(session.document.extractedChunks || '[]');
    const topics: string[] = JSON.parse(session.document.extractedTopics || '[]');
    let currentCoverageMatrix = session.topicsCovered ? JSON.parse(session.topicsCovered) : null;

    let expectedKeyPoints: string[] = [];
    try {
      expectedKeyPoints = JSON.parse(question.correctAnswer || '[]');
    } catch {
      expectedKeyPoints = [question.correctAnswer || question.explanation || 'Key concept'];
    }

    let evaluation: any;
    let nextQuestionMetadata: any = null;
    let isCompleted = false;
    let nextIndex = session.currentQuestionIndex + 1;
    let spokenFeedback = '';

    if (session.mode === 'INTERVIEW') {
      // Use Interview Manager adaptive turn progression
      const allPrevious = session.questions.map((q) => ({
        questionText: q.questionText,
        topic: q.topic,
        conceptBeingTested: q.explanation || q.topic,
      }));

      const turnResult = await processInterviewTurn(
        chunks,
        session.document.detectedSubject,
        {
          questionText: question.questionText,
          topic: question.topic,
          sourceContext: question.contextReference,
          conceptBeingTested: question.explanation || question.topic,
          expectedKeyPoints,
          difficulty: question.difficulty as any,
          questionType: question.questionType,
        },
        studentResponse,
        allPrevious,
        currentCoverageMatrix,
        session.currentQuestionIndex,
        session.questionCount,
        session.language as AppLanguage
      );

      evaluation = turnResult.evaluation;
      isCompleted = turnResult.isCompleted;
      nextIndex = turnResult.nextQuestionIndex;
      spokenFeedback = turnResult.combinedSpokenText;
      currentCoverageMatrix = turnResult.updatedCoverageMatrix;

      // If next question generated, persist it in the database
      if (turnResult.nextQuestion) {
        nextQuestionMetadata = turnResult.nextQuestion;
        await db.question.create({
          data: {
            sessionId: session.id,
            orderIndex: nextIndex,
            questionText: nextQuestionMetadata.question,
            topic: nextQuestionMetadata.topic,
            difficulty: nextQuestionMetadata.difficulty,
            questionType: nextQuestionMetadata.questionType,
            correctAnswer: JSON.stringify(nextQuestionMetadata.expectedKeyPoints),
            explanation: nextQuestionMetadata.conceptBeingTested,
            hint5Words: nextQuestionMetadata.hint5Words,
            fullHint: nextQuestionMetadata.fullHint,
            contextReference: nextQuestionMetadata.sourceContext,
          },
        });
      }
    } else {
      // EXAM or WEAK_COACH evaluation
      evaluation = await evaluateAnswerWithGroundTruth(
        question.questionText,
        question.contextReference,
        question.explanation || question.topic,
        expectedKeyPoints,
        studentResponse,
        question.difficulty as any,
        session.language as AppLanguage
      );

      isCompleted = nextIndex >= session.questions.length;
      spokenFeedback = isCompleted
        ? 'Session completed! All questions evaluated against the document source.'
        : `Answer recorded. Moving to Question ${nextIndex + 1}.`;
    }

    // Record answer
    await db.answer.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        studentResponse: studentResponse || '',
        evaluationScore: evaluation.scorePercent,
        classification: evaluation.classification === 'CORRECT' ? 'STRONG' : evaluation.classification === 'PARTIALLY_CORRECT' ? 'AVERAGE' : 'WEAK',
        feedback: evaluation.feedback,
        hintsUsed,
        interruptionsCount,
        timeTakenSeconds,
      },
    });

    // Update conversation
    await db.conversationMessage.createMany({
      data: [
        {
          sessionId: session.id,
          speaker: 'STUDENT',
          textContent: studentResponse,
          intent: 'STUDENT_ANSWER',
        },
        {
          sessionId: session.id,
          speaker: 'AI',
          textContent: spokenFeedback,
          intent: isCompleted ? 'COMPLETED' : 'NEXT_QUESTION',
        },
      ],
    });

    // Calculate rolling total score
    const allAnswers = await db.answer.findMany({ where: { sessionId: session.id } });
    const avgScore = allAnswers.length > 0
      ? allAnswers.reduce((sum, a) => sum + a.evaluationScore, 0) / allAnswers.length
      : evaluation.scorePercent;

    await db.session.update({
      where: { id: session.id },
      data: {
        currentQuestionIndex: isCompleted ? session.currentQuestionIndex : nextIndex,
        totalScore: Math.round(avgScore),
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        topicsCovered: currentCoverageMatrix ? JSON.stringify(currentCoverageMatrix) : undefined,
      },
    });

    // Fetch refreshed questions
    const updatedQuestions = await db.question.findMany({
      where: { sessionId: session.id },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      evaluation,
      isCompleted,
      nextQuestionIndex: nextIndex,
      aiMessageText: spokenFeedback,
      totalScore: Math.round(avgScore),
      questions: updatedQuestions,
    });
  } catch (error: any) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
