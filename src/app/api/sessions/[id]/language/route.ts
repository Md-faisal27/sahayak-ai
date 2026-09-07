import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AppLanguage } from '@/lib/language';

import { callLLM } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { language, questionIndex } = body as { language: AppLanguage; questionIndex?: number };

    if (!language || !['ENGLISH', 'HINDI', 'HINGLISH'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language selected.' }, { status: 400 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db.session.update({
      where: { id: session.id },
      data: { language },
    });

    const qIdx = typeof questionIndex === 'number' ? questionIndex : session.currentQuestionIndex;
    const activeQuestion = session.questions?.[qIdx] || null;

    let translatedQuestion = activeQuestion?.questionText || '';
    if (activeQuestion && language !== 'ENGLISH') {
      try {
        const translatePrompt =
          language === 'HINDI'
            ? `Translate this technical computer science exam question into natural Hindi for spoken voice delivery (Devanagari script). Return ONLY the translated question without prefixes or quotation marks:\n"${activeQuestion.questionText}"`
            : `Rephrase this technical computer science exam question into natural, conversational Hinglish (Hindi mixed with English technical terms in Roman script). Return ONLY the rephrased question without prefixes or quotation marks:\n"${activeQuestion.questionText}"`;

        const translated = await callLLM(translatePrompt, 'You are a bilingual technical educator.');
        if (translated && translated.trim()) {
          translatedQuestion = translated.trim().replace(/^["']|["']$/g, '');
        }
      } catch (e) {}
    }

    let confirmMsg = '';
    if (language === 'HINDI') {
      confirmMsg = activeQuestion
        ? `भाषा हिंदी में सेट कर दी गई है। सवाल ${qIdx + 1}: ${translatedQuestion}`
        : 'भाषा हिंदी में सेट कर दी गई है। चलिए जारी रखते हैं।';
    } else if (language === 'HINGLISH') {
      confirmMsg = activeQuestion
        ? `Language Hinglish mein set ho gayi hai. Question ${qIdx + 1}: ${translatedQuestion}`
        : `Language Hinglish mein set ho gayi hai. Let's continue!`;
    } else {
      confirmMsg = activeQuestion
        ? `Language set to English. Question ${qIdx + 1}: ${activeQuestion.questionText}`
        : `Language set to English. Let's continue.`;
    }

    await db.conversationMessage.create({
      data: {
        sessionId: session.id,
        speaker: 'AI',
        textContent: confirmMsg,
        intent: `SWITCH_${language}`,
      },
    });

    return NextResponse.json({
      language,
      confirmMsg,
      translatedQuestion: translatedQuestion || activeQuestion?.questionText,
      questionIndex: qIdx,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to switch language' }, { status: 500 });
  }
}
