import { describe, expect, it } from "vitest";
import { buildBigramModel, getVocabulary, parseTokens } from "../../src/lib/tokens";
import {
  createDiceGenerationMachine,
  selectStartWord,
} from "../../src/lib/machines/diceGeneration";

function buildModel(text: string) {
  const tokens = parseTokens(text);
  const vocabulary = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  return { tokens, vocabulary, model };
}

const rng = () => 0;

describe("createDiceGenerationMachine", () => {
  const { vocabulary, model } = buildModel("the cat sat");
  const diceSides = 6;

  it("starts in idle phase", () => {
    const machine = createDiceGenerationMachine(model, vocabulary, diceSides);
    const state = machine.initialState();
    expect(state.phase.kind).toBe("idle");
    expect(state.outputWords).toEqual([]);
    expect(machine.isComplete(state)).toBe(false);
  });

  it("transitions idle -> showing-options with a start word", () => {
    const machine = createDiceGenerationMachine(model, vocabulary, diceSides);
    let state = machine.initialState();

    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("showing-options");
    expect(state.outputWords).toHaveLength(1);
    expect(vocabulary).toContain(state.outputWords[0]);
  });

  it("transitions showing-options -> rolled with dice result", () => {
    const machine = createDiceGenerationMachine(model, vocabulary, diceSides);
    let state = machine.initialState();

    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("showing-options");

    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("rolled");
    if (state.phase.kind === "rolled") {
      expect(state.phase.diceRoll).toBeGreaterThanOrEqual(0);
      expect(state.phase.diceRoll).toBeLessThanOrEqual(diceSides - 1);
      expect(state.phase.nextWord).toBeTruthy();
    }
  });

  it("transitions rolled -> showing-options when successor exists", () => {
    const machine = createDiceGenerationMachine(model, vocabulary, diceSides);
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("rolled");

    const wordsBefore = state.outputWords.length;
    state = machine.step(state, rng);

    if (state.phase.kind === "showing-options") {
      expect(state.outputWords).toHaveLength(wordsBefore + 1);
    } else {
      expect(state.phase.kind).toBe("complete");
    }
  });

  it("reaches complete when word has no successors", () => {
    const { vocabulary: simpleVocab, model: simpleModel } = buildModel("a b");
    const machine = createDiceGenerationMachine(simpleModel, simpleVocab, 6);
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    state = machine.step(state, rng);

    expect(state.phase.kind).toBe("complete");
    expect(machine.isComplete(state)).toBe(true);
    expect(state.outputWords).toHaveLength(2);
  });

  it("is a no-op when already complete", () => {
    const { vocabulary: simpleVocab, model: simpleModel } = buildModel("a b");
    const machine = createDiceGenerationMachine(simpleModel, simpleVocab, 6);
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    const completeState = state;
    state = machine.step(state, rng);
    expect(state).toBe(completeState);
  });

  it("completes immediately with no valid starters", () => {
    const { model: singleModel } = buildModel("a");
    const machine = createDiceGenerationMachine(singleModel, ["a"], 6);
    let state = machine.initialState();

    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("complete");
  });

  it("uses rng deterministically", () => {
    const machine = createDiceGenerationMachine(model, vocabulary, diceSides);
    let callCount = 0;
    const deterministicRng = () => {
      callCount++;
      return 0.5;
    };

    let state1 = machine.initialState();
    state1 = machine.step(state1, deterministicRng);
    const count1 = callCount;

    callCount = 0;
    let state2 = machine.initialState();
    state2 = machine.step(state2, deterministicRng);

    expect(callCount).toBe(count1);
    expect(state1.outputWords).toEqual(state2.outputWords);
  });
});

describe("selectStartWord", () => {
  const { model } = buildModel("the cat sat");

  it("returns state for a valid word", () => {
    const result = selectStartWord("the", model, 6);
    expect(result).not.toBeNull();
    expect(result!.outputWords).toEqual(["the"]);
    expect(result!.phase.kind).toBe("showing-options");
  });

  it("returns null for a word with no successors", () => {
    const result = selectStartWord("sat", model, 6);
    expect(result).toBeNull();
  });

  it("returns null for a word not in the model", () => {
    const result = selectStartWord("unknown", model, 6);
    expect(result).toBeNull();
  });
});
