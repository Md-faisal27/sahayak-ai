import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateReportPdf, generateQuestionListPdf } from '@/lib/pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = params;

    const session = await db.session.findFirst({
      where: { id, userId: user.id },
      include: {
        document: true,
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (type === 'questions') {
      const pdfBytes = generateQuestionListPdf(
        session.document.filename,
        session.questions.map((q) => ({
          orderIndex: q.orderIndex,
          questionText: q.questionText,
          topic: q.topic,
          difficulty: q.difficulty,
          questionType: q.questionType,
        }))
      );

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Questions_${session.document.filename.replace(/\.pdf$/i, '')}.pdf"`,
        },
      });
    }

    // Default: 'report'
    const answers = session.answers || [];
    const strong = Array.from(new Set(answers.filter((a) => a.classification === 'STRONG').map((a) => {
      const q = session.questions.find((quest) => quest.id === a.questionId);
      return q?.topic || 'Core Concept';
    })));
    const average = Array.from(new Set(answers.filter((a) => a.classification === 'AVERAGE').map((a) => {
      const q = session.questions.find((quest) => quest.id === a.questionId);
      return q?.topic || 'Core Concept';
    })));
    const weak = Array.from(new Set(answers.filter((a) => a.classification === 'WEAK').map((a) => {
      const q = session.questions.find((quest) => quest.id === a.questionId);
      return q?.topic || 'Core Concept';
    })));

    const pdfBytes = generateReportPdf({
      pdfName: session.document.filename,
      mode: session.mode,
      score: Math.round(session.totalScore),
      date: new Date(session.createdAt).toLocaleDateString(),
      strongTopics: strong,
      averageTopics: average,
      weakTopics: weak,
      recommended: weak.length > 0 ? weak.map((w) => `Deep dive practice for "${w}"`) : ['Great mastery across all tested topics.'],
      answers: answers.map((a) => {
        const q = session.questions.find((quest) => quest.id === a.questionId);
        return {
          questionText: q?.questionText || 'Concept Question',
          topic: q?.topic || 'General',
          score: Math.round(a.evaluationScore),
          classification: a.classification,
          studentResponse: a.studentResponse,
          hintsUsed: a.hintsUsed,
        };
      }),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report_${session.document.filename.replace(/\.pdf$/i, '')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
