import type { BigramModel } from "../tokens";
import type { DiceMapping } from "../diceMapping";
import { createDiceMapping, findWordForRoll } from "../diceMapping";
import type { Machine } from "./types";

export type DiceGenerationPhase =
  | { kind: "idle" }
  | { kind: "showing-options"; mappings: DiceMapping[] }
  | {
      kind: "rolled";
      diceRoll: number;
      nextWord: string;
      mappings: DiceMapping[];
    }
  | { kind: "complete" };

export type DiceGenerationState = {
  outputWords: string[];
  phase: DiceGenerationPhase;
};

function getRowOptions(model: BigramModel, word: string): { word: string; count: number }[] {
  const row = model.counts.get(word);
  if (!row) return [];
  return [...row.entries()]
    .filter(([, count]) => count > 0)
    .map(([w, count]) => ({ word: w, count }));
}

export function createDiceGenerationMachine(
  model: BigramModel,
  vocabulary: string[],
  diceSides: number,
): Machine<DiceGenerationState> {
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
          const mappings = createDiceMapping(getRowOptions(model, startWord), diceSides);
          return {
            outputWords: [startWord],
            phase: { kind: "showing-options", mappings },
          };
        }

        case "showing-options": {
          const roll = Math.floor(rng() * diceSides) + 1;
          const nextWord = findWordForRoll(state.phase.mappings, roll);
          if (!nextWord) return state;
          return {
            ...state,
            phase: {
              kind: "rolled",
              diceRoll: roll,
              nextWord,
              mappings: state.phase.mappings,
            },
          };
        }

        case "rolled": {
          const newOutput = [...state.outputWords, state.phase.nextWord];
          if (model.hasSuccessors(state.phase.nextWord)) {
            const mappings = createDiceMapping(
              getRowOptions(model, state.phase.nextWord),
              diceSides,
            );
            return {
              outputWords: newOutput,
              phase: { kind: "showing-options", mappings },
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
  diceSides: number,
): DiceGenerationState | null {
  if (!model.hasSuccessors(word)) return null;
  const options = getRowOptions(model, word);
  const mappings = createDiceMapping(options, diceSides);
  return {
    outputWords: [word],
    phase: { kind: "showing-options", mappings },
  };
}
