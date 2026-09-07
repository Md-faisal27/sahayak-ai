import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await db.pdfDocument.findFirst({
      where: {
        id: params.id,
        userId: user.id, // User data isolation
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or unauthorized access.' }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        pageCount: document.pageCount,
        fileSize: document.fileSize,
        topics: JSON.parse(document.extractedTopics || '[]'),
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch document' }, { status: 500 });
  }
}
