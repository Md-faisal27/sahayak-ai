import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AppLanguage } from '@/lib/language';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { language } = body;

    if (!['ENGLISH', 'HINDI', 'HINGLISH'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language option' }, { status: 400 });
    }

    const session = await db.session.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db.session.update({
      where: { id: params.id },
      data: { language },
    });

    return NextResponse.json({ success: true, language });
  } catch (error: any) {
    console.error('Update language error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update language' },
      { status: 500 }
    );
  }
}
