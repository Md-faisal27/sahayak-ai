import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
    const hasOpenai = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 5);
    const hasRime = Boolean(process.env.RIME_API_KEY && process.env.RIME_API_KEY.trim().length > 5);

    return NextResponse.json({
      hasGemini,
      hasOpenai,
      hasRime,
      activeProvider: hasGemini
        ? 'Google Gemini (2.0/1.5 Flash)'
        : hasOpenai
        ? 'OpenAI (GPT-4o mini)'
        : 'Offline Document Extractor',
      activeTts: hasRime ? 'Rime AI (Natural Conversational Voice)' : 'Text Mode / Fallback',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch AI status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { geminiKey, openaiKey, rimeKey } = body;

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (geminiKey !== undefined) {
      process.env.GEMINI_API_KEY = geminiKey.trim();
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY="${geminiKey.trim()}"`);
      } else {
        envContent += `\nGEMINI_API_KEY="${geminiKey.trim()}"\n`;
      }
    }

    if (openaiKey !== undefined) {
      process.env.OPENAI_API_KEY = openaiKey.trim();
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY="${openaiKey.trim()}"`);
      } else {
        envContent += `\nOPENAI_API_KEY="${openaiKey.trim()}"\n`;
      }
    }

    if (rimeKey !== undefined) {
      process.env.RIME_API_KEY = rimeKey.trim();
      if (envContent.includes('RIME_API_KEY=')) {
        envContent = envContent.replace(/RIME_API_KEY=.*/g, `RIME_API_KEY="${rimeKey.trim()}"`);
      } else {
        envContent += `\nRIME_API_KEY="${rimeKey.trim()}"\n`;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'AI and Voice API keys configured successfully.',
      hasGemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5),
      hasOpenai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 5),
      hasRime: Boolean(process.env.RIME_API_KEY && process.env.RIME_API_KEY.trim().length > 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update AI configuration' }, { status: 500 });
  }
}
