export type TestingFacet =
  | 'definition'
  | 'core_concept'
  | 'why_how'
  | 'application'
  | 'comparison'
  | 'scenario';

export interface FacetRecord {
  definition: boolean;
  core_concept: boolean;
  why_how: boolean;
  application: boolean;
  comparison: boolean;
  scenario: boolean;
  testedCount: number;
}

export type TopicCoverageMatrix = Record<string, FacetRecord>;

/**
 * Initialize topic coverage tracker for an interview session
 */
export function initializeTopicCoverage(topics: string[]): TopicCoverageMatrix {
  const matrix: TopicCoverageMatrix = {};
  topics.forEach((t) => {
    if (!t) return;
    matrix[t] = {
      definition: false,
      core_concept: false,
      why_how: false,
      application: false,
      comparison: false,
      scenario: false,
      testedCount: 0,
    };
  });
  return matrix;
}

/**
 * Record that a topic and facet was tested
 */
export function recordTopicTested(
  matrix: TopicCoverageMatrix,
  topic: string,
  facet: TestingFacet
): TopicCoverageMatrix {
  const updated: TopicCoverageMatrix = { ...matrix };
  if (!updated[topic]) {
    updated[topic] = {
      definition: false,
      core_concept: false,
      why_how: false,
      application: false,
      comparison: false,
      scenario: false,
      testedCount: 0,
    };
  }

  updated[topic] = {
    ...updated[topic],
    [facet]: true,
    testedCount: updated[topic].testedCount + 1,
  };

  return updated;
}

/**
 * Select the next priority topic and facet to avoid repeatedly testing one topic
 * Prioritizes:
 * 1. Untested topics
 * 2. Unchecked facets on existing topics
 * 3. Switches topics if last topic was just tested
 */
export function selectNextTopicAndFacet(
  matrix: TopicCoverageMatrix,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  lastTopic?: string
): { topic: string; facet: TestingFacet } {
  const entries = Object.entries(matrix);
  if (entries.length === 0) {
    return { topic: 'Core Concept', facet: 'core_concept' };
  }

  // 1. Find topics completely untested
  const untestedTopics = entries.filter(([name, record]) => record.testedCount === 0 && name !== lastTopic);
  if (untestedTopics.length > 0) {
    const [name] = untestedTopics[0];
    const facet: TestingFacet =
      difficulty === 'Easy' ? 'definition' : difficulty === 'Medium' ? 'core_concept' : 'why_how';
    return { topic: name, facet };
  }

  // 2. Find topics with untested facets matching current difficulty
  const targetFacet: TestingFacet =
    difficulty === 'Easy'
      ? 'definition'
      : difficulty === 'Medium'
      ? 'application'
      : 'scenario';

  const candidateTopic = entries.find(
    ([name, record]) => !record[targetFacet] && name !== lastTopic
  );

  if (candidateTopic) {
    return { topic: candidateTopic[0], facet: targetFacet };
  }

  // 3. Round-robin to least-tested topic
  const sorted = [...entries].sort((a, b) => a[1].testedCount - b[1].testedCount);
  const leastTested = sorted[0];

  // Pick first uncompleted facet
  const facets: TestingFacet[] = ['definition', 'core_concept', 'why_how', 'application', 'comparison', 'scenario'];
  const missingFacet = facets.find((f) => !leastTested[1][f]) || 'core_concept';

  return { topic: leastTested[0], facet: missingFacet };
}

/**
 * Calculate overall percentage of syllabus topics touched in the interview
 */
export function calculateTopicCoverageMetrics(matrix: TopicCoverageMatrix): {
  coveredTopics: number;
  totalTopics: number;
  coveragePercent: number;
  untestedTopics: string[];
} {
  const entries = Object.entries(matrix);
  const totalTopics = entries.length;
  if (totalTopics === 0) {
    return { coveredTopics: 0, totalTopics: 0, coveragePercent: 0, untestedTopics: [] };
  }

  const coveredTopics = entries.filter(([, r]) => r.testedCount > 0).length;
  const untestedTopics = entries.filter(([, r]) => r.testedCount === 0).map(([name]) => name);
  const coveragePercent = Math.round((coveredTopics / totalTopics) * 100);

  return {
    coveredTopics,
    totalTopics,
    coveragePercent,
    untestedTopics,
  };
}
