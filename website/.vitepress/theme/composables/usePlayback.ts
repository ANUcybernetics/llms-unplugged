import { ref, computed, onUnmounted, getCurrentInstance, watch } from "vue";
import { PLAYBACK_CONFIG } from "../config/playback";

export function usePlayback(initialTotalSteps = 0) {
  const currentStep = ref(0);
  const totalSteps = ref(initialTotalSteps);
  const isPlaying = ref(false);
  const stepInterval = ref(PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const isComplete = computed(() => currentStep.value >= totalSteps.value);

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
    }, stepInterval.value);
  }

  function step() {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++;
    }
    if (isComplete.value) {
      pause();
    }
  }

  function play() {
    if (isComplete.value) return;
    isPlaying.value = true;
    startInterval();
  }

  watch(stepInterval, () => {
    if (isPlaying.value) {
      startInterval();
    }
  });

  function pause() {
    isPlaying.value = false;
    clearPlayInterval();
  }

  function reset() {
    pause();
    currentStep.value = 0;
  }

  function setTotalSteps(n: number) {
    totalSteps.value = n;
    if (currentStep.value > n) {
      currentStep.value = n;
    }
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      clearPlayInterval();
    });
  } else if (import.meta.env.MODE !== "test") {
    console.warn(
      "usePlayback called outside component context - cleanup will not be automatic",
    );
  }

  return {
    currentStep,
    totalSteps,
    isPlaying,
    isComplete,
    stepInterval,
    play,
    pause,
    step,
    reset,
    setTotalSteps,
  };
}
