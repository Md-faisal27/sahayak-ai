import pdfParse from 'pdf-parse';
import { chunkPdfText, cleanTopicString, DocumentChunk } from './rag';

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface ProcessedPdf {
  extractedText: string;
  pageCount: number;
  detectedSubject: string;
  topics: string[];
  chunks: DocumentChunk[];
  cleanSummary: string;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ProcessedPdf> {
  try {
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text || '';
    
    // Clean text
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText || cleanText.length < 20) {
      throw new Error('This PDF does not contain readable text. Please upload a text-based PDF.');
    }

    const pageCount = pdfData.numpages || 1;

    // Detect Subject dynamically from text terms
    const detectedSubject = detectSubjectFromText(cleanText);

    // Extract headings & topics dynamically from document lines
    const lines = cleanText.split('\n');
    const topicCandidates = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.length >= 4 &&
        trimmed.length <= 60 &&
        !trimmed.endsWith('.') &&
        !/\b\d+\s*[-–]\s*\d+\b/.test(trimmed) // no page ranges
      ) {
        let cleaned = cleanTopicString(trimmed);
        if (cleaned.length >= 4 && cleaned.length <= 45) {
          // If all-caps, convert to Title Case for cleanliness
          if (cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
            cleaned = toTitleCase(cleaned);
          }
          topicCandidates.add(cleaned);
        }
      }
    }

    let topics = Array.from(topicCandidates).filter(t => t.length >= 4 && t.length <= 50);

    // Chunk text using intelligent RAG chunker
    const chunks = chunkPdfText(cleanText, 400, 75);

    // Complement topic list with clean chunk topics
    const chunkTopics = chunks
      .map(c => c.topic)
      .filter(t => t && t !== 'Core Technical Concepts' && !topics.includes(t));
    
    topics = Array.from(new Set([...topics, ...chunkTopics]));

    // Ultimate fallback if no headings were extracted
    if (topics.length === 0) {
      topics = [
        `${detectedSubject} Architecture & Foundations`,
        'Core Mechanisms & Protocols',
        'State Management & Operational Laws',
        'Performance Optimization & Practical Applications'
      ];
    } else {
      topics = topics.slice(0, 10);
    }

    const cleanSummary = cleanText.slice(0, 500) + '...';

    return {
      extractedText: cleanText,
      pageCount,
      detectedSubject,
      topics,
      chunks,
      cleanSummary
    };
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to extract text from PDF document.');
  }
}

function detectSubjectFromText(text: string): string {
  const t = text.toLowerCase();

  if (t.includes('operating system') || t.includes('process scheduling') || t.includes('deadlock') || t.includes('memory management') || t.includes('paging')) {
    return 'Operating Systems';
  }
  if (t.includes('database') || t.includes('sql') || t.includes('schema') || t.includes('relational') || t.includes('normalization')) {
    return 'Database Management Systems';
  }
  if (t.includes('network') || t.includes('tcp/ip') || t.includes('osi model') || t.includes('packet') || t.includes('protocol') || t.includes('router')) {
    return 'Computer Networks';
  }
  if (t.includes('quantum') || t.includes('thermodynamics') || t.includes('velocity') || t.includes('force') || t.includes('mass') || t.includes('physics')) {
    return 'Physics';
  }
  if (t.includes('algorithm') || t.includes('binary tree') || t.includes('graph') || t.includes('sorting') || t.includes('array') || t.includes('linked list')) {
    return 'Data Structures & Algorithms';
  }
  if (t.includes('html') || t.includes('javascript') || t.includes('css') || t.includes('http') || t.includes('frontend') || t.includes('api')) {
    return 'Web Development';
  }
  if (t.includes('organic') || t.includes('reaction') || t.includes('molecule') || t.includes('acid') || t.includes('chemistry')) {
    return 'Chemistry';
  }

  // Extract first prominent line/title as subject
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines[0] && lines[0].length < 50) {
    return lines[0].replace(/^[0-9\.\-\s]+/, '');
  }

  return 'General Study Subject';
}
