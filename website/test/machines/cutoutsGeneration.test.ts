import { describe, expect, it } from "vitest";
import { buildBigramModel, getVocabulary, parseTokens } from "../../src/lib/tokens";
import {
  createCutoutsGenerationMachine,
  selectStartWord,
} from "../../src/lib/machines/cutoutsGeneration";

function buildModel(text: string) {
  const tokens = parseTokens(text);
  const vocabulary = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  return { tokens, vocabulary, model };
}

const rng = () => 0;

describe("createCutoutsGenerationMachine", () => {
  it("starts in idle phase", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    const state = machine.initialState();
    expect(state.phase.kind).toBe("idle");
    expect(state.outputWords).toEqual([]);
  });

  it("transitions idle -> showing-matches with a start word", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("showing-matches");
    expect(state.outputWords).toHaveLength(1);
    if (state.phase.kind === "showing-matches") {
      expect(state.phase.matchingTokens.length).toBeGreaterThan(0);
    }
  });

  it("transitions showing-matches -> picked", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("picked");
    if (state.phase.kind === "picked") {
      expect(state.phase.pickedToken).toBeTruthy();
      expect(state.phase.pickedIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("transitions picked -> showing-matches when successor exists", () => {
    const { vocabulary, model } = buildModel("a b a b");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("picked");

    const wordsBefore = state.outputWords.length;
    state = machine.step(state, rng);

    if (state.phase.kind === "showing-matches") {
      expect(state.outputWords).toHaveLength(wordsBefore + 1);
    } else {
      expect(state.phase.kind).toBe("complete");
    }
  });

  it("reaches complete when no successors", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    expect(state.phase.kind).toBe("complete");
    expect(state.outputWords).toHaveLength(2);
  });

  it("is a no-op when already complete", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createCutoutsGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    const completeState = state;
    expect(machine.step(state, rng)).toBe(completeState);
  });

  it("completes immediately with no valid starters", () => {
    const { model } = buildModel("a");
    const machine = createCutoutsGenerationMachine(model, ["a"]);
    let state = machine.initialState();

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("complete");
  });
});

describe("selectStartWord", () => {
  const { vocabulary, model } = buildModel("the cat sat");

  it("returns state for a valid word", () => {
    const result = selectStartWord("the", model, vocabulary);
    expect(result).not.toBeNull();
    expect(result!.outputWords).toEqual(["the"]);
    expect(result!.phase.kind).toBe("showing-matches");
  });

  it("returns null for a word with no successors", () => {
    expect(selectStartWord("sat", model, vocabulary)).toBeNull();
  });
});
