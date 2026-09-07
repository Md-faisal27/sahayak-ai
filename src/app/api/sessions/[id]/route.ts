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
      where: {
        id: params.id,
        userId: user.id, // Enforce authorization
      },
      include: {
        document: { select: { id: true, filename: true, pageCount: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: {
          include: { question: { select: { topic: true, questionText: true } } },
          orderBy: { createdAt: 'asc' },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found or unauthorized access.' }, { status: 404 });
    }

    // Calculate score
    const answersCount = session.answers.length;
    const scoreSum = session.answers.reduce((sum, a) => sum + a.evaluationScore, 0);
    const calculatedScore = answersCount > 0 ? Math.round(scoreSum / answersCount) : 0;

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        pdfName: session.document.filename,
        documentId: session.document.id,
        questionCount: session.questionCount,
        currentQuestionIndex: session.currentQuestionIndex,
        difficulty: session.difficulty,
        writtenSummary: session.writtenSummary,
        topicsCovered: JSON.parse(session.topicsCovered || '[]'),
        score: calculatedScore,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        questions: session.questions,
        answers: session.answers,
        messages: session.messages,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch session detail' }, { status: 500 });
  }
}
