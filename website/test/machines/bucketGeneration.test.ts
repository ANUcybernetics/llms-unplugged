import { describe, it, expect } from "vitest";
import { buildBigramModel, getVocabulary, parseTokens } from "../../src/lib/tokens";
import {
  createBucketGenerationMachine,
  selectStartWord,
} from "../../src/lib/machines/bucketGeneration";

function buildModel(text: string) {
  const tokens = parseTokens(text);
  const vocabulary = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  return { tokens, vocabulary, model };
}

describe("createBucketGenerationMachine", () => {
  it("starts in idle phase", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createBucketGenerationMachine(model, vocabulary);
    const state = machine.initialState();
    expect(state.phase.kind).toBe("idle");
    expect(state.outputWords).toEqual([]);
  });

  it("transitions idle -> showing-bucket with a start word", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createBucketGenerationMachine(model, vocabulary);
    let state = machine.initialState();

    state = machine.step(state, () => 0);
    expect(state.phase.kind).toBe("showing-bucket");
    expect(state.outputWords).toHaveLength(1);
    if (state.phase.kind === "showing-bucket") {
      expect(state.phase.bucketTokens.length).toBeGreaterThan(0);
    }
  });

  it("transitions showing-bucket -> picked", () => {
    const { vocabulary, model } = buildModel("the cat sat");
    const machine = createBucketGenerationMachine(model, vocabulary);
    const rng = () => 0;
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("picked");
    if (state.phase.kind === "picked") {
      expect(state.phase.pickedToken).toBeTruthy();
      expect(state.phase.pickedIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("transitions picked -> showing-bucket when successor exists", () => {
    const { vocabulary, model } = buildModel("a b a b");
    const machine = createBucketGenerationMachine(model, vocabulary);
    const rng = () => 0;
    let state = machine.initialState();

    state = machine.step(state, rng);
    state = machine.step(state, rng);
    expect(state.phase.kind).toBe("picked");

    const wordsBefore = state.outputWords.length;
    state = machine.step(state, rng);

    if (state.phase.kind === "showing-bucket") {
      expect(state.outputWords).toHaveLength(wordsBefore + 1);
    } else {
      expect(state.phase.kind).toBe("complete");
    }
  });

  it("reaches complete when no successors", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createBucketGenerationMachine(model, vocabulary);
    const rng = () => 0;
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    expect(state.phase.kind).toBe("complete");
    expect(state.outputWords).toHaveLength(2);
  });

  it("is a no-op when already complete", () => {
    const { vocabulary, model } = buildModel("a b");
    const machine = createBucketGenerationMachine(model, vocabulary);
    const rng = () => 0;
    let state = machine.initialState();

    while (!machine.isComplete(state)) {
      state = machine.step(state, rng);
    }

    const completeState = state;
    expect(machine.step(state, rng)).toBe(completeState);
  });

  it("completes immediately with no valid starters", () => {
    const { model } = buildModel("a");
    const machine = createBucketGenerationMachine(model, ["a"]);
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
    expect(result!.phase.kind).toBe("showing-bucket");
  });

  it("returns null for a word with no successors", () => {
    expect(selectStartWord("sat", model, vocabulary)).toBeNull();
  });
});
