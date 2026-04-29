import type { BigramModel } from "../tokens";
import { buildCutoutsFromModel } from "../cutouts";
import type { Machine } from "./types";

export type CutoutsPhase =
  | { kind: "idle" }
  | { kind: "showing-matches"; matchingTokens: string[] }
  | { kind: "picked"; pickedToken: string; pickedIndex: number }
  | { kind: "complete" };

export type CutoutsGenerationState = {
  outputWords: string[];
  phase: CutoutsPhase;
};

export function createCutoutsGenerationMachine(
  model: BigramModel,
  vocabulary: string[],
): Machine<CutoutsGenerationState> {
  const cutouts = buildCutoutsFromModel(vocabulary, model);
  const cutoutsByLabel = new Map(cutouts.map((c) => [c.label, c.tokens]));
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
          const tokens = cutoutsByLabel.get(startWord) ?? [];
          return {
            outputWords: [startWord],
            phase: { kind: "showing-matches", matchingTokens: tokens },
          };
        }

        case "showing-matches": {
          const { matchingTokens } = state.phase;
          if (matchingTokens.length === 0) {
            return { ...state, phase: { kind: "complete" } };
          }
          const pickedIndex = Math.floor(rng() * matchingTokens.length);
          return {
            ...state,
            phase: {
              kind: "picked",
              pickedToken: matchingTokens[pickedIndex],
              pickedIndex,
            },
          };
        }

        case "picked": {
          const newOutput = [...state.outputWords, state.phase.pickedToken];
          const tokens = cutoutsByLabel.get(state.phase.pickedToken);
          if (tokens && tokens.length > 0) {
            return {
              outputWords: newOutput,
              phase: { kind: "showing-matches", matchingTokens: tokens },
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
): CutoutsGenerationState | null {
  if (!model.hasSuccessors(word)) return null;
  const cutouts = buildCutoutsFromModel(vocabulary, model);
  const cutout = cutouts.find((c) => c.label === word);
  if (!cutout) return null;
  return {
    outputWords: [word],
    phase: { kind: "showing-matches", matchingTokens: cutout.tokens },
  };
}
