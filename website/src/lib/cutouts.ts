import type { BigramModel } from "./tokens";

export interface CutoutsForLabel {
  label: string;
  tokens: string[];
}

export function buildCutoutsFromModel(vocabulary: string[], model: BigramModel): CutoutsForLabel[] {
  const cutouts: CutoutsForLabel[] = [];

  for (const word of vocabulary) {
    const row = model.counts.get(word);
    if (!row) continue;

    const tokensForLabel: string[] = [];
    for (const [to, count] of row.entries()) {
      for (let i = 0; i < count; i++) {
        tokensForLabel.push(to);
      }
    }

    if (tokensForLabel.length > 0) {
      cutouts.push({ label: word, tokens: tokensForLabel });
    }
  }

  return cutouts;
}
