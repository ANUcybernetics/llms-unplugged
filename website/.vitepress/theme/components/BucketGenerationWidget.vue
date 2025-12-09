<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch, onUnmounted } from "vue";
import { useTrainingText } from "../composables/useTrainingText";
import { parseTokens, getVocabulary, buildBigramModel } from "../utils/tokens";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";

const PICK_ANIMATION_MS = 80;
const POST_WRITE_PAUSE_MS = 800;
const STEP_INTERVAL_MS = 100;

const trainingText = useTrainingText();
const outputWords = ref<string[]>([]);
const isPickingFromBucket = ref(false);
const pickedToken = ref<string | null>(null);
const shufflingIndex = ref<number | null>(null);

type Phase = "selecting" | "showing-bucket" | "picking" | "picked" | "writing";
const phase = ref<Phase>("selecting");

const tokens = computed(() => parseTokens(trainingText.value));
const vocabulary = computed(() => getVocabulary(tokens.value));
const model = computed(() => buildBigramModel(tokens.value));

const currentWord = computed(() => {
  if (outputWords.value.length === 0) return null;
  return outputWords.value[outputWords.value.length - 1];
});

interface BucketContents {
  label: string;
  tokens: string[];
}

const buckets = computed((): BucketContents[] => {
  const bucketMap = new Map<string, string[]>();
  const order: string[] = [];

  for (const word of vocabulary.value) {
    const row = model.value.counts.get(word);
    if (row) {
      const tokensInBucket: string[] = [];
      for (const [to, count] of row.entries()) {
        for (let i = 0; i < count; i++) {
          tokensInBucket.push(to);
        }
      }
      if (tokensInBucket.length > 0) {
        bucketMap.set(word, tokensInBucket);
        order.push(word);
      }
    }
  }

  return order.map((label) => ({
    label,
    tokens: bucketMap.get(label) || [],
  }));
});

const currentBucketTokens = computed(() => {
  if (!currentWord.value) return [];
  const bucket = buckets.value.find((b) => b.label === currentWord.value);
  return bucket?.tokens || [];
});

const isPlaying = ref(false);
const isComplete = ref(false);
let playInterval: ReturnType<typeof setInterval> | null = null;

function play() {
  isPlaying.value = true;
}

function pause() {
  isPlaying.value = false;
}

onUnmounted(() => {
  if (playInterval) clearInterval(playInterval);
});

function reset() {
  outputWords.value = [];
  pickedToken.value = null;
  shufflingIndex.value = null;
  phase.value = "selecting";
  isPlaying.value = false;
  isComplete.value = false;
  isPickingFromBucket.value = false;
}

function selectStartWord(word: string) {
  if (!model.value.hasSuccessors(word)) return;
  outputWords.value = [word];
  phase.value = "showing-bucket";
}

async function animatePicking(): Promise<string> {
  isPickingFromBucket.value = true;
  const bucketTokens = currentBucketTokens.value;
  const finalIndex = Math.floor(Math.random() * bucketTokens.length);

  for (let i = 0; i < 10; i++) {
    shufflingIndex.value = Math.floor(Math.random() * bucketTokens.length);
    await new Promise((resolve) => setTimeout(resolve, PICK_ANIMATION_MS));
  }

  shufflingIndex.value = finalIndex;
  isPickingFromBucket.value = false;
  return bucketTokens[finalIndex];
}

async function doStep() {
  if (phase.value === "selecting") {
    if (outputWords.value.length === 0) {
      const validStarters = vocabulary.value.filter((w) =>
        model.value.hasSuccessors(w),
      );
      if (validStarters.length > 0) {
        const randomStart =
          validStarters[Math.floor(Math.random() * validStarters.length)];
        selectStartWord(randomStart);
      }
    }
    return;
  }

  if (phase.value === "showing-bucket") {
    phase.value = "picking";
    const picked = await animatePicking();
    pickedToken.value = picked;
    phase.value = "picked";
    return;
  }

  if (phase.value === "picked") {
    const nextWord = pickedToken.value!;
    phase.value = "writing";
    outputWords.value = [...outputWords.value, nextWord];

    await new Promise((resolve) => setTimeout(resolve, POST_WRITE_PAUSE_MS));

    if (model.value.hasSuccessors(nextWord)) {
      phase.value = "showing-bucket";
      pickedToken.value = null;
      shufflingIndex.value = null;
    } else {
      phase.value = "selecting";
      pickedToken.value = null;
      shufflingIndex.value = null;
      isComplete.value = true;
      isPlaying.value = false;
    }
    return;
  }

  if (phase.value === "picking" || phase.value === "writing") {
    return;
  }
}

function handlePlay() {
  if (outputWords.value.length === 0) {
    const validStarters = vocabulary.value.filter((w) =>
      model.value.hasSuccessors(w),
    );
    if (validStarters.length > 0) {
      const randomStart =
        validStarters[Math.floor(Math.random() * validStarters.length)];
      selectStartWord(randomStart);
    }
  }
  play();
}

watch(isPlaying, async (playing) => {
  if (playing) {
    while (isPlaying.value) {
      await doStep();
      await new Promise((resolve) => setTimeout(resolve, STEP_INTERVAL_MS));
    }
  }
});

function handleBucketClick(word: string) {
  if (outputWords.value.length === 0) {
    selectStartWord(word);
  }
}

