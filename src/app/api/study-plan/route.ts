import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateStudyPlanFromPdf } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let documentId = searchParams.get('documentId');

    let document;
    if (documentId) {
      document = await db.pdfDocument.findFirst({
        where: { id: documentId, userId: user.id },
      });
    } else {
      // Fallback: Fetch user's latest uploaded PDF document
      document = await db.pdfDocument.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!document) {
      return NextResponse.json(
        { error: 'No study document found. Please upload a PDF to generate your personalized study plan.' },
        { status: 404 }
      );
    }

    documentId = document.id;

    // Check if study plan already exists
    let planRecord = await db.studyPlan.findFirst({
      where: { userId: user.id, documentId },
    });

    if (!planRecord) {
      // Fetch user's topic progress for weak and strong topics
      const topicProgresses = await db.topicProgress.findMany({ where: { userId: user.id } });
      const weakTopics = topicProgresses.filter(t => t.classification === 'WEAK').map(t => t.topicName);
      const strongTopics = topicProgresses.filter(t => t.classification === 'STRONG').map(t => t.topicName);

      const chunks = JSON.parse(document.extractedChunks || '[]');
      const generatedPlan = await generateStudyPlanFromPdf(chunks, document.detectedSubject, weakTopics, strongTopics);

      planRecord = await db.studyPlan.create({
        data: {
          userId: user.id,
          documentId,
          planData: JSON.stringify(generatedPlan),
        },
      });
    }

    return NextResponse.json({
      studyPlan: {
        id: planRecord.id,
        documentId: planRecord.documentId,
        subject: document.detectedSubject,
        pdfName: document.filename,
        schedule: JSON.parse(planRecord.planData || '[]'),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch study plan' }, { status: 500 });
  }
}
