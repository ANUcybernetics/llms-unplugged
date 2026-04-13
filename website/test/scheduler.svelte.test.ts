import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import type { Machine } from "../src/lib/machines/types";
import { createScheduler } from "../src/lib/scheduler.svelte";

// A trivial counting machine: completes when `count >= limit`.
function countingMachine(limit: number): Machine<{ count: number }> {
  return {
    initialState: () => ({ count: 0 }),
    step: (s) => ({ count: s.count + 1 }),
    isComplete: (s) => s.count >= limit,
  };
}

describe("createScheduler", () => {
  it("treats a static `loop: boolean` as its constant value", () => {
    const cleanup = $effect.root(() => {
      const scheduler = createScheduler(() => countingMachine(2), {
        defaultInterval: 0,
        loop: false,
      });
      flushSync();

      scheduler.step();
      scheduler.step();
      expect(scheduler.isComplete).toBe(true);

      // Further steps do nothing when loop=false.
      scheduler.step();
      expect(scheduler.isComplete).toBe(true);
    });
    cleanup();
  });

  it("re-reads a `loop` getter on every completion check", () => {
    let loop = $state(false);

    const cleanup = $effect.root(() => {
      const scheduler = createScheduler(() => countingMachine(2), {
        defaultInterval: 0,
        loop: () => loop,
      });
      flushSync();

      scheduler.step();
      scheduler.step();
      expect(scheduler.isComplete).toBe(true);

      // Flip the getter to `true`: next `step()` should reset via loop.
      loop = true;
      flushSync();
      scheduler.step();
      expect(scheduler.state.count).toBe(0);
    });
    cleanup();
  });

  it("keeps existing callers with `loop: true` working", () => {
    const cleanup = $effect.root(() => {
      const scheduler = createScheduler(() => countingMachine(2), {
        defaultInterval: 0,
        loop: true,
      });
      flushSync();

      scheduler.step();
      scheduler.step();
      expect(scheduler.isComplete).toBe(true);

      // Next step should reset because loop=true.
      scheduler.step();
      expect(scheduler.state.count).toBe(0);
    });
    cleanup();
  });
});
