import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user topic progress records
    const topicProgresses = await db.topicProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Fetch completed session stats
    const sessions = await db.session.findMany({
      where: { userId: user.id },
      include: { answers: { select: { evaluationScore: true } } },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;

    let totalScoreSum = 0;
    let totalAnswers = 0;
    sessions.forEach((s) => {
      s.answers.forEach((a) => {
        totalScoreSum += a.evaluationScore;
        totalAnswers++;
      });
    });

    const overallAverageScore = totalAnswers > 0 ? Math.round(totalScoreSum / totalAnswers) : 0;

    // Categorize long-term topics
    const strongTopics = topicProgresses
      .filter((tp) => tp.classification === 'STRONG')
      .map((tp) => ({ name: tp.topicName, score: tp.latestScore, history: JSON.parse(tp.scoreHistory || '[]') }));

    const averageTopics = topicProgresses
      .filter((tp) => tp.classification === 'AVERAGE')
      .map((tp) => ({ name: tp.topicName, score: tp.latestScore, history: JSON.parse(tp.scoreHistory || '[]') }));

    const weakTopics = topicProgresses
      .filter((tp) => tp.classification === 'WEAK')
      .map((tp) => ({ name: tp.topicName, score: tp.latestScore, history: JSON.parse(tp.scoreHistory || '[]') }));

    return NextResponse.json({
      analytics: {
        totalSessions,
        completedSessions,
        overallAverageScore,
        totalQuestionsAnswered: totalAnswers,
        strongTopics,
        averageTopics,
        weakTopics,
        topicProgressList: topicProgresses.map((tp) => ({
          topicName: tp.topicName,
          attemptsCount: tp.attemptsCount,
          latestScore: tp.latestScore,
          classification: tp.classification,
          scoreHistory: JSON.parse(tp.scoreHistory || '[]'),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
