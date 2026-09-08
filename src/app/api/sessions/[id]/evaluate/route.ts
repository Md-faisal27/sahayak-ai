import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { evaluateStudentAnswer } from '@/lib/ai';
import { processInterviewTurn } from '@/lib/interview-manager';
import { AppLanguage } from '@/lib/language';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required.' }, { status: 400 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        document: {
          select: {
            filename: true,
            detectedSubject: true,
            extractedChunks: true,
            extractedTopics: true,
          },
        },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found in session' }, { status: 400 });
    }

    const sessionLang = (session.language as AppLanguage) || 'ENGLISH';
    const chunks = JSON.parse(session.document.extractedChunks || '[]');

    let evalScore = 70;
    let evalClassif = 'AVERAGE';
    let evalFeedback = 'Good response.';
    let evalSpokenText = '';
    let isCompleted = false;
    let nextQuestionRecord: any = null;
    let nextQuestionIndex = session.currentQuestionIndex + 1;
    let detailedEvaluation: any = null;

    if (session.mode === 'INTERVIEW') {
      // Parse expected key points from question record
      let expectedPoints: string[] = [];
      try {
        if (question.correctAnswer) {
          const parsed = JSON.parse(question.correctAnswer);
          if (Array.isArray(parsed)) expectedPoints = parsed;
        }
      } catch (e) {
        expectedPoints = [question.correctAnswer || question.topic];
      }
      if (expectedPoints.length === 0) {
        expectedPoints = [question.explanation || question.topic];
      }

      // Collate all previous questions for deduplication
      const allPrevious = session.questions.map((q) => ({
        questionText: q.questionText,
        conceptBeingTested: q.explanation || q.topic,
        topic: q.topic,
      }));

      // Current coverage matrix
      let coverageMatrix: any = {};
      try {
        coverageMatrix = JSON.parse(session.topicsCovered || '{}');
      } catch (e) {
        coverageMatrix = {};
      }

      // Process complete interview turn with adaptive evaluation & question generation
      const turnResult = await processInterviewTurn(
        chunks,
        session.document.detectedSubject,
        {
          questionText: question.questionText,
          topic: question.topic,
          sourceContext: question.contextReference,
          conceptBeingTested: question.explanation || question.topic,
          expectedKeyPoints: expectedPoints,
          difficulty: question.difficulty as 'Easy' | 'Medium' | 'Hard',
          questionType: question.questionType,
        },
        studentResponse || '',
        allPrevious,
        coverageMatrix,
        session.currentQuestionIndex,
        session.questionCount,
        sessionLang
      );

      evalScore = turnResult.evaluation.scorePercent;
      evalClassif =
        turnResult.evaluation.classification === 'CORRECT'
          ? 'STRONG'
          : turnResult.evaluation.classification === 'PARTIALLY_CORRECT'
          ? 'AVERAGE'
          : 'WEAK';
      evalFeedback = turnResult.evaluation.feedback;
      evalSpokenText = turnResult.combinedSpokenText;
      isCompleted = turnResult.isCompleted;
      detailedEvaluation = turnResult.evaluation;

      // If next question generated on-the-fly, create it in DB
      if (!isCompleted && turnResult.nextQuestion) {
        const nq = turnResult.nextQuestion;
        nextQuestionRecord = await db.question.create({
          data: {
            sessionId: session.id,
            orderIndex: nextQuestionIndex,
            questionText: nq.question,
            topic: nq.topic,
            difficulty: nq.difficulty,
            questionType: nq.questionType,
            correctAnswer: JSON.stringify(nq.expectedKeyPoints),
            explanation: nq.conceptBeingTested,
            hint5Words: nq.hint5Words,
            fullHint: nq.fullHint,
            contextReference: nq.sourceContext,
          },
        });
      }

      // Update session topicsCovered matrix
      await db.session.update({
        where: { id: session.id },
        data: {
          topicsCovered: JSON.stringify(turnResult.updatedCoverageMatrix),
        },
      });
    } else {
      // Non-interview (Standard Practice Exam) evaluation
      const standardEval = await evaluateStudentAnswer(
        question.questionText,
        question.contextReference,
        studentResponse || '',
        hintsUsed,
        interruptionsCount,
        sessionLang
      );

      evalScore = standardEval.score;
      evalClassif = standardEval.classification;
      isCompleted = nextQuestionIndex >= session.questions.length;
      nextQuestionRecord = !isCompleted ? session.questions[nextQuestionIndex] || null : null;

      if (session.mode === 'WEAK_COACH') {
        const coachFeedback = standardEval.feedback || (evalClassif === 'STRONG' ? 'Excellent explanation.' : 'Good effort on that concept.');
        evalSpokenText = isCompleted || !nextQuestionRecord
          ? `Coaching session complete. ${coachFeedback} You have completed your targeted mastery practice on ${question.topic}.`
          : `${coachFeedback} Moving to coaching step ${nextQuestionIndex + 1}: ${nextQuestionRecord.questionText}`;
      } else {
        evalSpokenText = isCompleted || !nextQuestionRecord
          ? 'You have completed all questions for this exam.'
          : `Answer recorded. Question ${nextQuestionIndex + 1}: ${nextQuestionRecord.questionText}`;
      }

      detailedEvaluation = {
        scoreOutOf10: Math.round(standardEval.score / 10),
        scorePercent: standardEval.score,
        classification: standardEval.classification === 'STRONG' ? 'CORRECT' : standardEval.classification === 'AVERAGE' ? 'PARTIALLY_CORRECT' : 'INCORRECT',
        feedback: standardEval.feedback,
        pointsMentioned: [],
        missingPoints: [],
        expectedKeyPoints: [question.explanation || question.topic],
        spokenFeedback: standardEval.feedback,
      };
    }

    // 1. Save Answer in DB
    const answerRecord = await db.answer.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        studentResponse: studentResponse || '[No response provided]',
        evaluationScore: evalScore,
        classification: evalClassif,
        feedback: evalFeedback,
        hintsUsed,
        interruptionsCount,
        timeTakenSeconds,
      },
    });

    // 2. Mistake Memory Tracking
    if (evalClassif === 'WEAK' || evalScore < 55) {
      const existingMistake = await db.mistakeRecord.findFirst({
        where: {
          userId: user.id,
          topic: question.topic,
          questionText: question.questionText,
        },
      });

      if (existingMistake) {
        await db.mistakeRecord.update({
          where: { id: existingMistake.id },
          data: {
            failCount: existingMistake.failCount + 1,
            wrongAnswer: studentResponse || 'Incomplete explanation',
            resolved: false,
          },
        });
      } else {
        await db.mistakeRecord.create({
          data: {
            userId: user.id,
            topic: question.topic,
            questionText: question.questionText,
            wrongAnswer: studentResponse || 'Incomplete explanation',
            correctConcept: question.explanation || question.fullHint,
            failCount: 1,
            resolved: false,
          },
        });
      }
    }

    // 3. Update Long-Term Topic Progress
    const existingProgress = await db.topicProgress.findUnique({
      where: {
        userId_topicName: {
          userId: user.id,
          topicName: question.topic,
        },
      },
    });

    if (existingProgress) {
      const historyArr: number[] = JSON.parse(existingProgress.scoreHistory || '[]');
      historyArr.push(evalScore);
      const avgScore = Math.round(historyArr.reduce((a, b) => a + b, 0) / historyArr.length);

      let topicClassif = 'AVERAGE';
      if (avgScore >= 80) topicClassif = 'STRONG';
      else if (avgScore < 55) topicClassif = 'WEAK';

      await db.topicProgress.update({
        where: { id: existingProgress.id },
        data: {
          scoreHistory: JSON.stringify(historyArr),
          attemptsCount: existingProgress.attemptsCount + 1,
          latestScore: evalScore,
          classification: topicClassif,
        },
      });
    } else {
      let topicClassif = 'AVERAGE';
      if (evalScore >= 80) topicClassif = 'STRONG';
      else if (evalScore < 55) topicClassif = 'WEAK';

      await db.topicProgress.create({
        data: {
          userId: user.id,
          topicName: question.topic,
          scoreHistory: JSON.stringify([evalScore]),
          attemptsCount: 1,
          latestScore: evalScore,
          classification: topicClassif,
        },
      });
    }

    // 4. Update Session Progress
    const allAnswers = [...session.answers, answerRecord];
    const totalScoreAvg = Math.round(
      allAnswers.reduce((sum, a) => sum + a.evaluationScore, 0) / allAnswers.length
    );

    await db.session.update({
      where: { id: session.id },
      data: {
        currentQuestionIndex: nextQuestionIndex,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        totalScore: totalScoreAvg,
      },
    });

    // 5. Create conversation message
    await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        speaker: 'AI',
        textContent: evalSpokenText,
        intent: isCompleted ? 'COMPLETED' : 'NEXT_QUESTION',
      },
    });

    return NextResponse.json({
      evaluation: detailedEvaluation,
      isCompleted,
      nextQuestionIndex,
      nextQuestion: nextQuestionRecord,
      aiMessageText: evalSpokenText,
      totalScoreAvg,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to evaluate answer' }, { status: 500 });
  }
}
