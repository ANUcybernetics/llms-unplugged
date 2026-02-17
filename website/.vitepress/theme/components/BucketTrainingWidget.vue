<script setup lang="ts">
import { computed, watch } from "vue";
import { usePlayback } from "../composables/usePlayback";
import { useTrainingText } from "../composables/useTrainingText";
import { parseTokens, getBigrams } from "../utils/tokens";
import PlaybackSection from "./PlaybackSection.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";

interface Props {
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loop: true,
});

const inputText = useTrainingText();

const tokens = computed(() => parseTokens(inputText.value));
const bigrams = computed(() => getBigrams(tokens.value));
const totalSteps = computed(() => bigrams.value.length);

const {
  currentStep,
  isPlaying,
  isComplete,
  stepInterval,
  play,
  pause,
  step,
  reset,
  setTotalSteps,
} = usePlayback(totalSteps.value, { loop: props.loop });

watch(totalSteps, (n) => setTotalSteps(n));

const buckets = computed((): { label: string; tokens: string[] }[] => {
  const bucketMap = new Map<string, string[]>();
  const order: string[] = [];

  for (let i = 0; i < currentStep.value && i < bigrams.value.length; i++) {
    const [from, to] = bigrams.value[i];
    if (!bucketMap.has(from)) {
      bucketMap.set(from, []);
      order.push(from);
    }
    bucketMap.get(from)!.push(to);
  }

  return order.map((label) => ({
    label,
    tokens: bucketMap.get(label) || [],
  }));
});

const highlights = computed(() => {
  if (currentStep.value === 0 || currentStep.value > bigrams.value.length) {
    return { bucket: null, token: null, tokenIdx: -1, nextIdx: -1 };
  }
  const bigram = bigrams.value[currentStep.value - 1];
  return {
    bucket: bigram[0],
    token: bigram[1],
    tokenIdx: currentStep.value - 1,
    nextIdx: currentStep.value,
  };
});

function isPunctuation(token: string): boolean {
  return token === "." || token === ",";
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget bucket-training-widget">
      <div class="training-view">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="bucket-training-input"
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
                punctuation: isPunctuation(token),
              }"
            >
              {{ token }}
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Current action</div>
          <div class="section-content action-content">
            <template v-if="highlights.bucket">
              <span>Put</span>
              <span
                class="token highlight-second"
                :class="{ punctuation: isPunctuation(highlights.token!) }"
                >{{ highlights.token }}</span
              >
              <span>into the</span>
              <span
                class="token highlight-first"
                :class="{ punctuation: isPunctuation(highlights.bucket) }"
                >{{ highlights.bucket }}</span
              >
              <span>bucket</span>
            </template>
            <span v-else-if="isComplete" class="complete-message"> Training complete! </span>
            <span v-else class="placeholder"> Press Play or Step to begin </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Buckets</div>
          <div class="section-content buckets-content">
            <div v-if="buckets.length === 0" class="placeholder">No buckets yet</div>
            <div
              v-for="bucket in buckets"
              :key="bucket.label"
              class="bucket"
              :class="{ highlighted: bucket.label === highlights.bucket }"
            >
              <div
                class="bucket-label"
                :class="{ punctuation: isPunctuation(bucket.label) }"
                :title="bucket.label"
              >
                {{ bucket.label }}
              </div>
              <div class="bucket-contents">
                <span
                  v-for="(token, i) in bucket.tokens"
                  :key="i"
                  class="bucket-token"
                  :class="{
                    punctuation: isPunctuation(token),
                    'just-added':
                      bucket.label === highlights.bucket && i === bucket.tokens.length - 1,
                  }"
                  :title="token"
                >
                  {{ token }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <PlaybackSection
          v-model:step-interval="stepInterval"
          :is-playing="isPlaying"
          :is-complete="isComplete"
          :current-step="currentStep"
          :total-steps="totalSteps"
          :show-step-counter="true"
          :loop="loop"
          slider-id="bucket-training-speed-slider"
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

.action-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.75rem;
  flex-wrap: wrap;
}

.complete-message {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.buckets-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  gap: 0.75rem;
  min-height: 6rem;
  align-items: stretch;
}

.bucket {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  border: 2px solid var(--vp-c-border);
  border-radius: 0.5rem;
  background: var(--vp-c-bg-alt);
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.bucket.highlighted {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.bucket-label {
  padding: 0.375rem 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  border-radius: 0.375rem 0.375rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bucket-label.punctuation {
  font-size: 1rem;
}

.bucket.highlighted .bucket-label {
  border-bottom-color: var(--vp-c-brand-1);
}

.bucket-contents {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  min-width: 0;
  min-height: 2rem;
  justify-content: center;
  align-content: flex-start;
  overflow: hidden;
}

.bucket-token {
  display: inline-block;
  max-width: 100%;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg);
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  border: 1px solid var(--vp-c-border);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.bucket-token.punctuation {
  font-weight: 700;
  font-size: 0.875rem;
}

.bucket-token.just-added {
  background: var(--lm-highlight-strong, #a7f3d0);
  transform: scale(1.1);
}

@media (prefers-reduced-motion: reduce) {
  .bucket,
  .bucket-token {
    transition: none;
  }
}
</style>
