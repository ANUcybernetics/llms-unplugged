import { PLAYBACK_CONFIG } from "../config/playback";

export function createPlayback(
  getTotalSteps: () => number,
  options: { loop?: boolean } = {},
) {
  let currentStep = $state(0);
  let isPlaying = $state(false);
  let stepInterval: number = $state(PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let loopTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const totalSteps = $derived(getTotalSteps());
  const isComplete = $derived(currentStep >= totalSteps);

  $effect.pre(() => {
    if (currentStep > totalSteps) {
      currentStep = totalSteps;
    }
  });

  function clearPlayInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startInterval() {
    clearPlayInterval();
    intervalId = setInterval(() => {
      step();
    }, stepInterval);
  }

  function clearLoopTimeout() {
    if (loopTimeoutId !== null) {
      clearTimeout(loopTimeoutId);
      loopTimeoutId = null;
    }
  }

  function step() {
    if (currentStep < totalSteps) {
      currentStep++;
    }
    if (currentStep >= totalSteps) {
      if (options.loop) {
        clearPlayInterval();
        loopTimeoutId = setTimeout(() => {
          loopTimeoutId = null;
          if (isPlaying) {
            currentStep = 0;
            startInterval();
          }
        }, stepInterval * PLAYBACK_CONFIG.LOOP_PAUSE_MULTIPLIER);
      } else {
        pause();
      }
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
    startInterval();
  }

  function pause() {
    isPlaying = false;
    clearPlayInterval();
    clearLoopTimeout();
  }

  function reset() {
    pause();
    currentStep = 0;
  }

  function cleanup() {
    clearPlayInterval();
    clearLoopTimeout();
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
      if (isPlaying) {
        startInterval();
      }
    },
    play,
    pause,
    step,
    reset,
    cleanup,
  };
}
