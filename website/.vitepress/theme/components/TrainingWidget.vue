<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { usePlayback } from "../composables/usePlayback";
import { parseTokens, getVocabulary, getBigrams } from "../utils/tokens";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";
import BigramGrid from "./BigramGrid.vue";

interface Props {
  initialText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialText: "The cat sat on the mat.",
});

const inputText = ref(props.initialText);

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
        <div class="input-section">
          <label for="training-input" class="input-label">Training text:</label>
          <textarea
            id="training-input"
            v-model="inputText"
            class="text-input"
            rows="2"
            placeholder="Enter text to train on..."
          ></textarea>
        </div>
        <div class="tokens-section">
          <span class="section-label">Tokens:</span>
          <span
            v-for="(token, i) in tokens"
            :key="i"
            class="token"
            :class="{
              'highlight-first': i === highlights.tokenIdx,
              'highlight-second': i === highlights.nextIdx,
            }"
          >
            {{ token }}
          </span>
        </div>

        <div v-if="highlights.row" class="current-bigram">
          <span class="section-label">Current bigram:</span>
          <span class="token highlight-first">{{ highlights.row }}</span>
          <span class="arrow">→</span>
          <span class="token highlight-second">{{ highlights.col }}</span>
        </div>
        <div v-else-if="isComplete" class="current-bigram complete">
          Training complete!
        </div>
        <div v-else class="current-bigram">
          <span class="section-label">Press Play or Step to begin</span>
        </div>

        <BigramGrid
          :vocabulary="vocabulary"
          :get-count="getCount"
          :highlighted-row="highlights.row"
          :highlighted-col="highlights.col"
        />

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
.lm-widget {
  border: 1px solid var(--vp-c-border);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  background: var(--vp-c-bg-soft);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  resize: vertical;
}

.training-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tokens-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.section-label {
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 0.5rem;
}

.token {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-alt);
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.token.highlight-first {
  background: var(--vp-c-brand-soft);
  transform: scale(1.05);
}

.token.highlight-second {
  background: var(--lm-highlight-strong);
  transform: scale(1.05);
}

.current-bigram {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg-alt);
  border-radius: 0.25rem;
}

.current-bigram.complete {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.arrow {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
}

@media (prefers-reduced-motion: reduce) {
  .token {
    transition: none;
  }
}
</style>
