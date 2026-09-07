import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateFlashcardsFromPdf } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    const regenerate = searchParams.get('regenerate') === 'true';

    // If no documentId is passed, find the user's latest uploaded PDF document
    let targetDocId = documentId;
    if (!targetDocId) {
      const latestDoc = await db.pdfDocument.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestDoc) {
        targetDocId = latestDoc.id;
      } else {
        return NextResponse.json({ flashcards: [], documents: [] });
      }
    }

    const document = await db.pdfDocument.findFirst({
      where: { id: targetDocId, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch all user documents for the selector dropdown
    const userDocs = await db.pdfDocument.findMany({
      where: { userId: user.id },
      select: { id: true, filename: true, detectedSubject: true, pageCount: true },
      orderBy: { createdAt: 'desc' },
    });

    // If regenerate requested, delete existing cards for this document
    if (regenerate) {
      await db.flashcard.deleteMany({
        where: { userId: user.id, documentId: targetDocId },
      });
    }

    // Fetch existing flashcards
    let flashcards = await db.flashcard.findMany({
      where: { userId: user.id, documentId: targetDocId },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-purge legacy corrupted cards containing "General Section" or page ranges
    if (flashcards.some(f => f.topic === 'General Section' || f.front.includes('General Section') || /\b\d+[-–]\d+\b/.test(f.topic))) {
      await db.flashcard.deleteMany({
        where: { userId: user.id, documentId: targetDocId },
      });
      flashcards = [];
    }

    // If no flashcards exist yet (or purged), generate them from document chunks using LLM
    if (flashcards.length === 0) {
      const chunks = JSON.parse(document.extractedChunks || '[]');
      const rawTopics = JSON.parse(document.extractedTopics || '[]');
      const generatedCards = await generateFlashcardsFromPdf(chunks, document.detectedSubject, 8, rawTopics);

      await db.flashcard.createMany({
        data: generatedCards.map((c) => ({
          userId: user.id,
          documentId: targetDocId,
          topic: c.topic,
          front: c.front,
          back: c.back,
        })),
      });

      flashcards = await db.flashcard.findMany({
        where: { userId: user.id, documentId: targetDocId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      flashcards,
      document: {
        id: document.id,
        filename: document.filename,
        detectedSubject: document.detectedSubject,
        topics: JSON.parse(document.extractedTopics || '[]'),
      },
      documents: userDocs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch flashcards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { flashcardId, known } = body;

    if (!flashcardId) {
      return NextResponse.json({ error: 'Flashcard ID is required.' }, { status: 400 });
    }

    const card = await db.flashcard.update({
      where: { id: flashcardId, userId: user.id },
      data: { known: Boolean(known) },
    });

    return NextResponse.json({ flashcard: card });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update flashcard' }, { status: 500 });
  }
}
