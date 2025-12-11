<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch, onUnmounted } from "vue";
import { useTrainingText } from "../composables/useTrainingText";
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
import { PLAYBACK_CONFIG } from "../config/playback";

const DICE_ROLL_ANIMATION_MS = PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS;
const POST_WRITE_PAUSE_MS = PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS;

interface Props {
  diceSides?: number;
}

const props = withDefaults(defineProps<Props>(), {
  diceSides: 10,
});

const trainingText = useTrainingText();
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
const stepInterval = ref(PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS);
let abortController: AbortController | null = null;

const speedLabel = computed(() => {
  if (stepInterval.value < 200) return 'Fast';
  if (stepInterval.value < 600) return 'Normal';
  return 'Slow';
});

function play() {
  isPlaying.value = true;
}

function pause() {
  isPlaying.value = false;
}

onUnmounted(() => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
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
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
      while (isPlaying.value && !signal.aborted) {
        await doStep();
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, stepInterval.value);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  } else if (abortController) {
    abortController.abort();
    abortController = null;
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
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="generation-input"
              v-model="trainingText"
              class="text-input"
              rows="2"
              placeholder="Enter training text..."
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
              :class="{ punctuation: token === '.' || token === ',' }"
            >
              {{ token }}
            </span>
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
              Click a row to select starting word, or press Play
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Model grid</div>
          <div class="section-content">
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
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Dice mapping (d{{ diceSides }})</div>
          <div class="section-content dice-content">
            <template v-if="currentMappings.length > 0">
              <div class="dice-mapping">
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
                  <span class="result-label">Roll:</span>
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
            </template>
            <span v-else class="placeholder">
              Select a starting word to see dice mapping
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Controls</div>
          <div class="section-content controls-content">
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
            <div class="speed-control">
              <label for="speed-slider">Speed:</label>
              <input
                id="speed-slider"
                v-model.number="stepInterval"
                type="range"
                :min="PLAYBACK_CONFIG.MIN_STEP_INTERVAL_MS"
                :max="PLAYBACK_CONFIG.MAX_STEP_INTERVAL_MS"
                step="50"
              />
              <span class="speed-label">{{ speedLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullscreenWrapper>
</template>

<style scoped>
@import "../styles/widget-base.css";

.generation-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tokens-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
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

.dice-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 3rem;
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

.result-label {
  font-weight: 600;
  color: var(--vp-c-text-2);
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
