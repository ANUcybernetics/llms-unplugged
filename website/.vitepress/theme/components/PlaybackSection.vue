<script setup lang="ts">
import PlaybackControls from "./PlaybackControls.vue";
import { PLAYBACK_CONFIG } from "../config/playback";

interface Props {
  isPlaying: boolean;
  isComplete: boolean;
  currentStep?: number;
  totalSteps?: number;
  showStepCounter?: boolean;
  stepInterval: number;
  sliderId?: string;
  loop?: boolean;
}

withDefaults(defineProps<Props>(), {
  currentStep: 0,
  totalSteps: 0,
  showStepCounter: false,
  sliderId: "speed-slider",
  loop: false,
});

defineEmits<{
  play: [];
  pause: [];
  step: [];
  reset: [];
  "update:stepInterval": [value: number];
}>();
</script>

<template>
  <div class="widget-section">
    <div class="section-header">Controls</div>
    <div class="section-content controls-content">
      <PlaybackControls
        :is-playing="isPlaying"
        :is-complete="isComplete"
        :current-step="currentStep"
        :total-steps="totalSteps"
        :show-step-counter="showStepCounter"
        :loop="loop"
        @play="$emit('play')"
        @pause="$emit('pause')"
        @step="$emit('step')"
        @reset="$emit('reset')"
      />
      <div class="speed-control">
        <span class="speed-label">Slow</span>
        <input
          :id="sliderId"
          :value="stepInterval"
          type="range"
          :min="PLAYBACK_CONFIG.MIN_STEP_INTERVAL_MS"
          :max="PLAYBACK_CONFIG.MAX_STEP_INTERVAL_MS"
          step="50"
          @input="$emit('update:stepInterval', Number(($event.target as HTMLInputElement).value))"
        />
        <span class="speed-label">Fast</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles/widget-base.css";
</style>
