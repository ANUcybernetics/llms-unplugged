import { ref, computed, onUnmounted } from "vue";

const STEP_INTERVAL_MS = 800;

export function usePlayback(initialTotalSteps = 0) {
  const currentStep = ref(0);
  const totalSteps = ref(initialTotalSteps);
  const isPlaying = ref(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const isComplete = computed(() => currentStep.value >= totalSteps.value);

  function clearPlayInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
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
    clearPlayInterval();
    intervalId = setInterval(() => {
      step();
    }, STEP_INTERVAL_MS);
  }

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

  onUnmounted(() => {
    clearPlayInterval();
  });

  return {
    currentStep,
    totalSteps,
    isPlaying,
    isComplete,
    play,
    pause,
    step,
    reset,
    setTotalSteps,
  };
}
