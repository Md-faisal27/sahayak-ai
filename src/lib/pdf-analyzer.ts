import { DocumentChunk, cleanTopicString } from './rag';
import { callLLM } from './ai';

export interface ConceptItem {
  name: string;
  category: 'definition' | 'core_principle' | 'formula' | 'example' | 'technical_term' | 'relationship';
  summary: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isTestable: boolean;
  topic: string;
}

export interface TopicStructure {
  name: string;
  subtopics: string[];
  coreConcepts: string[];
  definitions: string[];
  formulas: string[];
  keyTerms: string[];
  difficultConcepts: string[];
  testableConcepts: string[];
}

export interface PdfAnalysisResult {
  detectedSubject: string;
  overview: string;
  topics: TopicStructure[];
  topicNames: string[];
  allKeyTerms: string[];
  allFormulas: string[];
  coreConcepts: ConceptItem[];
}

/**
 * Intelligent PDF Analysis:
 * Extracts structured concepts, definitions, principles, formulas, relationships,
 * and testable topics strictly grounded in the uploaded document.
 */
export async function analyzePdfText(
  extractedText: string,
  detectedSubject: string,
  chunks: DocumentChunk[]
): Promise<PdfAnalysisResult> {
  // Sample chunks evenly across the document rather than just the beginning
  const totalChunks = chunks.length;
  const sampleIndices: number[] = [];
  const maxSamples = Math.min(12, totalChunks);

  if (totalChunks <= maxSamples) {
    for (let i = 0; i < totalChunks; i++) sampleIndices.push(i);
  } else {
    for (let i = 0; i < maxSamples; i++) {
      sampleIndices.push(Math.floor((i * (totalChunks - 1)) / (maxSamples - 1)));
    }
  }

  const sample = sampleIndices
    .map((idx) => {
      const c = chunks[idx];
      return `[Section: ${c.topic}]\n${c.text}`;
    })
    .join('\n\n')
    .slice(0, 9500);

  const systemPrompt = `You are Sahayak AI Expert Educational Document Analyzer.
Analyze the provided study document excerpts and output a structured JSON analysis of the TRUE TECHNICAL CORE CONCEPTS.
Subject: ${detectedSubject}

ABSOLUTE NEGATIVE CONSTRAINTS (VIOLATING THESE WILL CORRUPT THE SYSTEM):
1. NEVER output college, university, institute, or teacher names (e.g. NMIET, Polytechnic, Lecturer Das).
2. NEVER output syllabus outlines, table of contents headers, or lecture note meta-labels (e.g. "Contents", "Syllabus", "Topics to be covered", "Lecture Notes").
3. NEVER output unit numbers, chapter numbers, or page number ranges (e.g. "Unit - 1", "U N I T-2", "Module 3", "48-58", "1-10").
4. NEVER output decorative bullet symbols (e.g. ◼, ➢, ).
5. All topic names MUST be substantive, technical concepts (e.g. "Process Scheduling Algorithms", "Deadlock Prevention & Recovery", "Virtual Memory & Paging", "Relational Integrity Constraints", "SQL Query Optimization", "Database Normalization").

CRITICAL RULES:
1. Identify true core concepts, definitions, principles, formulas, technical terms, and relationships directly grounded in the text.
2. Separate into 4 to 8 high-value core topics.
3. Mark testable concepts and distinguish Easy, Medium, and Hard concepts.
4. Output JSON ONLY matching this exact structure:
{
  "overview": "2-3 sentence high-level overview of the material",
  "topics": [
    {
      "name": "Exact Technical Core Concept Name",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "coreConcepts": ["Core Concept 1"],
      "definitions": ["Term: definition statement"],
      "formulas": ["Formula or theoretical theorem if applicable"],
      "keyTerms": ["Technical term 1", "Technical term 2"],
      "difficultConcepts": ["Advanced concept requiring multi-step reasoning"],
      "testableConcepts": ["Specific high-yield testable concept"]
    }
  ]
}`;

  const prompt = `DOCUMENT CONTENT EXCERPTS:
${sample}

Perform deep conceptual analysis of this study document. Extract ONLY genuine core technical concepts.`;

  const raw = await callLLM(prompt, systemPrompt, true);

  if (raw) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.topics && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
          const cleanedTopics: TopicStructure[] = [];

          for (const t of parsed.topics) {
            const rawName = t.name || '';
            const cleanedName = cleanTopicString(rawName);
            if (cleanedName.length >= 4 && cleanedName.length <= 50) {
              cleanedTopics.push({
                name: cleanedName,
                subtopics: Array.isArray(t.subtopics) ? t.subtopics.map(cleanTopicString).filter(Boolean) : [],
                coreConcepts: Array.isArray(t.coreConcepts) ? t.coreConcepts.map(cleanTopicString).filter(Boolean) : [],
                definitions: Array.isArray(t.definitions) ? t.definitions.filter(Boolean) : [],
                formulas: Array.isArray(t.formulas) ? t.formulas.filter(Boolean) : [],
                keyTerms: Array.isArray(t.keyTerms) ? t.keyTerms.map(cleanTopicString).filter(Boolean) : [],
                difficultConcepts: Array.isArray(t.difficultConcepts) ? t.difficultConcepts.filter(Boolean) : [],
                testableConcepts: Array.isArray(t.testableConcepts) ? t.testableConcepts.filter(Boolean) : [],
              });
            }
          }

          if (cleanedTopics.length >= 2) {
            const topicNames = cleanedTopics.map((t) => t.name);
            const allKeyTerms = Array.from(new Set(cleanedTopics.flatMap((t) => t.keyTerms)));
            const allFormulas = Array.from(new Set(cleanedTopics.flatMap((t) => t.formulas)));

            const coreConcepts: ConceptItem[] = [];
            cleanedTopics.forEach((t) => {
              t.definitions.forEach((d) => {
                coreConcepts.push({
                  name: d.split(':')[0]?.trim() || d,
                  category: 'definition',
                  summary: d,
                  difficulty: 'Easy',
                  isTestable: true,
                  topic: t.name,
                });
              });
              t.coreConcepts.forEach((c) => {
                coreConcepts.push({
                  name: c,
                  category: 'core_principle',
                  summary: `Core mechanism of ${c} in ${t.name}`,
                  difficulty: 'Medium',
                  isTestable: true,
                  topic: t.name,
                });
              });
              t.difficultConcepts.forEach((dc) => {
                coreConcepts.push({
                  name: dc,
                  category: 'relationship',
                  summary: `Advanced reasoning regarding ${dc}`,
                  difficulty: 'Hard',
                  isTestable: true,
                  topic: t.name,
                });
              });
            });

            return {
              detectedSubject,
              overview: parsed.overview || `Systematic analysis of ${detectedSubject} study material.`,
              topics: cleanedTopics,
              topicNames,
              allKeyTerms,
              allFormulas,
              coreConcepts,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed parsing LLM PDF analysis JSON, using fallback analyzer:', e);
    }
  }

  // Robust document-grounded fallback analysis
  return generateFallbackPdfAnalysis(chunks, detectedSubject, extractedText);
}

