export type VoiceState =
  | 'IDLE'
  | 'ASKING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'EVALUATING'
  | 'INTERRUPTED'
  | 'CLARIFYING'
  | 'HINTING'
  | 'FOLLOW_UP'
  | 'COMPLETED';

export type InterruptionIntent =
  | 'REPEAT'
  | 'SIMPLIFY'
  | 'CLARIFY'
  | 'EXAMPLE'
  | 'HINT_5_WORD'
  | 'HINT_FULL'
  | 'SLOW_DOWN'
  | 'PAUSE'
  | 'CONTINUE'
  | 'SKIP'
  | 'PREVIOUS'
  | 'EXPLAIN';

export function parseInterruptionIntent(input: string): InterruptionIntent | null {
  const text = input.toLowerCase().trim();

  if (text.includes('5-word hint') || text.includes('5 word hint') || text.includes('five word hint')) {
    return 'HINT_5_WORD';
  }
  if (text.includes('hint')) {
    return 'HINT_FULL';
  }
  if (text.includes('repeat') || text.includes("didn't hear") || text.includes('say again')) {
    return 'REPEAT';
  }
  if (text.includes('simplify') || text.includes("don't understand") || text.includes('simpler way') || text.includes('another way')) {
    return 'SIMPLIFY';
  }
  if (text.includes('what exactly') || text.includes('clarify')) {
    return 'CLARIFY';
  }
  if (text.includes('example')) {
    return 'EXAMPLE';
  }
  if (text.includes('slowly') || text.includes('speak clearly') || text.includes('slow down')) {
    return 'SLOW_DOWN';
  }
  if (text.includes('stop') || text.includes('wait') || text.includes('pause')) {
    return 'PAUSE';
  }
  if (text.includes('continue') || text.includes('resume')) {
    return 'CONTINUE';
  }
  if (text.includes('skip') || text.includes('next question')) {
    return 'SKIP';
  }
  if (text.includes('go back') || text.includes('previous question')) {
    return 'PREVIOUS';
  }
  if (text.includes('explain again') || text.includes('explain that')) {
    return 'EXPLAIN';
  }

  return null;
}

export function handleInterruptionResponse(
  intent: InterruptionIntent,
  currentQuestionText: string,
  hint5Words: string,
  fullHint: string,
  contextReference: string
): { responseText: string; nextState: VoiceState; incrementHintCount: boolean } {
  switch (intent) {
    case 'HINT_5_WORD':
      return {
        responseText: `Here is your 5-word hint: "${hint5Words}".`,
        nextState: 'HINTING',
        incrementHintCount: true,
      };

    case 'HINT_FULL':
      return {
        responseText: `Hint: ${fullHint}`,
        nextState: 'HINTING',
        incrementHintCount: true,
      };

    case 'REPEAT':
      return {
        responseText: `Let me repeat: ${currentQuestionText}`,
        nextState: 'ASKING',
        incrementHintCount: false,
      };

    case 'SIMPLIFY':
      return {
        responseText: `Let me ask this in a simpler way: ${currentQuestionText.replace(/What is the core concept of|Explain how/i, 'In simple terms, what is')}?`,
        nextState: 'CLARIFYING',
        incrementHintCount: false,
      };

    case 'CLARIFY':
      return {
        responseText: `I am asking about: ${currentQuestionText} Think about the concepts in your uploaded document.`,
        nextState: 'CLARIFYING',
        incrementHintCount: false,
      };

    case 'EXAMPLE':
      return {
        responseText: `For example, think of how this principle is applied in real-world systems: ${fullHint ? fullHint : 'it solves core technical challenges'}. Now, ${currentQuestionText}`,
        nextState: 'CLARIFYING',
        incrementHintCount: false,
      };

    case 'SLOW_DOWN':
      return {
        responseText: `I will speak more slowly. ${currentQuestionText}`,
        nextState: 'ASKING',
        incrementHintCount: false,
      };

    case 'EXPLAIN':
      return {
        responseText: `Here is context from your document: ${contextReference.slice(0, 150)}... Now try answering: ${currentQuestionText}`,
        nextState: 'CLARIFYING',
        incrementHintCount: false,
      };

    case 'PAUSE':
      return {
        responseText: 'Paused. Say "Continue" or click resume when ready.',
        nextState: 'INTERRUPTED',
        incrementHintCount: false,
      };

    case 'CONTINUE':
      return {
        responseText: `Continuing session. ${currentQuestionText}`,
        nextState: 'ASKING',
        incrementHintCount: false,
      };

    case 'SKIP':
      return {
        responseText: 'Skipping this question.',
        nextState: 'PROCESSING',
        incrementHintCount: false,
      };

    case 'PREVIOUS':
      return {
        responseText: 'Navigating to previous question.',
        nextState: 'PROCESSING',
        incrementHintCount: false,
      };

    default:
      return {
        responseText: currentQuestionText,
        nextState: 'ASKING',
        incrementHintCount: false,
      };
  }
}
