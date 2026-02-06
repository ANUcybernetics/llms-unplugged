<script setup lang="ts">
interface Props {
  isPlaying: boolean;
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  showStepCounter?: boolean;
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showStepCounter: true,
  loop: false,
});

const emit = defineEmits<{
  play: [];
  pause: [];
  step: [];
  reset: [];
}>();

function handlePlayPause() {
  if (props.isPlaying) {
    emit("pause");
  } else {
    emit("play");
  }
}
</script>

<template>
  <div class="playback-controls">
    <button
      type="button"
      :aria-label="isPlaying ? 'Pause' : 'Play'"
      :disabled="isComplete && !isPlaying && !loop"
      @click="handlePlayPause"
    >
      {{ isPlaying ? "⏸ Pause" : "▶ Play" }}
    </button>
    <button
      type="button"
      aria-label="Step forward"
      :disabled="isComplete"
      @click="emit('step')"
    >
      ⏭ Step
    </button>
    <button type="button" aria-label="Reset" @click="emit('reset')">
      ↺ Reset
    </button>
    <span v-if="showStepCounter && totalSteps > 0" class="step-counter">
      {{ currentStep }} / {{ totalSteps }}
    </span>
  </div>
</template>

<style scoped>
.playback-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-top: 1px solid var(--vp-c-border);
}

.playback-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.playback-controls button:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}

.playback-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-counter {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}

@media (prefers-reduced-motion: reduce) {
  .playback-controls button {
    transition: none;
  }
}
</style>
