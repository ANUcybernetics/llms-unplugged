import type { BigramModel } from "./tokens";

export interface NextWord {
  word: string;
  count: number;
  threshold: number;
}

export interface ModelEntry {
  previousWord: string;
  totalCount: number;
  numDice: number;
  nextWords: NextWord[];
}

export function buildModelEntries(vocabulary: string[], model: BigramModel): ModelEntry[] {
  const entries: ModelEntry[] = [];

  for (const word of vocabulary) {
    const row = model.counts.get(word);
    if (!row) continue;

    const nextWordsRaw: { word: string; count: number }[] = [];
    let totalCount = 0;

    for (const [to, count] of row.entries()) {
      if (count > 0) {
        nextWordsRaw.push({ word: to, count });
        totalCount += count;
      }
    }

    if (nextWordsRaw.length === 0) continue;

    nextWordsRaw.sort((a, b) => b.count - a.count);

    const numDice = totalCount.toString().length;
    const ceiling = Math.pow(10, numDice) - 1;

    const nextWords: NextWord[] = [];
    let cumulative = -1;
    for (let i = 0; i < nextWordsRaw.length; i++) {
      const f = nextWordsRaw[i];
      const scaled = Math.round((f.count / totalCount) * (ceiling + 1));
      cumulative += scaled;
      if (i === nextWordsRaw.length - 1) {
        cumulative = ceiling;
      }
      nextWords.push({
        word: f.word,
        count: f.count,
        threshold: cumulative,
      });
    }

    entries.push({
      previousWord: word,
      totalCount,
      numDice,
      nextWords,
    });
  }

  return entries;
}

export function findWordForThresholdRoll(entry: ModelEntry, roll: number): string | null {
  for (const nextWord of entry.nextWords) {
    if (roll <= nextWord.threshold) {
      return nextWord.word;
    }
  }
  return entry.nextWords[entry.nextWords.length - 1]?.word || null;
}
