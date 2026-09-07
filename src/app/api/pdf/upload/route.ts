import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parsePdfBuffer } from '@/lib/pdf-parser';
import { db } from '@/lib/db';
import { analyzePdfText } from '@/lib/pdf-analyzer';
import { cleanTopicString } from '@/lib/rag';
import { uploadPdfToStorage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a standard text-based PDF document.' },
        { status: 400 }
      );
    }

    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 30MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract text and initial RAG chunks
    const { extractedText, pageCount, detectedSubject, topics, chunks } = await parsePdfBuffer(buffer);

    // Validate readable text content
    const alphanumericCount = (extractedText.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount < 50) {
      return NextResponse.json(
        {
          error:
            'This PDF appears to be a scanned image, blank, or contains non-extractable text. Please upload a PDF with selectable digital text.',
        },
        { status: 422 }
      );
    }

    // 2. Intelligent PDF Analysis: Extract core concepts, principles, formulas, and topic map
    let finalTopics = Array.from(new Set(topics.map(cleanTopicString).filter(Boolean)));
    try {
      const analysis = await analyzePdfText(extractedText, detectedSubject, chunks);
      if (analysis.topicNames && analysis.topicNames.length >= 2) {
        finalTopics = analysis.topicNames;
      }
    } catch (e) {
      console.warn('PDF analysis fallback to heuristic topics:', e);
    }

    if (finalTopics.length === 0) {
      finalTopics = [`${detectedSubject} Foundations`, 'Core Operational Principles', 'System Architecture'];
    }

    // 3. Create the document record in Prisma (source of truth for metadata)
    const document = await db.pdfDocument.create({
      data: {
        userId: user.id,
        filename: file.name,
        fileSize: file.size,
        pageCount,
        detectedSubject,
        extractedText,
        extractedTopics: JSON.stringify(finalTopics),
        extractedChunks: JSON.stringify(chunks),
      },
    });

    // 4. Upload the raw PDF file to Supabase Storage
    try {
      const storageResult = await uploadPdfToStorage(user.id, document.id, buffer, file.name);
      await db.pdfDocument.update({
        where: { id: document.id },
        data: { storagePath: storageResult.storagePath },
      });
    } catch (storageError: any) {
      console.error('Supabase Storage upload failed:', storageError);
      // Don't fail the whole request — the extracted text/chunks are already saved.
      // The user can still use the app; the raw file just won't be downloadable.
    }

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        pageCount: document.pageCount,
        fileSize: document.fileSize,
        detectedSubject: document.detectedSubject,
        topics: finalTopics,
        chunkCount: chunks.length,
        createdAt: document.createdAt,
      },
      message: 'PDF analyzed, core topics indexed, and knowledge base prepared successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Something went wrong while processing your PDF. Please try again.' },
      { status: 500 }
    );
  }
}