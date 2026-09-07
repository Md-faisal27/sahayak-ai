import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateQuestionsFromPdfChunks } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topicName, documentId } = body;

    if (!topicName) {
      return NextResponse.json({ error: 'Target topic name is required.' }, { status: 400 });
    }

    // Find document matching target topic or latest uploaded PDF
    let document = documentId
      ? await db.pdfDocument.findFirst({ where: { id: documentId, userId: user.id } })
      : await db.pdfDocument.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });

    if (!document) {
      return NextResponse.json({ error: 'No study document found. Please upload a PDF first.' }, { status: 404 });
    }

    const chunks = JSON.parse(document.extractedChunks || '[]');

    // Generate 3 coaching questions (Easy, Medium, Hard) specifically targeted at topic
    const easyQ = await generateQuestionsFromPdfChunks(chunks, document.detectedSubject, 'WEAK_COACH', 1, 'Easy', [topicName]);
    const mediumQ = await generateQuestionsFromPdfChunks(chunks, document.detectedSubject, 'WEAK_COACH', 1, 'Medium', [topicName], [easyQ[0]?.questionText || '']);
    const hardQ = await generateQuestionsFromPdfChunks(chunks, document.detectedSubject, 'WEAK_COACH', 1, 'Hard', [topicName], [easyQ[0]?.questionText || '', mediumQ[0]?.questionText || '']);

    const coachingQuestions = [...easyQ, ...mediumQ, ...hardQ];

    const session = await db.session.create({
      data: {
        userId: user.id,
        documentId: document.id,
        mode: 'WEAK_COACH',
        status: 'IN_PROGRESS',
        weakTopicTarget: topicName,
        questionCount: coachingQuestions.length,
        difficulty: 'Adaptive',
        topicsCovered: JSON.stringify([topicName]),
        questions: {
          create: coachingQuestions.map((q, idx) => ({
            orderIndex: idx,
            questionText: q.questionText,
            topic: topicName,
            difficulty: q.difficulty,
            questionType: q.questionType,
            hint5Words: q.hint5Words,
            fullHint: q.fullHint,
            contextReference: q.contextReference,
          })),
        },
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    const initialWelcome = `Welcome to targeted Weak Topic Coach for "${topicName}". Let's start with an Easy warm-up question: ${session.questions[0]?.questionText}`;
    
    await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        speaker: 'AI',
        textContent: initialWelcome,
        intent: 'WEAK_COACH_START',
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        weakTopicTarget: session.weakTopicTarget,
        pdfName: document.filename,
        questions: session.questions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to start weak coach session' }, { status: 500 });
  }
}
