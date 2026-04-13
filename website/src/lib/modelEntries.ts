import type { BigramModel } from "./tokens";

export interface EntryFollower {
  word: string;
  count: number;
  threshold: number;
}

export interface ModelEntry {
  prefix: string;
  totalCount: number;
  numDice: number;
  followers: EntryFollower[];
}

export function buildModelEntries(vocabulary: string[], model: BigramModel): ModelEntry[] {
  const entries: ModelEntry[] = [];

  for (const word of vocabulary) {
    const row = model.counts.get(word);
    if (!row) continue;

    const followersRaw: { word: string; count: number }[] = [];
    let totalCount = 0;

    for (const [to, count] of row.entries()) {
      if (count > 0) {
        followersRaw.push({ word: to, count });
        totalCount += count;
      }
    }

    if (followersRaw.length === 0) continue;

    followersRaw.sort((a, b) => b.count - a.count);

    const numDice = totalCount.toString().length;
    const ceiling = Math.pow(10, numDice) - 1;

    const followers: EntryFollower[] = [];
    let cumulative = -1;
    for (let i = 0; i < followersRaw.length; i++) {
      const f = followersRaw[i];
      const scaled = Math.round((f.count / totalCount) * (ceiling + 1));
      cumulative += scaled;
      if (i === followersRaw.length - 1) {
        cumulative = ceiling;
      }
      followers.push({
        word: f.word,
        count: f.count,
        threshold: cumulative,
      });
    }

    entries.push({
      prefix: word,
      totalCount,
      numDice,
      followers,
    });
  }

  return entries;
}

export function findWordForThresholdRoll(entry: ModelEntry, roll: number): string | null {
  for (const follower of entry.followers) {
    if (roll <= follower.threshold) {
      return follower.word;
    }
  }
  return entry.followers[entry.followers.length - 1]?.word || null;
}
