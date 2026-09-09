import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateQuestionsFromPdfChunks } from '@/lib/ai';
import { generateComprehensivePdfSummary } from '@/lib/summary-generator';
import { generateSingleInterviewQuestion } from '@/lib/question-generator';
import { initializeTopicCoverage, recordTopicTested } from '@/lib/topic-extractor';
import { AppLanguage } from '@/lib/language';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      documentId,
      mode = 'EXAM',
      questionCount = 5,
      difficulty = 'Medium',
      language = 'ENGLISH',
    } = body;

    if (!['EXAM', 'INTERVIEW', 'SUMMARIZE', 'WEAK_COACH'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode selected.' }, { status: 400 });
    }

    const document = await db.pdfDocument.findFirst({
      where: { id: documentId, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or unauthorized.' }, { status: 404 });
    }

    const topics: string[] = JSON.parse(document.extractedTopics || '[]');
    const chunks = JSON.parse(document.extractedChunks || '[]');

    // Fetch existing questions for duplicate prevention across sessions
    const existingQuestions = await db.question.findMany({
      where: { session: { documentId: document.id, userId: user.id } },
      select: { questionText: true, topic: true },
    });
    const previousQuestionRecords = existingQuestions.map((q) => ({
      questionText: q.questionText,
      topic: q.topic,
    }));
    const previousTexts = existingQuestions.map((q) => q.questionText);

    let generatedQuestions: any[] = [];
    let writtenSummary: string | undefined = undefined;
    let initialCoverageMatrix = initializeTopicCoverage(topics);

    if (mode === 'INTERVIEW') {
      // 1. Interactive Interview Mode: Generate Question 1 adaptively
      const targetTopic = topics[0] || document.detectedSubject;
      const q1 = await generateSingleInterviewQuestion(
        chunks,
        document.detectedSubject,
        targetTopic,
        difficulty as 'Easy' | 'Medium' | 'Hard',
        previousQuestionRecords,
        language as AppLanguage
      );

      initialCoverageMatrix = recordTopicTested(
        initialCoverageMatrix,
        q1.topic,
        'core_concept'
      );

      generatedQuestions = [
        {
          orderIndex: 0,
          questionText: q1.question,
          topic: q1.topic,
          difficulty: q1.difficulty,
          questionType: q1.questionType,
          correctAnswer: JSON.stringify(q1.expectedKeyPoints),
          explanation: q1.conceptBeingTested,
          hint5Words: q1.hint5Words,
          fullHint: q1.fullHint,
          contextReference: q1.sourceContext,
        },
      ];
    } else if (mode === 'SUMMARIZE') {
      // 2. Comprehensive 12-Section PDF Summary
      writtenSummary = await generateComprehensivePdfSummary(
        chunks,
        document.detectedSubject,
        topics,
        language as AppLanguage
      );
    } else {
      // 3. Exam / Practice Question List
      const fullList = await generateQuestionsFromPdfChunks(
        chunks,
        document.detectedSubject,
        mode as any,
        Number(questionCount),
        difficulty,
        topics,
        previousTexts,
        language as AppLanguage
      );
      generatedQuestions = fullList.map((q, i) => ({
        orderIndex: i,
        questionText: q.questionText,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.questionType,
        mcqOptions: q.mcqOptions ? JSON.stringify(q.mcqOptions) : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint5Words: q.hint5Words,
        fullHint: q.fullHint,
        contextReference: q.contextReference,
      }));
    }

    // 4. Create Session in DB
    const session = await db.session.create({
      data: {
        userId: user.id,
        documentId: document.id,
        mode,
        status: 'IN_PROGRESS',
        language,
        questionCount: Number(questionCount),
        difficulty,
        writtenSummary,
        topicsCovered: JSON.stringify(initialCoverageMatrix),
        questions: {
          create: generatedQuestions.map((q) => ({
            orderIndex: q.orderIndex,
            questionText: q.questionText,
            topic: q.topic,
            difficulty: q.difficulty,
            questionType: q.questionType,
            mcqOptions: q.mcqOptions,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            hint5Words: q.hint5Words,
            fullHint: q.fullHint,
            contextReference: q.contextReference,
          })),
        },
      },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    // 5. Initial conversation message
    const firstQ = session.questions[0];
    let initialAiText = '';

    if (mode === 'SUMMARIZE') {
      initialAiText = `Study summary generated successfully.`;
    } else if (mode === 'INTERVIEW') {
      initialAiText = `Welcome to your technical interview. Let us begin with our first core concept. ${firstQ?.questionText}`;
    } else {
      initialAiText = `Practice exam initialized. Question 1: ${firstQ?.questionText}`;
    }

    await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        speaker: 'AI',
        textContent: initialAiText,
        intent: mode === 'SUMMARIZE' ? 'STATEMENT' : 'ASK_QUESTION',
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        language: session.language,
        pdfName: document.filename,
        detectedSubject: document.detectedSubject,
        questionCount: session.questionCount,
        difficulty: session.difficulty,
        writtenSummary: session.writtenSummary,
        topics,
        questions: session.questions,
        currentQuestionIndex: 0,
        coverageMatrix: initialCoverageMatrix,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to start session' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    const whereClause: any = { userId: user.id };
    if (mode && mode !== 'ALL') {
      whereClause.mode = mode;
    }

    const sessions = await db.session.findMany({
      where: whereClause,
      include: {
        document: { select: { filename: true, detectedSubject: true } },
        _count: { select: { questions: true, answers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        mode: s.mode,
        status: s.status,
        difficulty: s.difficulty,
        pdfName: s.document.filename,
        detectedSubject: s.document.detectedSubject,
        totalScore: s.totalScore,
        questionCount: s.questionCount,
        currentQuestionIndex: s.currentQuestionIndex ?? 0,
        answeredCount: s._count.answers,
        createdAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to list sessions' }, { status: 500 });
  }
}
