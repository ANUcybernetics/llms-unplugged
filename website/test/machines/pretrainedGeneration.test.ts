import { describe, it, expect } from "vitest";
import { buildBigramModel, getVocabulary, parseTokens } from "../../src/lib/tokens";
import {
  createPretrainedGenerationMachine,
  selectStartWord,
} from "../../src/lib/machines/pretrainedGeneration";

function buildModel(text: string) {
  const tokens = parseTokens(text);
  const vocabulary = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  return { tokens, vocabulary, model };
}

const rng = () => 0;

describe("createPretrainedGenerationMachine", () => {
  it("starts in idle phase", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createPretrainedGenerationMachine(model, vocabulary);
    const state = machine.initialState();
    expect(state.phase.kind).toBe("idle");
    expect(state.outputWords).toEqual([]);
  });

  it("transitions idle -> showing-entry", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createPretrainedGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("showing-entry");
    expect(state.outputWords).toHaveLength(1);
    if (state.phase.kind === "showing-entry") {
      expect(state.phase.entry.prefix).toBe(state.outputWords[0]);
    }
  });

  it("skips dice roll for single-follower entries", () => {
    const { vocabulary, model } = buildModel("a b c");
    const machine = createPretrainedGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("showing-entry");

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("rolled");
    if (state.phase.kind === "rolled") {
      expect(state.phase.diceRoll).toBeNull();
      expect(state.phase.nextWord).toBeTruthy();
    }
  });

  it("rolls dice for multi-follower entries", () => {
    const { vocabulary, model } = buildModel("a b a c");
    const machine = createPretrainedGenerationMachine(model, vocabulary);

    let state = machine.step(machine.initialState(), rng);
    expect(state.phase.kind).toBe("showing-entry");
    if (state.phase.kind === "showing-entry" && state.phase.entry.followers.length > 1) {
      state = machine.step(state, rng);
      expect(state.phase.kind).toBe("rolled");
      if (state.phase.kind === "rolled") {
        expect(state.phase.diceRoll).not.toBeNull();
      }
    }
  });

  it("reaches complete when no successors", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createPretrainedGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    expect(state.phase.kind).toBe("complete");
    expect(state.outputWords).toHaveLength(2);
  });

  it("is a no-op when already complete", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createPretrainedGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    const completeState = state;
    expect(machine.step(state, rng)).toBe(completeState);
  });
});

describe("selectStartWord", () => {
  const { vocabulary, model } = buildModel("the cat sat");

  it("returns state for a valid word", () => {
    const result = selectStartWord("the", model, vocabulary);
    expect(result).not.toBeNull();
    expect(result!.outputWords).toEqual(["the"]);
    expect(result!.phase.kind).toBe("showing-entry");
  });

  it("returns null for a word with no successors", () => {
    expect(selectStartWord("sat", model, vocabulary)).toBeNull();
  });
});