function isPunctuation(token: string): boolean {
  return token === "." || token === ",";
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget bucket-generation-widget">
      <div class="generation-view">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="bucket-generation-input"
              v-model="trainingText"
              class="text-input"
              rows="2"
              placeholder="Enter training text..."
            ></textarea>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Generated</div>
          <div class="section-content output-content">
            <span
              v-for="(word, i) in outputWords"
              :key="i"
              class="output-word"
              :class="{ latest: i === outputWords.length - 1 }"
            ><template v-if="i > 0 && word !== ',' && word !== '.'">{{ " " }}</template>{{ word }}</span>
            <span v-if="outputWords.length === 0" class="placeholder">
              Click a bucket to select starting word, or press Play
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Buckets</div>
          <div class="section-content buckets-content">
            <div v-if="buckets.length === 0" class="placeholder">
              No buckets yet
            </div>
            <div
              v-for="bucket in buckets"
              :key="bucket.label"
              class="bucket"
              :class="{
                highlighted: bucket.label === currentWord,
                clickable: outputWords.length === 0 && model.hasSuccessors(bucket.label),
                'dead-end': !model.hasSuccessors(bucket.label),
              }"
              @click="handleBucketClick(bucket.label)"
            >
              <div
                class="bucket-label"
                :class="{ punctuation: isPunctuation(bucket.label) }"
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
                    shuffling:
                      bucket.label === currentWord &&
                      isPickingFromBucket &&
                      i === shufflingIndex,
                    picked:
                      bucket.label === currentWord &&
                      !isPickingFromBucket &&
                      i === shufflingIndex &&
                      phase === 'picked',
                  }"
                >
                  {{ token }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Current action</div>
          <div class="section-content action-content">
            <template v-if="phase === 'showing-bucket' && currentWord">
              <span>Looking in the</span>
              <span
                class="token highlight-first"
                :class="{ punctuation: isPunctuation(currentWord) }"
              >{{ currentWord }}</span>
              <span>bucket...</span>
            </template>
            <template v-else-if="phase === 'picking' && currentWord">
              <span>Picking randomly from the</span>
              <span
                class="token highlight-first"
                :class="{ punctuation: isPunctuation(currentWord) }"
              >{{ currentWord }}</span>
              <span>bucket...</span>
            </template>
            <template v-else-if="phase === 'picked' && pickedToken">
              <span>Picked</span>
              <span
                class="token highlight-second"
                :class="{ punctuation: isPunctuation(pickedToken) }"
              >{{ pickedToken }}</span>
              <span>from the bucket!</span>
            </template>
            <template v-else-if="phase === 'writing' && pickedToken">
              <span>Writing</span>
              <span
                class="token highlight-second"
                :class="{ punctuation: isPunctuation(pickedToken) }"
              >{{ pickedToken }}</span>
              <span>to output...</span>
            </template>
            <span v-else-if="isComplete" class="complete-message">
              Generation complete!
            </span>
            <span v-else class="placeholder">
              Click a bucket to start, or press Play
            </span>
          </div>
        </div>

        <PlaybackControls
          :is-playing="isPlaying"
          :is-complete="isComplete"
          :current-step="0"
          :total-steps="0"
          :show-step-counter="false"
          @play="handlePlay"
          @pause="pause"
          @step="doStep"
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

.generation-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.widget-section {
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  overflow: hidden;
}

.section-header {
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-alt);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-border);
}

.section-content {
  padding: 0.75rem;
  background: var(--vp-c-bg);
}

.text-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  resize: vertical;
}

.output-content {
  font-family: var(--vp-font-family-mono);
  min-height: 1.5rem;
}

.output-word {
  transition: color 0.2s;
}

.output-word.latest {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.placeholder {
  color: var(--vp-c-text-3);
  font-style: italic;
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
  border: 2px solid var(--vp-c-border);
  border-radius: 0.5rem;
  background: var(--vp-c-bg-alt);
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.bucket.clickable {
  cursor: pointer;
}

.bucket.clickable:hover {
  border-color: var(--vp-c-brand-2);
}

.bucket.dead-end {
  opacity: 0.6;
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
  min-height: 2rem;
  justify-content: center;
  align-content: flex-start;
}

.bucket-token {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg);
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  border: 1px solid var(--vp-c-border);
  text-align: center;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.bucket-token.punctuation {
  font-weight: 700;
  font-size: 0.875rem;
}

.bucket-token.shuffling {
  background: var(--vp-c-warning-soft, #fef3c7);
  transform: scale(1.15);
  animation: shake 0.1s linear infinite;
}

.bucket-token.picked {
  background: var(--lm-highlight-strong, #a7f3d0);
  transform: scale(1.2);
}

@keyframes shake {
  0%,
  100% {
    transform: scale(1.15) translateX(0);
  }
  25% {
    transform: scale(1.15) translateX(-2px);
  }
  75% {
    transform: scale(1.15) translateX(2px);
  }
}

.action-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.75rem;
  flex-wrap: wrap;
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

.token.punctuation {
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--vp-c-text-3);
}

.token.highlight-first {
  background: var(--vp-c-brand-soft);
}

.token.highlight-second {
  background: var(--lm-highlight-strong, #a7f3d0);
}

.complete-message {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .token,
  .bucket,
  .bucket-token,
  .output-word {
    transition: none;
  }

  .bucket-token.shuffling {
    animation: none;
  }
}
</style>
