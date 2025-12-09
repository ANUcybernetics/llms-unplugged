<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch, onUnmounted } from "vue";
import { parseTokens, getVocabulary, buildBigramModel } from "../utils/tokens";
import {
  createDiceMapping,
  rollDice,
  findWordForRoll,
} from "../utils/diceMapping";
import type { DiceMapping } from "../utils/diceMapping";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";
import BigramGrid from "./BigramGrid.vue";

const DICE_ROLL_ANIMATION_MS = 80;
const POST_WRITE_PAUSE_MS = 800;
const STEP_INTERVAL_MS = 100;

interface Props {
  initialText?: string;
  diceSides?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialText: "the cat sat on the mat .",
  diceSides: 10,
});

const trainingText = ref(props.initialText);
const outputWords = ref<string[]>([]);
const currentDiceRoll = ref<number | null>(null);
const currentMappings = ref<DiceMapping[]>([]);
const isRolling = ref(false);

type Phase = "selecting" | "showing-options" | "rolling" | "rolled" | "writing";
const phase = ref<Phase>("selecting");

const tokens = computed(() => parseTokens(trainingText.value));
const vocabulary = computed(() => getVocabulary(tokens.value));
const model = computed(() => buildBigramModel(tokens.value));

const currentWord = computed(() => {
  if (outputWords.value.length === 0) return null;
  return outputWords.value[outputWords.value.length - 1];
});

const currentRowOptions = computed(() => {
  if (!currentWord.value) return [];
  const row = model.value.counts.get(currentWord.value);
  if (!row) return [];
  return [...row.entries()]
    .filter(([, count]) => count > 0)
    .map(([word, count]) => ({ word, count }));
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
  currentDiceRoll.value = null;
  currentMappings.value = [];
  phase.value = "selecting";
  isPlaying.value = false;
  isComplete.value = false;
}

function selectStartWord(word: string) {
  if (!model.value.hasSuccessors(word)) return;
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
    await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_MS));
  }

  currentDiceRoll.value = finalRoll;
  isRolling.value = false;
  return finalRoll;
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

  if (phase.value === "showing-options") {
    phase.value = "rolling";
    await animateDiceRoll();
    phase.value = "rolled";
    return;
  }

  if (phase.value === "rolled") {
    const nextWord = findWordForRoll(
      currentMappings.value,
      currentDiceRoll.value!,
    );
    if (nextWord) {
      phase.value = "writing";
      outputWords.value = [...outputWords.value, nextWord];

      await new Promise((resolve) => setTimeout(resolve, POST_WRITE_PAUSE_MS));

      if (model.value.hasSuccessors(nextWord)) {
        phase.value = "showing-options";
        currentDiceRoll.value = null;
        currentMappings.value = createDiceMapping(
          [...(model.value.counts.get(nextWord)?.entries() || [])]
            .filter(([, count]) => count > 0)
            .map(([word, count]) => ({ word, count })),
          props.diceSides,
        );
      } else {
        phase.value = "selecting";
        currentMappings.value = [];
        currentDiceRoll.value = null;
        isComplete.value = true;
        isPlaying.value = false;
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

function isHighlightedCol(word: string): boolean {
  if (
    phase.value !== "showing-options" &&
    phase.value !== "rolling" &&
    phase.value !== "rolled"
  )
    return false;
  return currentRowOptions.value.some((opt) => opt.word === word);
}

function handleRowClick(word: string) {
  if (outputWords.value.length === 0) {
    selectStartWord(word);
  }
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget generation-widget">
      <div class="generation-view">
        <div class="input-section">
          <label for="generation-input" class="input-label">Training text:</label>
          <textarea
            id="generation-input"
            v-model="trainingText"
            class="text-input"
            rows="2"
            placeholder="Enter training text..."
          ></textarea>
        </div>

        <div class="tokens-section">
          <span class="section-label">Tokens:</span>
          <span v-for="(token, i) in tokens" :key="i" class="token">
            {{ token }}
          </span>
        </div>

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

        <BigramGrid
          :vocabulary="vocabulary"
          :get-count="model.getCount"
          :highlighted-row="currentWord"
          :is-highlighted-col="isHighlightedCol"
          :clickable-rows="outputWords.length === 0"
          :is-row-clickable="(w) => model.hasSuccessors(w)"
          :is-dead-end="(w) => !model.hasSuccessors(w)"
          :show-row-indicator="true"
          @row-click="handleRowClick"
        />

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
              }}<template
                v-if="mapping.diceRange[0] !== mapping.diceRange[1]"
              >–{{ mapping.diceRange[1] }}</template>]→{{ mapping.word }}
            </span>
          </div>
          <div class="dice-result">
            <template v-if="currentDiceRoll !== null">
              <span class="section-label">Roll:</span>
              <span class="dice-value" :class="{ rolling: isRolling }">{{
                currentDiceRoll
              }}</span>
              <span v-if="!isRolling">
                → "<strong>{{
                  findWordForRoll(currentMappings, currentDiceRoll)
                }}</strong>"
              </span>
            </template>
            <span v-else class="dice-result-placeholder">&nbsp;</span>
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

.generation-view {
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

.token {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-alt);
  border-radius: 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
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
  min-height: 1.75rem;
}

.dice-result-placeholder {
  display: inline-block;
  height: 1.75rem;
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
  .mapping-item {
    transition: none;
  }

  .dice-value.rolling {
    animation: none;
  }
}
</style>
