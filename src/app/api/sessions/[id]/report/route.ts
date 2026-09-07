import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        document: { select: { filename: true, detectedSubject: true, extractedTopics: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: {
          include: { question: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 1. Topic Performance Grouping
    const topicMap: Record<string, { scores: number[] }> = {};
    session.answers.forEach((ans) => {
      const tName = ans.question.topic;
      if (!topicMap[tName]) {
        topicMap[tName] = { scores: [] };
      }
      topicMap[tName].scores.push(ans.evaluationScore);
    });

    const strongTopics: string[] = [];
    const averageTopics: string[] = [];
    const weakTopics: string[] = [];

    Object.entries(topicMap).forEach(([tName, data]) => {
      const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      if (avg >= 80) strongTopics.push(tName);
      else if (avg < 60) weakTopics.push(tName);
      else averageTopics.push(tName);
    });

    // 2. Identify Untested / Undercovered Topics from Document
    let allDocTopics: string[] = [];
    try {
      allDocTopics = JSON.parse(session.document.extractedTopics || '[]');
    } catch (e) {
      allDocTopics = [];
    }
    const testedTopicNames = Object.keys(topicMap);
    const untestedTopics = allDocTopics.filter((t) => !testedTopicNames.includes(t));

    // 3. Difficulty Performance Breakdown
    const diffStats: Record<string, { totalScore: number; count: number }> = {
      Easy: { totalScore: 0, count: 0 },
      Medium: { totalScore: 0, count: 0 },
      Hard: { totalScore: 0, count: 0 },
    };

    let correctCount = 0;
    let partialCount = 0;
    let incorrectCount = 0;

    session.answers.forEach((ans) => {
      const diff = ans.question.difficulty || 'Medium';
      if (!diffStats[diff]) diffStats[diff] = { totalScore: 0, count: 0 };
      diffStats[diff].totalScore += ans.evaluationScore;
      diffStats[diff].count += 1;

      if (ans.evaluationScore >= 80) correctCount++;
      else if (ans.evaluationScore >= 50) partialCount++;
      else incorrectCount++;
    });

    const difficultyPerformance = Object.entries(diffStats)
      .filter(([, stat]) => stat.count > 0)
      .map(([level, stat]) => ({
        difficulty: level,
        questionsCount: stat.count,
        averageScore: Math.round(stat.totalScore / stat.count),
      }));

    // 4. Overall Score calculation
    const totalScoreAvg =
      session.answers.length > 0
        ? Math.round(session.answers.reduce((acc, a) => acc + a.evaluationScore, 0) / session.answers.length)
        : 0;
    const scoreOutOf10 = Number((totalScoreAvg / 10).toFixed(1));

    // 5. Prioritized "Topics to Revise"
    const topicsToRevise: Array<{
      topic: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      reason: string;
      recommendation: string;
    }> = [];

    // High Priority: Weak topics tested with low score
    weakTopics.forEach((t) => {
      topicsToRevise.push({
        topic: t,
        priority: 'HIGH',
        reason: 'Scored below 60% during grounded interview questioning.',
        recommendation: 'Re-read definitions and fundamental mechanisms in the PDF summary before retrying.',
      });
    });

    // Medium Priority: Average topics or completely untested topics
    averageTopics.forEach((t) => {
      topicsToRevise.push({
        topic: t,
        priority: 'MEDIUM',
        reason: 'Partial conceptual grasp with some missing points.',
        recommendation: 'Practice active recall flashcards to solidify operational details and edge cases.',
      });
    });

    untestedTopics.slice(0, 3).forEach((t) => {
      topicsToRevise.push({
        topic: t,
        priority: 'LOW',
        reason: 'Core syllabus topic not covered in this session.',
        recommendation: 'Complete a targeted practice exam focusing on this module.',
      });
    });

    // 6. Comprehensive Answers Breakdown
    const answersBreakdown = session.answers.map((a) => {
      let expectedPoints: string[] = [];
      try {
        if (a.question.correctAnswer) {
          const parsed = JSON.parse(a.question.correctAnswer);
          if (Array.isArray(parsed)) expectedPoints = parsed;
        }
      } catch (e) {
        expectedPoints = [a.question.correctAnswer || a.question.topic];
      }

      return {
        questionOrder: a.question.orderIndex,
        questionText: a.question.questionText,
        topic: a.question.topic,
        difficulty: a.question.difficulty,
        questionType: a.question.questionType,
        conceptBeingTested: a.question.explanation || a.question.topic,
        sourceContext: a.question.contextReference,
        expectedKeyPoints: expectedPoints,
        studentResponse: a.studentResponse,
        score: a.evaluationScore,
        scoreOutOf10: Math.round(a.evaluationScore / 10),
        classification: a.classification,
        feedback: a.feedback,
        hintsUsed: a.hintsUsed,
      };
    });

    return NextResponse.json({
      report: {
        sessionId: session.id,
        pdfName: session.document.filename,
        detectedSubject: session.document.detectedSubject,
        mode: session.mode,
        status: session.status,
        overallScore: totalScoreAvg,
        scoreOutOf10,
        date: session.createdAt.toLocaleDateString(),
        totalQuestions: session.questionCount || session.questions.length,
        answeredCount: session.answers.length,
        correctCount,
        partialCount,
        incorrectCount,
        strongTopics,
        averageTopics,
        weakTopics,
        untestedTopics,
        difficultyPerformance,
        topicsToRevise,
        answersBreakdown,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch report' }, { status: 500 });
  }
}
