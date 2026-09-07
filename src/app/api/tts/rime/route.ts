import { NextRequest, NextResponse } from 'next/server';
import { generateRimeSpeech } from '@/lib/rime-tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required.' }, { status: 400 });
    }

    const start = Date.now();
    const ttsResult = await generateRimeSpeech(text);
    const latency = Date.now() - start;

    if (ttsResult.fallback || !ttsResult.audioBuffer) {
      return NextResponse.json({
        fallback: true,
        message: 'Rime voice temporarily unavailable; continuing in text mode.',
        error: ttsResult.error,
      });
    }

    const uint8 = new Uint8Array(ttsResult.audioBuffer);
    const blob = new Blob([uint8], { type: 'audio/mp3' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Length': uint8.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Rime-Model': process.env.RIME_MODEL || 'arcana',
        'X-Rime-Speaker': process.env.RIME_SPEAKER || 'astra',
        'X-Rime-Cached': ttsResult.cached ? 'true' : 'false',
        'X-Rime-Latency-Ms': latency.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      fallback: true,
      error: error?.message || 'TTS generation error',
    });
  }
}
