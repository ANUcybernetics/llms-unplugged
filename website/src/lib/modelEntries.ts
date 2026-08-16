import { computeDiceBands } from "./diceBands";
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

    // Shared apportionment (see computeDiceBands) so entries agree with the
    // printed booklets and the deck dice strips.
    const nextWords: NextWord[] = computeDiceBands(nextWordsRaw).map((band) => ({
      word: band.word,
      count: band.count,
      threshold: band.to,
    }));

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
  return entry.nextWords.at(-1)?.word || null;
}
