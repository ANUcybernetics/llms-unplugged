import type { BigramModel } from "../tokens";
import { buildBucketsFromModel } from "../buckets";
import type { Machine } from "./types";

export type BucketPhase =
  | { kind: "idle" }
  | { kind: "showing-bucket"; bucketTokens: string[] }
  | { kind: "picked"; pickedToken: string; pickedIndex: number }
  | { kind: "complete" };

export type BucketGenerationState = {
  outputWords: string[];
  phase: BucketPhase;
};

export function createBucketGenerationMachine(
  model: BigramModel,
  vocabulary: string[],
): Machine<BucketGenerationState> {
  const buckets = buildBucketsFromModel(vocabulary, model);
  const bucketMap = new Map(buckets.map((b) => [b.label, b.tokens]));
  const validStarters = vocabulary.filter((w) => model.hasSuccessors(w));

  return {
    initialState: () => ({ outputWords: [], phase: { kind: "idle" } }),

    step(state, rng) {
      switch (state.phase.kind) {
        case "idle": {
          if (validStarters.length === 0) {
            return { outputWords: [], phase: { kind: "complete" } };
          }
          const startWord = validStarters[Math.floor(rng() * validStarters.length)];
          const tokens = bucketMap.get(startWord) ?? [];
          return {
            outputWords: [startWord],
            phase: { kind: "showing-bucket", bucketTokens: tokens },
          };
        }

        case "showing-bucket": {
          const { bucketTokens } = state.phase;
          if (bucketTokens.length === 0) {
            return { ...state, phase: { kind: "complete" } };
          }
          const pickedIndex = Math.floor(rng() * bucketTokens.length);
          return {
            ...state,
            phase: {
              kind: "picked",
              pickedToken: bucketTokens[pickedIndex],
              pickedIndex,
            },
          };
        }

        case "picked": {
          const newOutput = [...state.outputWords, state.phase.pickedToken];
          const tokens = bucketMap.get(state.phase.pickedToken);
          if (tokens && tokens.length > 0) {
            return {
              outputWords: newOutput,
              phase: { kind: "showing-bucket", bucketTokens: tokens },
            };
          }
          return { outputWords: newOutput, phase: { kind: "complete" } };
        }

        case "complete":
          return state;
      }
    },

    isComplete: (state) => state.phase.kind === "complete",
  };
}

export function selectStartWord(
  word: string,
  model: BigramModel,
  vocabulary: string[],
): BucketGenerationState | null {
  if (!model.hasSuccessors(word)) return null;
  const buckets = buildBucketsFromModel(vocabulary, model);
  const bucket = buckets.find((b) => b.label === word);
  if (!bucket) return null;
  return {
    outputWords: [word],
    phase: { kind: "showing-bucket", bucketTokens: bucket.tokens },
  };
}
