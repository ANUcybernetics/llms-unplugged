import { describe, expect, it } from "vitest";
import { createTrainingMachine } from "../../src/lib/machines/training";

const rng = () => 0.5;

describe("createTrainingMachine", () => {
  it("starts at step 0", () => {
    const machine = createTrainingMachine(5);
    const state = machine.initialState();
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(5);
  });

  it("increments currentStep on each step", () => {
    const machine = createTrainingMachine(3);
    let state = machine.initialState();

    state = machine.step(state, rng);
    expect(state.currentStep).toBe(1);

    state = machine.step(state, rng);
    expect(state.currentStep).toBe(2);

    state = machine.step(state, rng);
    expect(state.currentStep).toBe(3);
  });

  it("is complete when currentStep reaches totalSteps", () => {
    const machine = createTrainingMachine(2);
    let state = machine.initialState();
    expect(machine.isComplete(state)).toBe(false);

    state = machine.step(state, rng);
    expect(machine.isComplete(state)).toBe(false);

    state = machine.step(state, rng);
    expect(machine.isComplete(state)).toBe(true);
  });

  it("does not increment past totalSteps", () => {
    const machine = createTrainingMachine(1);
    let state = machine.initialState();

    state = machine.step(state, rng);
    expect(state.currentStep).toBe(1);

    state = machine.step(state, rng);
    expect(state.currentStep).toBe(1);
  });

  it("handles zero totalSteps", () => {
    const machine = createTrainingMachine(0);
    const state = machine.initialState();
    expect(machine.isComplete(state)).toBe(true);
    expect(machine.step(state, rng).currentStep).toBe(0);
  });
});
