export function parseTokens(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .replace(/([.,!?;:]+)/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean);
}

export function getVocabulary(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

export function getBigrams(tokens: string[]): [string, string][] {
  if (tokens.length < 2) return [];
  const pairs: [string, string][] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    pairs.push([tokens[i], tokens[i + 1]]);
  }
  return pairs;
}

export interface BigramModel {
  counts: Map<string, Map<string, number>>;
  hasSuccessors: (word: string) => boolean;
  getCount: (from: string, to: string) => number;
}

export function buildBigramModel(tokens: string[]): BigramModel {
  const vocabulary = getVocabulary(tokens);
  const counts = new Map<string, Map<string, number>>();

  for (const word of vocabulary) {
    counts.set(word, new Map());
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const from = tokens[i];
    const to = tokens[i + 1];
    const row = counts.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  return {
    counts,
    hasSuccessors(word: string): boolean {
      const row = counts.get(word);
      return row ? [...row.values()].some((v) => v > 0) : false;
    },
    getCount(from: string, to: string): number {
      return counts.get(from)?.get(to) || 0;
    },
  };
}
