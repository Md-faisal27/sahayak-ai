import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            detectedSubject: true,
            extractedTopics: true,
            extractedChunks: true,
          },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        answers: {
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let topics: string[] = [];
    try {
      topics = JSON.parse(session.document.extractedTopics || '[]');
    } catch {
      topics = [];
    }

    let coverageMatrix = null;
    try {
      coverageMatrix = session.topicsCovered ? JSON.parse(session.topicsCovered) : null;
    } catch {
      coverageMatrix = null;
    }

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        language: session.language,
        difficulty: session.difficulty,
        totalScore: session.totalScore,
        questionCount: session.questionCount,
        currentQuestionIndex: session.currentQuestionIndex ?? 0,
        pdfName: session.document.filename,
        detectedSubject: session.document.detectedSubject,
        topics,
        coverageMatrix,
        weakTopicTarget: session.weakTopicTarget,
        questions: session.questions,
        answers: session.answers,
        messages: session.messages,
        createdAt: session.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db.session.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
