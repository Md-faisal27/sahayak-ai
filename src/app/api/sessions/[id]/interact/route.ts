import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleInterruptionResponse, parseInterruptionIntent, InterruptionIntent } from '@/lib/state-machine';
import { generateQuestionExample, generateQuestionSimplification } from '@/lib/ai';
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
    const { studentInput, directIntent, questionIndex = 0 } = body;

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentQuestion = session.questions[questionIndex] || session.questions[0];
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Determine intent from direct trigger or spoken transcript
    let intent: InterruptionIntent | null = directIntent || null;
    if (!intent && studentInput) {
      intent = parseInterruptionIntent(studentInput);
    }

    if (!intent) {
      return NextResponse.json({ isInterruption: false });
    }

    const interruptionResult = handleInterruptionResponse(
      intent,
      currentQuestion.questionText,
      currentQuestion.hint5Words || 'Core concept from document.',
      currentQuestion.fullHint || currentQuestion.explanation || 'Recall principles from the text.',
      currentQuestion.contextReference || ''
    );

    let responseText = interruptionResult.responseText;
    let nextState = interruptionResult.nextState;
    let incrementHintCount = interruptionResult.incrementHintCount;

    // Dynamically generate question-specific, PDF-grounded examples & simplifications
    if (intent === 'EXAMPLE') {
      responseText = await generateQuestionExample(
        currentQuestion.questionText,
        currentQuestion.topic,
        currentQuestion.explanation || '',
        currentQuestion.contextReference || '',
        (session.language as AppLanguage) || 'ENGLISH'
      );
      nextState = 'CLARIFYING';
    } else if (intent === 'SIMPLIFY') {
      responseText = await generateQuestionSimplification(
        currentQuestion.questionText,
        currentQuestion.topic,
        currentQuestion.explanation || '',
        currentQuestion.contextReference || '',
        (session.language as AppLanguage) || 'ENGLISH'
      );
      nextState = 'CLARIFYING';
    }

    // Record interaction in conversation
    await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        speaker: 'AI',
        textContent: responseText,
        intent,
      },
    });

    return NextResponse.json({
      isInterruption: true,
      intent,
      aiResponseText: responseText,
      nextState,
      incrementHintCount,
    });
  } catch (error: any) {
    console.error('Interruption handler failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process interruption' },
      { status: 500 }
    );
  }
}
