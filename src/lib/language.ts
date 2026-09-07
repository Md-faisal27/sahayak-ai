export type AppLanguage = 'ENGLISH' | 'HINDI' | 'HINGLISH';

export interface LanguageIntentResult {
  detectedLanguage?: AppLanguage;
  isSimpleExplainRequested?: boolean;
  intentLabel?: string;
}

export function parseLanguageAndIntent(input: string): LanguageIntentResult {
  const text = input.toLowerCase().trim();
  const result: LanguageIntentResult = {};

  if (text.includes('hindi mein') || text.includes('in hindi') || text.includes('hindi me')) {
    result.detectedLanguage = 'HINDI';
    result.intentLabel = 'SWITCH_HINDI';
  } else if (text.includes('hinglish mein') || text.includes('in hinglish') || text.includes('hinglish me')) {
    result.detectedLanguage = 'HINGLISH';
    result.intentLabel = 'SWITCH_HINGLISH';
  } else if (text.includes('english mein') || text.includes('in english') || text.includes('english me')) {
    result.detectedLanguage = 'ENGLISH';
    result.intentLabel = 'SWITCH_ENGLISH';
  }

  if (
    text.includes('samajh nahi aa raha') ||
    text.includes('samajh nahi aaya') ||
    text.includes('explain simply') ||
    text.includes('simple language') ||
    text.includes('aasan bhasha')
  ) {
    result.isSimpleExplainRequested = true;
    result.intentLabel = 'SIMPLE_EXPLAIN';
  }

  return result;
}

export function getLanguageSystemPromptInstruction(language: AppLanguage, isSimpleExplain: boolean = false): string {
  if (language === 'HINDI') {
    return `\nIMPORTANT LANGUAGE INSTRUCTION: Respond and formulate your text primarily in clear, natural HINDI (using Devanagari or standard Roman script). ${
      isSimpleExplain ? 'Use extremely simple analogies and step-by-step explanations without heavy jargon.' : ''
    }`;
  }

  if (language === 'HINGLISH') {
    return `\nIMPORTANT LANGUAGE INSTRUCTION: Respond and formulate your text in conversational HINGLISH (a natural blend of everyday Hindi words written in Roman script mixed with English technical terms). Example: "CPU scheduling ka matlab hai ki OS decide karta hai ki next kaunsa process execute hoga." ${
      isSimpleExplain ? 'Keep the explanation simple with relatable real-world examples.' : ''
    }`;
  }

  return `\nIMPORTANT LANGUAGE INSTRUCTION: Formulate all questions and responses in clear, academic ENGLISH. ${
    isSimpleExplain ? 'Provide a simple, non-jargon explanation with a practical everyday analogy.' : ''
  }`;
}
