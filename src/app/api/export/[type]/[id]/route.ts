import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateQuestionListPdf, generateSummaryPdf, generateReportPdf } from '@/lib/pdf-generator';

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
        document: { select: { filename: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: { include: { question: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let pdfBuffer: Uint8Array;
    let filename = `sahayak_output.pdf`;

    if (type === 'questions') {
      pdfBuffer = generateQuestionListPdf(session.document.filename, session.questions);
      filename = `Questions_${session.document.filename.replace(/\.pdf$/i, '')}.pdf`;
    } else if (type === 'summary') {
      const summaryContent = session.writtenSummary || `Summary for ${session.document.filename}`;
      pdfBuffer = generateSummaryPdf(session.document.filename, summaryContent);
      filename = `Summary_${session.document.filename.replace(/\.pdf$/i, '')}.pdf`;
    } else if (type === 'report') {
      // Build topic maps
      const topicScores: Record<string, number[]> = {};
      session.answers.forEach((a) => {
        if (!topicScores[a.question.topic]) topicScores[a.question.topic] = [];
        topicScores[a.question.topic].push(a.evaluationScore);
      });

      const strongTopics: string[] = [];
      const averageTopics: string[] = [];
      const weakTopics: string[] = [];

      Object.entries(topicScores).forEach(([tName, scores]) => {
        const avg = Math.round(scores.reduce((x, y) => x + y, 0) / scores.length);
        if (avg >= 80) strongTopics.push(tName);
        else if (avg < 60) weakTopics.push(tName);
        else averageTopics.push(tName);
      });

      const totalScoreAvg =
        session.answers.length > 0
          ? Math.round(session.answers.reduce((acc, a) => acc + a.evaluationScore, 0) / session.answers.length)
          : 0;

      pdfBuffer = generateReportPdf({
        pdfName: session.document.filename,
        mode: session.mode,
        score: totalScoreAvg,
        date: session.createdAt.toLocaleDateString(),
        strongTopics: strongTopics.length ? strongTopics : ['Basic Principles'],
        averageTopics,
        weakTopics: weakTopics.length ? weakTopics : ['Advanced Concepts'],
        recommended: weakTopics.length ? weakTopics : ['Revise intermediate concepts'],
        answers: session.answers.map((a) => ({
          questionText: a.question.questionText,
          topic: a.question.topic,
          score: a.evaluationScore,
          classification: a.classification,
          studentResponse: a.studentResponse,
          hintsUsed: a.hintsUsed,
        })),
      });
      filename = `Report_${session.document.filename.replace(/\.pdf$/i, '')}.pdf`;
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    const uint8 = new Uint8Array(pdfBuffer);
    const pdfBlob = new Blob([uint8], { type: 'application/pdf' });

    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
