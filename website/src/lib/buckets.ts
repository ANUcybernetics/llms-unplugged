import type { BigramModel } from "./tokens";

export interface BucketContents {
  label: string;
  tokens: string[];
}

export function buildBucketsFromModel(
  vocabulary: string[],
  model: BigramModel,
): BucketContents[] {
  const buckets: BucketContents[] = [];

  for (const word of vocabulary) {
    const row = model.counts.get(word);
    if (!row) continue;

    const tokensInBucket: string[] = [];
    for (const [to, count] of row.entries()) {
      for (let i = 0; i < count; i++) {
        tokensInBucket.push(to);
      }
    }

    if (tokensInBucket.length > 0) {
      buckets.push({ label: word, tokens: tokensInBucket });
    }
  }

  return buckets;
}
