import { describe, expect, it } from "vitest";
import {
  EXAMPLE_GENERATION,
  EXAMPLE_GENERATION_ROLLS,
  EXAMPLE_PRETRAINED_ROLLS,
  EXAMPLE_PRETRAINED_SEQ,
  EXAMPLE_TEXT,
  EXAMPLE_TOKENS,
  EXAMPLE_VOCAB,
} from "../src/decks/examples";
import { buildBigramModel, getVocabulary, parseTokens, splitTokens } from "../src/lib/tokens";
import { computeDiceBands, getRowOptionsInVocabOrder } from "../src/lib/diceBands";
import { buildModelEntries, findWordForThresholdRoll } from "../src/lib/modelEntries";

// The grid decks walk through a worked generation example slide by slide:
// StaticGeneration shows each roll and the word it picks, and DiceStrip shows
// the face bands the roll lands in. Both derive everything from the shared
// example data, so these tests are the single check that every claimed roll
// actually selects the word the walk writes down --- if the data drifts, the
// slides (and their speaker notes) would silently contradict themselves.

describe("grid deck generation walk", () => {
  const tokens = splitTokens(EXAMPLE_TOKENS);
  const vocab = splitTokens(EXAMPLE_VOCAB);
  const model = buildBigramModel(tokens);
  const sequence = splitTokens(EXAMPLE_GENERATION);
  const rolls = splitTokens(EXAMPLE_GENERATION_ROLLS);

  it("vocabulary covers the token stream", () => {
    expect(vocab).toEqual(getVocabulary(tokens));
  });

  it("has a roll entry for every step in the walk", () => {
    expect(rolls.length).toBeGreaterThanOrEqual(sequence.length - 1);
  });

  it.each(
    sequence.slice(0, -1).map((word, step) => ({ step, word, next: sequence[step + 1] })),
  )("step $step: $word → $next follows the dice bands", ({ step, word, next }) => {
    const options = getRowOptionsInVocabOrder(vocab, model.getCount, word);
    const roll = rolls[step];

    if (roll === "-") {
      // No-roll steps must genuinely have a single option, and it must be the
      // word the walk writes down.
      expect(options).toHaveLength(1);
      expect(options[0].word).toBe(next);
    } else {
      // Rolled steps must have a real choice, and the roll must land in the
      // band of the word the walk writes down --- using the same band
      // computation DiceStrip renders.
      expect(options.length).toBeGreaterThan(1);
      const bands = computeDiceBands(options);
      const winner = bands.find((b) => Number(roll) >= b.from && Number(roll) <= b.to);
      expect(winner?.word).toBe(next);
    }
  });
});

describe("pre-trained deck generation walk", () => {
  const tokens = parseTokens(EXAMPLE_TEXT);
  const vocab = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  const entries = buildModelEntries(vocab, model);
  const sequence = splitTokens(EXAMPLE_PRETRAINED_SEQ);
  const rolls = splitTokens(EXAMPLE_PRETRAINED_ROLLS);

  it("has a roll entry for every step in the walk", () => {
    expect(rolls.length).toBeGreaterThanOrEqual(sequence.length - 1);
  });

  it.each(
    sequence.slice(0, -1).map((word, step) => ({ step, word, next: sequence[step + 1] })),
  )("step $step: $word → $next follows the booklet thresholds", ({ step, word, next }) => {
    const entry = entries.find((e) => e.previousWord === word);
    expect(entry).toBeDefined();
    const roll = rolls[step];

    if (roll === "-") {
      expect(entry!.nextWords).toHaveLength(1);
      expect(entry!.nextWords[0].word).toBe(next);
    } else {
      expect(entry!.nextWords.length).toBeGreaterThan(1);
      // The roll's digit count must match the entry's dice count (a two-digit
      // roll on a one-die entry would be unrollable).
      expect(roll.length).toBe(entry!.numDice);
      expect(findWordForThresholdRoll(entry!, Number(roll))).toBe(next);
    }
  });
});