function generateFallbackPdfAnalysis(
  chunks: DocumentChunk[],
  detectedSubject: string,
  fullText: string
): PdfAnalysisResult {
  const topicMap = new Map<string, TopicStructure>();

  chunks.forEach((chunk) => {
    let tName = cleanTopicString(chunk.topic);
    if (!tName || tName === 'Core Technical Concepts' || tName === 'General Section') {
      tName = `${detectedSubject} Architecture & Core Principles`;
    }
    if (!topicMap.has(tName)) {
      topicMap.set(tName, {
        name: tName,
        subtopics: [],
        coreConcepts: [],
        definitions: [],
        formulas: [],
        keyTerms: [],
        difficultConcepts: [],
        testableConcepts: [],
      });
    }

    const tStruct = topicMap.get(tName)!;
    const sentences = chunk.text.split(/(?<=[.?!])\s+/);

    sentences.forEach((s) => {
      const clean = s.trim();
      if (clean.length < 15) return;

      // Detect definitions
      if (/\b(is defined as|refers to|denotes|is a|means)\b/i.test(clean) && clean.length < 200) {
        if (tStruct.definitions.length < 3) tStruct.definitions.push(clean);
      }
      // Detect formulas / algorithmic laws
      if (/[=+\-*/><^∑πσ]/.test(clean) && /\b(where|equation|formula|equals|function|ratio)\b/i.test(clean)) {
        if (tStruct.formulas.length < 2) tStruct.formulas.push(clean);
      }
      // Detect technical terms (capitalized or quoted)
      const termMatches = clean.match(/\b[A-Z][a-zA-Z0-9-]{3,25}\b/g);
      if (termMatches) {
        termMatches.forEach((term) => {
          if (!tStruct.keyTerms.includes(term) && tStruct.keyTerms.length < 6) {
            tStruct.keyTerms.push(term);
          }
        });
      }
    });

    if (tStruct.coreConcepts.length === 0) {
      tStruct.coreConcepts.push(`Fundamental operational architecture of ${tName}`);
      tStruct.testableConcepts.push(`Practical behavior and trade-offs of ${tName}`);
      tStruct.difficultConcepts.push(`Multi-concept interactions involving ${tName}`);
    }
  });

  const topics = Array.from(topicMap.values()).slice(0, 8);
  const topicNames = topics.map((t) => t.name);
  const allKeyTerms = Array.from(new Set(topics.flatMap((t) => t.keyTerms)));
  const allFormulas = Array.from(new Set(topics.flatMap((t) => t.formulas)));

  const coreConcepts: ConceptItem[] = topics.flatMap((t) => [
    ...t.definitions.map((d) => ({
      name: d.split(' ')[0] || t.name,
      category: 'definition' as const,
      summary: d,
      difficulty: 'Easy' as const,
      isTestable: true,
      topic: t.name,
    })),
    ...t.coreConcepts.map((c) => ({
      name: c,
      category: 'core_principle' as const,
      summary: c,
      difficulty: 'Medium' as const,
      isTestable: true,
      topic: t.name,
    })),
    ...t.difficultConcepts.map((dc) => ({
      name: dc,
      category: 'relationship' as const,
      summary: dc,
      difficulty: 'Hard' as const,
      isTestable: true,
      topic: t.name,
    })),
  ]);

  return {
    detectedSubject,
    overview: `Comprehensive academic breakdown of ${detectedSubject} covering ${topicNames.length} core subject areas.`,
    topics,
    topicNames,
    allKeyTerms,
    allFormulas,
    coreConcepts,
  };
}
