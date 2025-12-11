<script setup lang="ts">
import { computed, watch } from "vue";
import { usePlayback } from "../composables/usePlayback";
import { useTrainingText } from "../composables/useTrainingText";
import { parseTokens, getVocabulary, getBigrams } from "../utils/tokens";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";
import BigramGrid from "./BigramGrid.vue";

const inputText = useTrainingText();

const tokens = computed(() => parseTokens(inputText.value));
const bigrams = computed(() => getBigrams(tokens.value));
const vocabulary = computed(() => getVocabulary(tokens.value));
const totalSteps = computed(() => bigrams.value.length);

const {
  currentStep,
  isPlaying,
  isComplete,
  play,
  pause,
  step,
  reset,
  setTotalSteps,
} = usePlayback(totalSteps.value);

watch(totalSteps, (n) => setTotalSteps(n));

const gridCounts = computed(() => {
  const counts = new Map<string, number>();
  for (let i = 0; i < currentStep.value && i < bigrams.value.length; i++) {
    const [from, to] = bigrams.value[i];
    const key = `${from}->${to}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
});

const highlights = computed(() => {
  if (currentStep.value === 0 || currentStep.value > bigrams.value.length) {
    return { row: null, col: null, tokenIdx: -1, nextIdx: -1 };
  }
  const bigram = bigrams.value[currentStep.value - 1];
  return {
    row: bigram[0],
    col: bigram[1],
    tokenIdx: currentStep.value - 1,
    nextIdx: currentStep.value,
  };
});

function getCount(from: string, to: string): number {
  return gridCounts.value.get(`${from}->${to}`) || 0;
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget training-widget">
      <div class="training-view">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="training-input"
              v-model="inputText"
              class="text-input"
              rows="2"
              placeholder="Enter text to train on..."
            ></textarea>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Tokens</div>
          <div class="section-content tokens-content">
            <span
              v-for="(token, i) in tokens"
              :key="i"
              class="token"
              :class="{
                'highlight-first': i === highlights.tokenIdx,
                'highlight-second': i === highlights.nextIdx,
                punctuation: token === '.' || token === ',',
              }"
            >
              {{ token }}
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Current bigram</div>
          <div class="section-content bigram-content">
            <template v-if="highlights.row">
              <span
                class="token highlight-first"
                :class="{ punctuation: highlights.row === '.' || highlights.row === ',' }"
              >{{ highlights.row }}</span>
              <span class="arrow">→</span>
              <span
                class="token highlight-second"
                :class="{ punctuation: highlights.col === '.' || highlights.col === ',' }"
              >{{ highlights.col }}</span>
            </template>
            <span v-else-if="isComplete" class="complete-message">
              Training complete!
            </span>
            <span v-else class="placeholder">
              Press Play or Step to begin
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Model grid</div>
          <div class="section-content">
            <BigramGrid
              :vocabulary="vocabulary"
              :get-count="getCount"
              :highlighted-row="highlights.row"
              :highlighted-col="highlights.col"
            />
          </div>
        </div>

        <PlaybackControls
          :is-playing="isPlaying"
          :is-complete="isComplete"
          :current-step="currentStep"
          :total-steps="totalSteps"
          @play="play"
          @pause="pause"
          @step="step"
          @reset="reset"
        />
      </div>
    </div>
  </FullscreenWrapper>
</template>

<style scoped>
@import "../styles/widget-base.css";

.training-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tokens-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.bigram-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.75rem;
}

.complete-message {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.arrow {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
}
</style>
