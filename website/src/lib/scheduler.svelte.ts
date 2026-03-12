import type { Machine } from "./machines/types";
import { PLAYBACK_CONFIG } from "./config/playback";

export interface SchedulerOptions {
  defaultInterval: number;
  loop?: boolean;
  rng?: () => number;
}

export function createScheduler<S>(
  getMachine: () => Machine<S>,
  opts: SchedulerOptions,
) {
  const rng = opts.rng ?? (() => Math.random());
  const loop = opts.loop ?? false;

  let currentMachine = getMachine();
  let state = $state(currentMachine.initialState());
  let isPlaying = $state(false);
  let stepInterval = $state(opts.defaultInterval);
  let timerId: ReturnType<typeof setTimeout> | null = null;

  $effect.pre(() => {
    const m = getMachine();
    if (m !== currentMachine) {
      currentMachine = m;
      clearTimer();
      isPlaying = false;
      state = m.initialState();
    }
  });

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function scheduleNext(delay?: number) {
    clearTimer();
    timerId = setTimeout(() => {
      timerId = null;
      step();
    }, delay ?? stepInterval);
  }

  function step() {
    if (currentMachine.isComplete(state)) {
      if (loop) {
        state = currentMachine.initialState();
      }
      return;
    }
    state = currentMachine.step(state, rng);
    if (currentMachine.isComplete(state)) {
      if (loop) {
        clearTimer();
        timerId = setTimeout(
          () => {
            timerId = null;
            state = currentMachine.initialState();
            if (isPlaying) scheduleNext();
          },
          stepInterval * PLAYBACK_CONFIG.LOOP_PAUSE_MULTIPLIER,
        );
      } else {
        isPlaying = false;
        clearTimer();
      }
    } else if (isPlaying) {
      scheduleNext();
    }
  }

  function play() {
    if (currentMachine.isComplete(state)) {
      if (loop) {
        state = currentMachine.initialState();
      } else {
        return;
      }
    }
    isPlaying = true;
    scheduleNext();
  }

  function pause() {
    isPlaying = false;
    clearTimer();
  }

  function reset() {
    pause();
    state = currentMachine.initialState();
  }

  function cleanup() {
    clearTimer();
  }

  return {
    get state() {
      return state;
    },
    get isPlaying() {
      return isPlaying;
    },
    get isComplete() {
      return currentMachine.isComplete(state);
    },
    get stepInterval() {
      return stepInterval;
    },
    set stepInterval(value: number) {
      stepInterval = value;
    },
    setState(s: S) {
      state = s;
    },
    play,
    pause,
    step,
    reset,
    cleanup,
  };
}
