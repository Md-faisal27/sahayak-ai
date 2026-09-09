import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await db.pdfDocument.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let topics: string[] = [];
    try {
      topics = JSON.parse(doc.extractedTopics || '[]');
    } catch {
      topics = [];
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        filename: doc.filename,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        detectedSubject: doc.detectedSubject,
        topics,
        extractedTopics: doc.extractedTopics,
        createdAt: doc.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching document details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await db.pdfDocument.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await db.pdfDocument.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
