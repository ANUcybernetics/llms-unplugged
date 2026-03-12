import { PLAYBACK_CONFIG } from "../config/playback";

export function createPlayback(
  getTotalSteps: () => number,
  options: { loop?: boolean } = {},
) {
  let currentStep = $state(0);
  let isPlaying = $state(false);
  let stepInterval: number = $state(
    PLAYBACK_CONFIG.TRAINING_DEFAULT_STEP_INTERVAL_MS,
  );
  let intervalId: ReturnType<typeof setTimeout> | null = null;

  const totalSteps = $derived(getTotalSteps());
  const isComplete = $derived(currentStep >= totalSteps);

  $effect.pre(() => {
    if (currentStep > totalSteps) {
      currentStep = totalSteps;
    }
  });

  function clearTimer() {
    if (intervalId !== null) {
      clearTimeout(intervalId);
      intervalId = null;
    }
  }

  function scheduleNext(delay?: number) {
    clearTimer();
    intervalId = setTimeout(() => {
      intervalId = null;
      step();
    }, delay ?? stepInterval);
  }

  function step() {
    if (currentStep < totalSteps) {
      currentStep++;
    }
    if (currentStep >= totalSteps) {
      if (options.loop) {
        clearTimer();
        intervalId = setTimeout(() => {
          intervalId = null;
          currentStep = 0;
          if (isPlaying) scheduleNext();
        }, stepInterval * PLAYBACK_CONFIG.LOOP_PAUSE_MULTIPLIER);
      } else {
        pause();
        return;
      }
    } else if (isPlaying) {
      scheduleNext();
    }
  }

  function play() {
    if (currentStep >= totalSteps) {
      if (options.loop) {
        currentStep = 0;
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
    currentStep = 0;
  }

  function cleanup() {
    clearTimer();
  }

  return {
    get currentStep() {
      return currentStep;
    },
    get totalSteps() {
      return totalSteps;
    },
    get isPlaying() {
      return isPlaying;
    },
    get isComplete() {
      return isComplete;
    },
    get stepInterval() {
      return stepInterval;
    },
    set stepInterval(value: number) {
      stepInterval = value;
    },
    play,
    pause,
    step,
    reset,
    cleanup,
  };
}
