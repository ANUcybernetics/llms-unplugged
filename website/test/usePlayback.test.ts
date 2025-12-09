import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePlayback } from "../.vitepress/theme/composables/usePlayback";

describe("usePlayback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at step 0 and not playing", () => {
    const { currentStep, isPlaying, isComplete } = usePlayback(5);
    expect(currentStep.value).toBe(0);
    expect(isPlaying.value).toBe(false);
    expect(isComplete.value).toBe(false);
  });

  it("step increments currentStep", () => {
    const { currentStep, step } = usePlayback(5);
    expect(currentStep.value).toBe(0);
    step();
    expect(currentStep.value).toBe(1);
    step();
    expect(currentStep.value).toBe(2);
  });

  it("step does not exceed totalSteps", () => {
    const { currentStep, step } = usePlayback(2);
    step();
    step();
    expect(currentStep.value).toBe(2);
    step();
    expect(currentStep.value).toBe(2);
  });

  it("isComplete is true when currentStep equals totalSteps", () => {
    const { isComplete, step } = usePlayback(2);
    expect(isComplete.value).toBe(false);
    step();
    expect(isComplete.value).toBe(false);
    step();
    expect(isComplete.value).toBe(true);
  });

  it("reset returns to step 0", () => {
    const { currentStep, step, reset } = usePlayback(5);
    step();
    step();
    expect(currentStep.value).toBe(2);
    reset();
    expect(currentStep.value).toBe(0);
  });

  it("play sets isPlaying to true", () => {
    const { isPlaying, play } = usePlayback(5);
    expect(isPlaying.value).toBe(false);
    play();
    expect(isPlaying.value).toBe(true);
  });

  it("pause sets isPlaying to false", () => {
    const { isPlaying, play, pause } = usePlayback(5);
    play();
    expect(isPlaying.value).toBe(true);
    pause();
    expect(isPlaying.value).toBe(false);
  });

  it("play auto-advances steps", () => {
    const { currentStep, play } = usePlayback(5);
    play();
    expect(currentStep.value).toBe(0);
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(1);
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(2);
  });

  it("pause stops auto-advance", () => {
    const { currentStep, play, pause } = usePlayback(5);
    play();
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(1);
    pause();
    vi.advanceTimersByTime(1600);
    expect(currentStep.value).toBe(1);
  });

  it("play stops when complete", () => {
    const { currentStep, isPlaying, play } = usePlayback(2);
    play();
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(1);
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(2);
    expect(isPlaying.value).toBe(false);
    vi.advanceTimersByTime(800);
    expect(currentStep.value).toBe(2);
  });

  it("setTotalSteps updates totalSteps", () => {
    const { totalSteps, setTotalSteps } = usePlayback(5);
    expect(totalSteps.value).toBe(5);
    setTotalSteps(10);
    expect(totalSteps.value).toBe(10);
  });

  it("setTotalSteps clamps currentStep if needed", () => {
    const { currentStep, step, setTotalSteps } = usePlayback(5);
    step();
    step();
    step();
    expect(currentStep.value).toBe(3);
    setTotalSteps(2);
    expect(currentStep.value).toBe(2);
  });

  it("play does nothing when already complete", () => {
    const { currentStep, isPlaying, step, play } = usePlayback(1);
    step();
    expect(currentStep.value).toBe(1);
    play();
    expect(isPlaying.value).toBe(false);
  });

  it("reset also pauses playback", () => {
    const { isPlaying, play, reset } = usePlayback(5);
    play();
    expect(isPlaying.value).toBe(true);
    reset();
    expect(isPlaying.value).toBe(false);
  });
});
