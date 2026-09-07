export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const clean1 = text1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const clean2 = text2.toLowerCase().replace(/[^\w\s]/g, '').trim();

  if (clean1 === clean2) return 1.0;

  // Jaccard word similarity
  const set1 = new Set(clean1.split(/\s+/).filter(w => w.length > 2));
  const set2 = new Set(clean2.split(/\s+/).filter(w => w.length > 2));

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionCount = 0;
  set1.forEach(word => {
    if (set2.has(word)) intersectionCount++;
  });

  const unionCount = new Set([...set1, ...set2]).size;
  const jaccardScore = intersectionCount / unionCount;

  // Levenshtein ratio for short phrases
  const levDistance = levenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  const levScore = maxLength > 0 ? 1 - levDistance / maxLength : 0;

  // Combined weighted score
  return (jaccardScore * 0.7) + (levScore * 0.3);
}

export function isDuplicateQuestion(
  newQuestionText: string,
  existingQuestions: string[],
  threshold: number = 0.60
): boolean {
  if (!existingQuestions || existingQuestions.length === 0) return false;

  for (const existing of existingQuestions) {
    const similarity = calculateTextSimilarity(newQuestionText, existing);
    if (similarity >= threshold) {
      return true;
    }
  }

  return false;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
