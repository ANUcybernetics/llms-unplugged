<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch } from "vue";
import { usePlayback } from "../composables/usePlayback";
import { tally } from "../utils/tally";
import {
  createDiceMapping,
  rollDice,
  findWordForRoll,
} from "../utils/diceMapping";
import type { DiceMapping } from "../utils/diceMapping";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";

interface Props {
  initialText?: string;
  diceSides?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialText: "the cat sat on the mat .",
  diceSides: 10,
});

const trainingText = ref(props.initialText);
const isEditing = ref(true);
const outputWords = ref<string[]>([]);
const currentDiceRoll = ref<number | null>(null);
const currentMappings = ref<DiceMapping[]>([]);
const isRolling = ref(false);

type Phase = "selecting" | "showing-options" | "rolling" | "writing";
const phase = ref<Phase>("selecting");

function parseTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

const tokens = computed(() => parseTokens(trainingText.value));
const vocabulary = computed(() => [...new Set(tokens.value)]);

const model = computed(() => {
  const counts = new Map<string, Map<string, number>>();
  const t = tokens.value;

  for (const word of vocabulary.value) {
    counts.set(word, new Map());
  }

  for (let i = 0; i < t.length - 1; i++) {
    const from = t[i];
    const to = t[i + 1];
    const row = counts.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  if (t.length >= 2) {
    const from = t[t.length - 1];
    const to = t[0];
    const row = counts.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  return counts;
});

const rowHasSuccessors = computed(() => {
  const result = new Map<string, boolean>();
  for (const word of vocabulary.value) {
    const row = model.value.get(word);
    const hasSuccessor = row ? [...row.values()].some((v) => v > 0) : false;
    result.set(word, hasSuccessor);
  }
  return result;
});

const currentWord = computed(() => {
  if (outputWords.value.length === 0) return null;
  return outputWords.value[outputWords.value.length - 1];
});

const currentRowOptions = computed(() => {
  if (!currentWord.value) return [];
  const row = model.value.get(currentWord.value);
  if (!row) return [];
  return [...row.entries()]
    .filter(([, count]) => count > 0)
    .map(([word, count]) => ({ word, count }));
});

const totalSteps = ref(20);

const {
  currentStep,
  isPlaying,
  isComplete,
  play,
  pause,
  step: playbackStep,
  reset: playbackReset,
  setTotalSteps,
} = usePlayback(totalSteps.value);

watch(totalSteps, (n) => setTotalSteps(n));

function startGeneration() {
  isEditing.value = false;
  outputWords.value = [];
  currentDiceRoll.value = null;
  currentMappings.value = [];
  phase.value = "selecting";
  playbackReset();
}

function resetToEdit() {
  isEditing.value = true;
  outputWords.value = [];
  currentDiceRoll.value = null;
  currentMappings.value = [];
  phase.value = "selecting";
  playbackReset();
}

function selectStartWord(word: string) {
  if (!rowHasSuccessors.value.get(word)) return;
  outputWords.value = [word];
  phase.value = "showing-options";
  currentMappings.value = createDiceMapping(
    currentRowOptions.value,
    props.diceSides,
  );
}

async function animateDiceRoll(): Promise<number> {
  isRolling.value = true;
  const finalRoll = rollDice(props.diceSides);

  for (let i = 0; i < 10; i++) {
    currentDiceRoll.value = rollDice(props.diceSides);
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  currentDiceRoll.value = finalRoll;
  isRolling.value = false;
  return finalRoll;
}

async function doStep() {
  if (phase.value === "selecting") {
    if (outputWords.value.length === 0) {
      const validStarters = vocabulary.value.filter((w) =>
        rowHasSuccessors.value.get(w),
      );
      if (validStarters.length > 0) {
        const randomStart =
          validStarters[Math.floor(Math.random() * validStarters.length)];
        selectStartWord(randomStart);
      }
    }
    return;
  }

  if (phase.value === "showing-options") {
    phase.value = "rolling";
    const roll = await animateDiceRoll();
    const nextWord = findWordForRoll(currentMappings.value, roll);
    if (nextWord) {
      phase.value = "writing";
      await new Promise((resolve) => setTimeout(resolve, 300));
      outputWords.value = [...outputWords.value, nextWord];
      playbackStep();

      if (currentStep.value >= totalSteps.value) {
        phase.value = "selecting";
      } else {
        currentMappings.value = [];
        currentDiceRoll.value = null;
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (rowHasSuccessors.value.get(nextWord)) {
          phase.value = "showing-options";
          currentMappings.value = createDiceMapping(
            [...(model.value.get(nextWord)?.entries() || [])]
              .filter(([, count]) => count > 0)
              .map(([word, count]) => ({ word, count })),
            props.diceSides,
          );
        } else {
          phase.value = "selecting";
        }
      }
    }
    return;
  }

  if (phase.value === "rolling" || phase.value === "writing") {
    return;
  }
}

function handlePlay() {
  if (outputWords.value.length === 0) {
    const validStarters = vocabulary.value.filter((w) =>
      rowHasSuccessors.value.get(w),
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
  if (playing && !isComplete.value) {
    while (isPlaying.value && !isComplete.value) {
      await doStep();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
});

function getCount(from: string, to: string): number {
  return model.value.get(from)?.get(to) || 0;
}

function isHighlightedCol(word: string): boolean {
  if (phase.value !== "showing-options" && phase.value !== "rolling")
    return false;
  return currentRowOptions.value.some((opt) => opt.word === word);
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget generation-widget">
      <div v-if="isEditing" class="input-section">
        <label for="generation-input" class="input-label">Training text:</label>
        <textarea
          id="generation-input"
          v-model="trainingText"
          class="text-input"
          rows="3"
          placeholder="Enter training text..."
        ></textarea>
        <button type="button" class="submit-button" @click="startGeneration">
          Start Generation
        </button>
      </div>

      <div v-else class="generation-view">
        <div class="output-section">
          <span class="section-label">Generated:</span>
          <span class="output-text">
            <span
              v-for="(word, i) in outputWords"
              :key="i"
              class="output-word"
              :class="{ latest: i === outputWords.length - 1 }"
            >
              {{ word }}{{ " " }}
            </span>
            <span v-if="outputWords.length === 0" class="placeholder">
              Click a row to select starting word, or press Play
            </span>
          </span>
        </div>

        <div class="grid-section">
          <table class="generation-grid">
            <thead>
              <tr>
                <th></th>
                <th
                  v-for="word in vocabulary"
                  :key="word"
                  :class="{ 'highlight-col': isHighlightedCol(word) }"
                >
                  <code>{{ word }}</code>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rowWord in vocabulary"
                :key="rowWord"
                :class="{
                  'highlight-row': currentWord === rowWord,
                  'dead-end': !rowHasSuccessors.get(rowWord),
                  clickable:
                    outputWords.length === 0 && rowHasSuccessors.get(rowWord),
                }"
                @click="
                  outputWords.length === 0 &&
                    rowHasSuccessors.get(rowWord) &&
                    selectStartWord(rowWord)
                "
              >
                <td
                  class="row-header"
                  :class="{ 'highlight-row': currentWord === rowWord }"
                >
                  <span v-if="currentWord === rowWord" class="row-indicator">▸</span>
                  <code>{{ rowWord }}</code>
                </td>
                <td
                  v-for="colWord in vocabulary"
                  :key="colWord"
                  class="grid-cell"
                  :class="{
                    'highlight-col':
                      isHighlightedCol(colWord) && currentWord === rowWord,
                    'highlight-row': currentWord === rowWord,
                  }"
                >
                  {{ tally(getCount(rowWord, colWord)) || "" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="currentMappings.length > 0" class="dice-section">
          <div class="dice-mapping">
            <span class="section-label">Dice mapping (d{{ diceSides }}):</span>
            <span
              v-for="mapping in currentMappings"
              :key="mapping.word"
              class="mapping-item"
              :class="{
                selected:
                  currentDiceRoll &&
                  currentDiceRoll >= mapping.diceRange[0] &&
                  currentDiceRoll <= mapping.diceRange[1],
              }"
            >
              [{{ mapping.diceRange[0]
              }}<template v-if="mapping.diceRange[0] !== mapping.diceRange[1]">-{{ mapping.diceRange[1] }}</template>]={{ mapping.word }}
            </span>
          </div>
          <div v-if="currentDiceRoll !== null" class="dice-result">
            <span class="section-label">Roll:</span>
            <span class="dice-value" :class="{ rolling: isRolling }">{{
              currentDiceRoll
            }}</span>
            <span v-if="!isRolling">
              → "<strong>{{
                findWordForRoll(currentMappings, currentDiceRoll)
              }}</strong>"
            </span>
          </div>
        </div>

        <PlaybackControls
          :is-playing="isPlaying"
          :is-complete="isComplete"
          :current-step="currentStep"
          :total-steps="totalSteps"
          @play="handlePlay"
          @pause="pause"
          @step="doStep"
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

.generation-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.output-section {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 0.25rem;
  min-height: 3rem;
}

.section-label {
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 0.5rem;
}

.output-text {
  font-family: var(--vp-font-family-mono);
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

.grid-section {
  overflow-x: auto;
}

.generation-grid {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
}

.generation-grid th,
.generation-grid td {
  padding: 0.5rem;
  text-align: center;
  min-width: 3rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-border);
}

.generation-grid th {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.generation-grid th.highlight-col {
  background-color: rgba(190, 131, 14, 0.3);
}

.generation-grid th code,
.generation-grid td code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.generation-grid tr.clickable {
  cursor: pointer;
}

.generation-grid tr.clickable:hover .row-header {
  background-color: var(--vp-c-brand-soft);
}

.generation-grid tr.dead-end {
  opacity: 0.4;
}

.generation-grid tr.highlight-row {
  background-color: rgba(190, 131, 14, 0.1);
}

.row-header {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
  position: relative;
}

.row-header.highlight-row {
  background-color: var(--vp-c-brand-soft);
}

.row-indicator {
  position: absolute;
  left: 0.25rem;
  color: var(--vp-c-brand-1);
}

.grid-cell {
  transition: background-color 0.2s;
}

.grid-cell.highlight-row {
  background-color: rgba(190, 131, 14, 0.1);
}

.grid-cell.highlight-col {
  background-color: rgba(190, 131, 14, 0.3);
}

.dice-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 0.25rem;
}

.dice-mapping {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.mapping-item {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-alt);
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.mapping-item.selected {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.dice-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dice-value {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  min-width: 2rem;
  text-align: center;
}

.dice-value.rolling {
  animation: dice-spin 0.1s linear infinite;
}

@keyframes dice-spin {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .output-word,
  .grid-cell,
  .mapping-item {
    transition: none;
  }

  .dice-value.rolling {
    animation: none;
  }
}
</style>
