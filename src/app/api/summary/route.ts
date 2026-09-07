import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateComprehensivePdfSummary } from '@/lib/summary-generator';
import { AppLanguage } from '@/lib/language';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    const autoGenerate = searchParams.get('autoGenerate') === 'true';

    // Fetch user documents for selector
    const userDocs = await db.pdfDocument.findMany({
      where: { userId: user.id },
      select: { id: true, filename: true, detectedSubject: true, pageCount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userDocs.length === 0) {
      return NextResponse.json({ summary: null, document: null, documents: [] });
    }

    const targetDocId = documentId || userDocs[0].id;
    const document = await db.pdfDocument.findFirst({
      where: { id: targetDocId, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Look for existing SUMMARIZE session with writtenSummary
    const existingSession = await db.session.findFirst({
      where: {
        documentId: targetDocId,
        userId: user.id,
        mode: 'SUMMARIZE',
        writtenSummary: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSession && existingSession.writtenSummary) {
      const isCorrupted = 
        existingSession.writtenSummary.includes('Case Study A') ||
        existingSession.writtenSummary.includes('NMIET') ||
        existingSession.writtenSummary.includes('LECTURE NOTES');

      if (!isCorrupted) {
        return NextResponse.json({
          summary: existingSession.writtenSummary,
          sessionId: existingSession.id,
          document: {
            id: document.id,
            filename: document.filename,
            detectedSubject: document.detectedSubject,
            pageCount: document.pageCount,
          },
          documents: userDocs,
        });
      }
    }

    // If autoGenerate requested and no summary exists yet, generate it now
    if (autoGenerate) {
      const chunks = JSON.parse(document.extractedChunks || '[]');
      const topics = JSON.parse(document.extractedTopics || '[]');

      const summary = await generateComprehensivePdfSummary(
        chunks,
        document.detectedSubject,
        topics,
        'ENGLISH'
      );

      const session = await db.session.create({
        data: {
          userId: user.id,
          documentId: document.id,
          mode: 'SUMMARIZE',
          status: 'COMPLETED',
          language: 'ENGLISH',
          questionCount: 0,
          difficulty: 'Medium',
          writtenSummary: summary,
          topicsCovered: JSON.stringify({}),
        },
      });

      return NextResponse.json({
        summary,
        sessionId: session.id,
        document: {
          id: document.id,
          filename: document.filename,
          detectedSubject: document.detectedSubject,
          pageCount: document.pageCount,
        },
        documents: userDocs,
      });
    }

    return NextResponse.json({
      summary: null,
      sessionId: null,
      document: {
        id: document.id,
        filename: document.filename,
        detectedSubject: document.detectedSubject,
        pageCount: document.pageCount,
      },
      documents: userDocs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch summary' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, language = 'ENGLISH' } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = await db.pdfDocument.findFirst({
      where: { id: documentId, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const chunks = JSON.parse(document.extractedChunks || '[]');
    const topics = JSON.parse(document.extractedTopics || '[]');

    const summary = await generateComprehensivePdfSummary(
      chunks,
      document.detectedSubject,
      topics,
      language as AppLanguage
    );

    const session = await db.session.create({
      data: {
        userId: user.id,
        documentId: document.id,
        mode: 'SUMMARIZE',
        status: 'COMPLETED',
        language,
        questionCount: 0,
        difficulty: 'Medium',
        writtenSummary: summary,
        topicsCovered: JSON.stringify({}),
      },
    });

    return NextResponse.json({
      summary,
      sessionId: session.id,
      document: {
        id: document.id,
        filename: document.filename,
        detectedSubject: document.detectedSubject,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate summary' }, { status: 500 });
  }
}
