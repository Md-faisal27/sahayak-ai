import crypto from 'crypto';

export interface RimeTtsResponse {
  audioBuffer?: Buffer;
  mimeType?: string;
  fallback: boolean;
  cached?: boolean;
  error?: string;
}

// In-memory audio cache for low latency and zero duplicate Rime requests
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100;

/**
 * Preprocess text for natural conversational Text-to-Speech delivery:
 * 1. Removes markdown syntax (#, **, *, _, backticks, blockquotes)
 * 2. Removes raw bullet point characters
 * 3. Translates common mathematical/algorithmic expressions into speakable English
 * 4. Normalizes technical terms and numbers with natural pauses
 */
export function preprocessTextForTTS(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' [code snippet omitted] ');

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italics
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // Convert bullet points into natural pauses
  text = text.replace(/^\s*[-*•]\s+/gm, ' ');

  // Remove JSON blocks if accidentally included
  text = text.replace(/\{[\s\S]*?\}/g, '');

  // Convert common formula and math symbols into spoken words
  text = text.replace(/\bO\((.*?)\)/g, 'Big O of $1');
  text = text.replace(/&rarr;|->/g, ' implies ');
  text = text.replace(/&pi;|\\pi|π/g, 'projection');
  text = text.replace(/&sigma;|\\sigma|σ/g, 'selection');
  text = text.replace(/!=|≠/g, ' is not equal to ');
  text = text.replace(/<=|≤/g, ' is less than or equal to ');
  text = text.replace(/>=|≥/g, ' is greater than or equal to ');
  text = text.replace(/==|===/g, ' equals ');

  // Remove excessive whitespace & clean line breaks into natural pauses
  text = text.replace(/\r\n/g, ' ');
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\s{2,}/g, ' ');

  // Ensure natural trailing punctuation
  text = text.trim();
  if (text.length > 0 && !/[.?!]$/.test(text)) {
    text += '.';
  }

  return text;
}

/**
 * Generate speech audio using Rime AI TTS API
 */
export async function generateRimeSpeech(text: string): Promise<RimeTtsResponse> {
  const rimeKey = process.env.RIME_API_KEY;

  if (!rimeKey || rimeKey.trim() === '') {
    return { fallback: true, error: 'RIME_API_KEY not configured' };
  }

  const cleanText = preprocessTextForTTS(text);
  if (!cleanText || cleanText.length < 2) {
    return { fallback: true, error: 'Empty text for TTS' };
  }

  const configuredModel = process.env.RIME_MODEL || 'arcana';
  const defaultSpeaker = configuredModel === 'arcana' ? 'astra' : 'marsh';
  const configuredSpeaker = process.env.RIME_SPEAKER || defaultSpeaker;

  // Check in-memory cache
  const cacheKey = crypto
    .createHash('md5')
    .update(`${configuredModel}:${configuredSpeaker}:${cleanText}`)
    .digest('hex');

  if (audioCache.has(cacheKey)) {
    return {
      audioBuffer: audioCache.get(cacheKey),
      mimeType: 'audio/mp3',
      fallback: false,
      cached: true,
    };
  }

  // Model-speaker pairs to try in order
  const attempts = [
    { modelId: configuredModel, speaker: configuredSpeaker },
    { modelId: 'arcana', speaker: 'astra' },
    { modelId: 'mist', speaker: 'marsh' },
  ];

  for (const pair of attempts) {
    try {
      const res = await fetch('https://users.rime.ai/v1/rime-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rimeKey.trim()}`,
          Accept: 'audio/mp3',
        },
        body: JSON.stringify({
          speaker: pair.speaker,
          text: cleanText.slice(0, 1500),
          modelId: pair.modelId,
          speedAlpha: 1.0,
        }),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save to cache with eviction
        if (audioCache.size >= MAX_CACHE_SIZE) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, buffer);

        return {
          audioBuffer: buffer,
          mimeType: 'audio/mp3',
          fallback: false,
          cached: false,
        };
      }
    } catch (error: any) {
      console.warn(`Rime TTS attempt failed with model ${pair.modelId}:`, error?.message);
    }
  }

  return { fallback: true, error: 'Rime TTS request failed on all compatible models' };
}
