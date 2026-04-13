import type { BigramModel } from "../tokens";
import { buildModelEntries, findWordForThresholdRoll } from "../modelEntries";
import type { ModelEntry } from "../modelEntries";
import type { Machine } from "./types";

export type PretrainedPhase =
  | { kind: "idle" }
  | { kind: "showing-entry"; entry: ModelEntry }
  | {
      kind: "rolled";
      diceRoll: number | null;
      nextWord: string;
      entry: ModelEntry;
    }
  | { kind: "complete" };

export type PretrainedGenerationState = {
  outputWords: string[];
  phase: PretrainedPhase;
};

function rollMultipleDice(numDice: number, rng: () => number): number {
  let result = 0;
  for (let i = 0; i < numDice; i++) {
    result = result * 10 + Math.floor(rng() * 10);
  }
  return result;
}

export function createPretrainedGenerationMachine(
  model: BigramModel,
  vocabulary: string[],
): Machine<PretrainedGenerationState> {
  const entries = buildModelEntries(vocabulary, model);
  const entryMap = new Map(entries.map((e) => [e.prefix, e]));
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
          const entry = entryMap.get(startWord);
          if (!entry) {
            return { outputWords: [], phase: { kind: "complete" } };
          }
          return {
            outputWords: [startWord],
            phase: { kind: "showing-entry", entry },
          };
        }

        case "showing-entry": {
          const { entry } = state.phase;
          if (entry.followers.length === 1) {
            return {
              ...state,
              phase: {
                kind: "rolled",
                diceRoll: null,
                nextWord: entry.followers[0].word,
                entry,
              },
            };
          }
          const diceRoll = rollMultipleDice(entry.numDice, rng);
          const nextWord = findWordForThresholdRoll(entry, diceRoll);
          if (!nextWord) return state;
          return {
            ...state,
            phase: { kind: "rolled", diceRoll, nextWord, entry },
          };
        }

        case "rolled": {
          const newOutput = [...state.outputWords, state.phase.nextWord];
          if (model.hasSuccessors(state.phase.nextWord)) {
            const entry = entryMap.get(state.phase.nextWord);
            if (!entry) {
              return { outputWords: newOutput, phase: { kind: "complete" } };
            }
            return {
              outputWords: newOutput,
              phase: { kind: "showing-entry", entry },
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
): PretrainedGenerationState | null {
  if (!model.hasSuccessors(word)) return null;
  const entries = buildModelEntries(vocabulary, model);
  const entry = entries.find((e) => e.prefix === word);
  if (!entry) return null;
  return {
    outputWords: [word],
    phase: { kind: "showing-entry", entry },
  };
}
