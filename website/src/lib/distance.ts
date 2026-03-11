import type { BigramModel } from "./tokens";

export function manhattanDistance(
  model: BigramModel,
  vocabulary: string[],
  wordA: string,
  wordB: string,
): number {
  let sum = 0;
  for (const col of vocabulary) {
    sum += Math.abs(model.getCount(wordA, col) - model.getCount(wordB, col));
  }
  return sum;
}

export function buildDistanceMatrix(model: BigramModel, vocabulary: string[]): number[][] {
  return vocabulary.map((rowWord, i) =>
    vocabulary.map((colWord, j) =>
      i === j ? 0 : manhattanDistance(model, vocabulary, rowWord, colWord),
    ),
  );
}
