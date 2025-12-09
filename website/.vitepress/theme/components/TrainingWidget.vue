<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { usePlayback } from "../composables/usePlayback";
import { tally } from "../utils/tally";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";

interface Props {
  initialText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialText: "the cat sat on the mat .",
});

const inputText = ref(props.initialText);
const isEditing = ref(true);

function parseTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

const tokens = computed(() => parseTokens(inputText.value));

const bigrams = computed(() => {
  const t = tokens.value;
  if (t.length < 2) return [];
  const pairs: [string, string][] = [];
  for (let i = 0; i < t.length - 1; i++) {
    pairs.push([t[i], t[i + 1]]);
  }
  if (t.length >= 2) {
    pairs.push([t[t.length - 1], t[0]]);
  }
  return pairs;
});

const vocabulary = computed(() => [...new Set(tokens.value)]);

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

const currentBigram = computed(() => {
  if (currentStep.value === 0 || currentStep.value > bigrams.value.length) {
    return null;
  }
  return bigrams.value[currentStep.value - 1];
});

const highlightedRow = computed(() => currentBigram.value?.[0] ?? null);
const highlightedCol = computed(() => currentBigram.value?.[1] ?? null);

function startTraining() {
  isEditing.value = false;
  reset();
}

function resetToEdit() {
  isEditing.value = true;
  reset();
}

function getCount(from: string, to: string): number {
  return gridCounts.value.get(`${from}->${to}`) || 0;
}

function isCurrentCell(from: string, to: string): boolean {
  return highlightedRow.value === from && highlightedCol.value === to;
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget training-widget">
      <div v-if="isEditing" class="input-section">
        <label for="training-input" class="input-label">Training text:</label>
        <textarea
          id="training-input"
          v-model="inputText"
          class="text-input"
          rows="3"
          placeholder="Enter text to train on..."
        ></textarea>
        <button type="button" class="submit-button" @click="startTraining">
          Start Training
        </button>
      </div>

      <div v-else class="training-view">
        <div class="tokens-section">
          <span class="section-label">Tokens:</span>
          <span
            v-for="(token, i) in tokens"
            :key="i"
            class="token"
            :class="{
              'highlight-first':
                currentBigram &&
                currentBigram[0] === token &&
                i === tokens.indexOf(currentBigram[0]),
              'highlight-second': currentBigram && currentBigram[1] === token,
            }"
          >
            {{ token }}
          </span>
        </div>

        <div v-if="currentBigram" class="current-bigram">
          <span class="section-label">Current bigram:</span>
          <span class="token highlight-first">{{ currentBigram[0] }}</span>
          <span class="arrow">→</span>
          <span class="token highlight-second">{{ currentBigram[1] }}</span>
        </div>
        <div v-else-if="isComplete" class="current-bigram complete">
          Training complete!
        </div>
        <div v-else class="current-bigram">
          <span class="section-label">Press Play or Step to begin</span>
        </div>

        <div class="grid-section">
          <table class="training-grid">
            <thead>
              <tr>
                <th></th>
                <th
                  v-for="word in vocabulary"
                  :key="word"
                  :class="{ 'highlight-col': highlightedCol === word }"
                >
                  <code>{{ word }}</code>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rowWord in vocabulary"
                :key="rowWord"
                :class="{ 'highlight-row': highlightedRow === rowWord }"
              >
                <td
                  class="row-header"
                  :class="{ 'highlight-row': highlightedRow === rowWord }"
                >
                  <code>{{ rowWord }}</code>
                </td>
                <td
                  v-for="colWord in vocabulary"
                  :key="colWord"
                  class="grid-cell"
                  :class="{
                    'highlight-col': highlightedCol === colWord,
                    'highlight-row': highlightedRow === rowWord,
                    'current-cell': isCurrentCell(rowWord, colWord),
                    flash: isCurrentCell(rowWord, colWord),
                  }"
                >
                  {{ tally(getCount(rowWord, colWord)) || "" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PlaybackControls
          :is-playing="isPlaying"
          :is-complete="isComplete"
          :current-step="currentStep"
          :total-steps="totalSteps"
          @play="play"
          @pause="pause"
          @step="step"
          @reset="resetToEdit"
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

.submit-button {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 0.25rem;
  background: var(--vp-c-brand-1);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background: var(--vp-c-brand-3);
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
  background: rgba(190, 131, 14, 0.4);
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

.grid-section {
  overflow-x: auto;
}

.training-grid {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
}

.training-grid th,
.training-grid td {
  padding: 0.5rem;
  text-align: center;
  min-width: 3rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-border);
}

.training-grid th {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.training-grid th.highlight-col {
  background-color: rgba(190, 131, 14, 0.3);
}

.training-grid th code,
.training-grid td code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.row-header {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.row-header.highlight-row {
  background-color: var(--vp-c-brand-soft);
}

.grid-cell {
  transition: background-color 0.2s;
}

.grid-cell.highlight-row {
  background-color: rgba(190, 131, 14, 0.15);
}

.grid-cell.highlight-col {
  background-color: rgba(190, 131, 14, 0.2);
}

.grid-cell.current-cell {
  background-color: rgba(190, 131, 14, 0.4);
}

.grid-cell.flash {
  animation: cell-flash 0.3s ease-out;
}

@keyframes cell-flash {
  0% {
    background-color: var(--vp-c-brand-1);
  }
  100% {
    background-color: rgba(190, 131, 14, 0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .token,
  .grid-cell {
    transition: none;
  }

  .grid-cell.flash {
    animation: none;
  }
}
</style>
