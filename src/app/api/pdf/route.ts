import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await db.pdfDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        detectedSubject: true,
        pageCount: true,
        fileSize: true,
        extractedTopics: true,
        createdAt: true,
      },
    });

    const formatted = documents.map((doc) => {
      let topics: string[] = [];
      try {
        topics = JSON.parse(doc.extractedTopics || '[]');
      } catch {
        topics = [];
      }
      return {
        id: doc.id,
        filename: doc.filename,
        detectedSubject: doc.detectedSubject,
        pageCount: doc.pageCount,
        fileSize: doc.fileSize,
        topics,
        createdAt: doc.createdAt,
      };
    });

    return NextResponse.json({ documents: formatted });
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch documents' }, { status: 500 });
  }
}
