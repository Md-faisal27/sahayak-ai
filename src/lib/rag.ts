export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  text: string;
  topic: string;
  wordCount: number;
}

const NOISE_SUBSTRINGS = [
  'lecture note', 'syllabus', 'contents', 'table of content', 'topics to be covered',
  'university', 'college', 'department', 'polytechnic', 'author', 'mr. ', 'dr. ',
  'compiled by', 'page', 'copyright', 'all right', 'institute of', 'engineering & technology',
  'techni'
];

export function cleanTopicString(raw: string): string {
  if (!raw) return '';
  let cleaned = raw
    .replace(/[◼➢•\*\t\r]/g, ' ')
    .replace(/\([A-Z0-9\-\s]+\)/g, '') // remove course codes like (KCS-501)
    .replace(/^(unit|chapter|module|section|part)\s*[\d\.\-\:–—]+\s*/i, '')
    .replace(/^[\d\.\-\:–—\s\)]+/, '')
    .replace(/\b\d+\s*[-–—]\s*\d+\b/g, '') // remove page ranges like 11-24, 48-58
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing punctuation
  cleaned = cleaned.replace(/[\:\-\.\,\;\–\—]+$/, '').trim();

  const lower = cleaned.toLowerCase();

  // Reject if it contains any noise substrings
  for (const noise of NOISE_SUBSTRINGS) {
    if (lower.includes(noise)) {
      return '';
    }
  }

  // Reject bare meta words
  if (
    lower === 'introduction' ||
    lower === 'contents' ||
    lower === 'overview' ||
    lower === 'index' ||
    lower === 'preface' ||
    lower.startsWith('unit') ||
    lower.startsWith('chapter') ||
    lower.startsWith('module')
  ) {
    return '';
  }

  // Reject if it looks like a sentence fragment (more than 5 words)
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 5) {
    return '';
  }

  // Reject if too short or no alphabetic characters
  if (cleaned.length < 4 || !/[a-zA-Z]{3,}/.test(cleaned)) {
    return '';
  }

  // Normalize common split words
  cleaned = cleaned
    .replace(/\bDead\s+Locks\b/gi, 'Deadlocks')
    .replace(/\bData\s+Base\b/gi, 'Database');

  return cleaned;
}

export function chunkPdfText(fullText: string, chunkSizeWords: number = 400, overlapWords: number = 75): DocumentChunk[] {
  if (!fullText || fullText.trim().length === 0) return [];

  // Match words along with whitespace/newlines to retain structural formatting
  const tokens = fullText.split(/(\s+)/);
  const words: string[] = [];
  const tokenPairs: { word: string; separator: string }[] = [];

  for (let i = 0; i < tokens.length; i += 2) {
    const word = tokens[i];
    const sep = tokens[i + 1] || ' ';
    if (word && word.trim().length > 0) {
      words.push(word);
      tokenPairs.push({ word, separator: sep });
    }
  }

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < tokenPairs.length; i += (chunkSizeWords - overlapWords)) {
    const slice = tokenPairs.slice(i, i + chunkSizeWords);
    if (slice.length < 20 && chunks.length > 0) break; // Skip tiny trailing chunk

    const chunkText = slice.map(p => p.word + p.separator).join('').trim();
    
    // Extract genuine heading or top technical concept in chunk for topic label
    const lines = chunkText.split('\n').map(l => l.trim()).filter(Boolean);
    let topic = '';

    // First, search for clean heading-like lines
    for (const line of lines) {
      if (line.length >= 4 && line.length <= 65) {
        const cleaned = cleanTopicString(line);
        if (cleaned.length >= 4 && cleaned.length <= 50) {
          topic = cleaned;
          break;
        }
      }
    }

    // Fallback: search for prominent technical capitalized terms in chunk
    if (!topic) {
      const termMatches = chunkText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);
      if (termMatches) {
        for (const term of termMatches) {
          const cleaned = cleanTopicString(term);
          if (cleaned.length >= 4 && cleaned.length <= 40) {
            topic = cleaned;
            break;
          }
        }
      }
    }

    // Final fallback
    if (!topic) {
      topic = 'Core Technical Concepts';
    }

    chunks.push({
      id: `chunk_${chunkIndex + 1}`,
      chunkIndex: chunkIndex + 1,
      text: chunkText,
      topic,
      wordCount: slice.length
    });

    chunkIndex++;
  }

  return chunks;
}

export function retrieveRelevantChunks(
  chunks: DocumentChunk[],
  queryOrTopic: string,
  topK: number = 3
): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  const queryTerms = queryOrTopic
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK);
  }

  const scoredChunks = chunks.map(chunk => {
    const textLower = chunk.text.toLowerCase();
    const topicLower = chunk.topic.toLowerCase();
    let score = 0;

    queryTerms.forEach(term => {
      // Direct topic match boost
      if (topicLower.includes(term)) {
        score += 10;
      }
      
      // Term frequency count
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 2;
      }
    });

    return { chunk, score };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map(s => s.chunk);
}
