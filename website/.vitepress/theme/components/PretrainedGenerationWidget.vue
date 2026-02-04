<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch, onUnmounted } from "vue";
import { useTrainingText } from "../composables/useTrainingText";
import { parseTokens, getVocabulary, buildBigramModel } from "../utils/tokens";
import { rollDice } from "../utils/diceMapping";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";
import { PLAYBACK_CONFIG } from "../config/playback";

const DICE_ROLL_ANIMATION_MS = PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS;
const POST_WRITE_PAUSE_MS = PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS;

interface EntryFollower {
  word: string;
  count: number;
  threshold: number;
}

interface ModelEntry {
  prefix: string;
  totalCount: number;
  numDice: number;
  followers: EntryFollower[];
}

const trainingText = useTrainingText();
const outputWords = ref<string[]>([]);
const currentDiceRoll = ref<number | null>(null);
const isRolling = ref(false);

type Phase = "selecting" | "showing-entry" | "rolling" | "rolled" | "writing";
const phase = ref<Phase>("selecting");

const tokens = computed(() => parseTokens(trainingText.value));
const vocabulary = computed(() => getVocabulary(tokens.value));
const model = computed(() => buildBigramModel(tokens.value));

const currentWord = computed(() => {
  if (outputWords.value.length === 0) return null;
  return outputWords.value[outputWords.value.length - 1];
});

const validStarters = computed(() =>
  vocabulary.value.filter((w) => model.value.hasSuccessors(w))
);

const modelEntries = computed((): ModelEntry[] => {
  const entries: ModelEntry[] = [];

  for (const word of vocabulary.value) {
    const row = model.value.counts.get(word);
    if (!row) continue;

    const followersRaw: { word: string; count: number }[] = [];
    let totalCount = 0;

    for (const [to, count] of row.entries()) {
      if (count > 0) {
        followersRaw.push({ word: to, count });
        totalCount += count;
      }
    }

    if (followersRaw.length === 0) continue;

    // Sort by count descending (most likely first)
    followersRaw.sort((a, b) => b.count - a.count);

    // Calculate ceiling as 10^n - 1 (e.g., 9, 99, 999) since d10 faces are 0-9
    const numDice = totalCount.toString().length;
    const ceiling = Math.pow(10, numDice) - 1;

    // Scale counts proportionally to ceiling and compute cumulative thresholds
    const followers: EntryFollower[] = [];
    let cumulative = -1; // Start at -1 so first threshold is 0-based
    for (let i = 0; i < followersRaw.length; i++) {
      const f = followersRaw[i];
      const scaled = Math.round((f.count / totalCount) * (ceiling + 1));
      cumulative += scaled;
      // Ensure last follower reaches exactly the ceiling
      if (i === followersRaw.length - 1) {
        cumulative = ceiling;
      }
      followers.push({
        word: f.word,
        count: f.count,
        threshold: cumulative,
      });
    }

    entries.push({
      prefix: word,
      totalCount,
      numDice,
      followers,
    });
  }

  return entries;
});

const currentEntry = computed((): ModelEntry | null => {
  if (!currentWord.value) return null;
  return modelEntries.value.find((e) => e.prefix === currentWord.value) || null;
});

function findWordForRoll(entry: ModelEntry, roll: number): string | null {
  for (const follower of entry.followers) {
    if (roll <= follower.threshold) {
      return follower.word;
    }
  }
  return entry.followers[entry.followers.length - 1]?.word || null;
}

const isPlaying = ref(false);
const isComplete = ref(false);
const stepInterval = ref(PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS);
let abortController: AbortController | null = null;

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
  phase.value = "selecting";
  isPlaying.value = false;
  isComplete.value = false;
}

function selectStartWord(word: string) {
  if (outputWords.value.length > 0) return;
  if (!model.value.hasSuccessors(word)) return;
  outputWords.value = [word];
  phase.value = "showing-entry";
}

function rollMultipleDice(numDice: number): number {
  // Roll numDice d10s (0-9 each) and combine as digits
  // Result is 0-indexed: 0-9 for 1 die, 00-99 for 2 dice, etc.
  let result = 0;
  for (let i = 0; i < numDice; i++) {
    result = result * 10 + rollDice(10, 0);
  }
  return result;
}

async function animateDiceRoll(entry: ModelEntry): Promise<number> {
  isRolling.value = true;
  const finalRoll = rollMultipleDice(entry.numDice);

  for (let i = 0; i < 10; i++) {
    currentDiceRoll.value = rollMultipleDice(entry.numDice);
    await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_MS));
  }

  currentDiceRoll.value = finalRoll;
  isRolling.value = false;
  return finalRoll;
}

async function doStep() {
  if (phase.value === "selecting") {
    if (outputWords.value.length === 0 && validStarters.value.length > 0) {
      const randomStart =
        validStarters.value[Math.floor(Math.random() * validStarters.value.length)];
      selectStartWord(randomStart);
    }
    return;
  }

  if (phase.value === "showing-entry") {
    const entry = currentEntry.value;
    if (!entry) return;

    if (entry.followers.length === 1) {
      currentDiceRoll.value = null;
      phase.value = "rolled";
    } else {
      phase.value = "rolling";
      await animateDiceRoll(entry);
      phase.value = "rolled";
    }
    return;
  }

  if (phase.value === "rolled") {
    const entry = currentEntry.value;
    if (!entry) return;

    const nextWord =
      entry.followers.length === 1
        ? entry.followers[0].word
        : currentDiceRoll.value !== null
          ? findWordForRoll(entry, currentDiceRoll.value)
          : null;

    if (nextWord) {
      phase.value = "writing";
      outputWords.value = [...outputWords.value, nextWord];

      await new Promise((resolve) => setTimeout(resolve, POST_WRITE_PAUSE_MS));

      if (model.value.hasSuccessors(nextWord)) {
        phase.value = "showing-entry";
        currentDiceRoll.value = null;
      } else {
        phase.value = "selecting";
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
  if (outputWords.value.length === 0 && validStarters.value.length > 0) {
    const randomStart =
      validStarters.value[Math.floor(Math.random() * validStarters.value.length)];
    selectStartWord(randomStart);
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

function handleEntryClick(prefix: string) {
  selectStartWord(prefix);
}

function isPunctuation(token: string): boolean {
  return token === "." || token === ",";
}

function isSelectedFollower(entry: ModelEntry, follower: EntryFollower): boolean {
  if (phase.value !== "rolled" && phase.value !== "writing") return false;
  if (entry.prefix !== currentWord.value) return false;
  if (entry.followers.length === 1) return true;
  if (currentDiceRoll.value === null) return false;
  return follower.word === findWordForRoll(entry, currentDiceRoll.value);
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget pretrained-generation-widget">
      <div class="generation-view">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="pretrained-generation-input"
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
              Click an entry to select starting word, or press Play
            </span>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Model (booklet view)</div>
          <div class="section-content entries-content">
            <div v-if="modelEntries.length === 0" class="placeholder">
              No entries yet
            </div>
            <div
              v-for="entry in modelEntries"
              :key="entry.prefix"
              class="entry"
              :class="{
                highlighted: entry.prefix === currentWord,
                clickable: outputWords.length === 0 && model.hasSuccessors(entry.prefix),
                'dead-end': !model.hasSuccessors(entry.prefix),
              }"
              @click="handleEntryClick(entry.prefix)"
            >
              <span
                class="entry-prefix"
                :class="{ punctuation: isPunctuation(entry.prefix) }"
              >{{ entry.prefix }}</span>
              <span
                v-if="entry.followers.length > 1"
                class="dice-indicator"
              >{{ "♦".repeat(entry.numDice) }}</span>
              <span class="entry-followers">
                <span
                  v-for="(follower, i) in entry.followers"
                  :key="i"
                  class="follower"
                  :class="{
                    selected: isSelectedFollower(entry, follower),
                    punctuation: isPunctuation(follower.word),
                  }"
                ><template v-if="entry.followers.length > 1"><span class="threshold">{{ follower.threshold }}</span>|</template><span class="follower-word">{{ follower.word }}</span></span>
              </span>
            </div>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Current action</div>
          <div class="section-content action-content">
            <template v-if="phase === 'showing-entry' && currentEntry">
              <span>Looking up</span>
              <span
                class="token highlight-first"
                :class="{ punctuation: isPunctuation(currentEntry.prefix) }"
              >{{ currentEntry.prefix }}</span>
              <span v-if="currentEntry.followers.length > 1">
                — roll {{ currentEntry.numDice }} d10{{ currentEntry.numDice > 1 ? "s" : "" }}...
              </span>
              <span v-else>
                — only one option
              </span>
            </template>
            <template v-else-if="phase === 'rolling' && currentEntry">
              <span>Rolling {{ currentEntry.numDice }} d10{{ currentEntry.numDice > 1 ? "s" : "" }}...</span>
              <span class="dice-value rolling">{{ currentDiceRoll }}</span>
            </template>
            <template v-else-if="phase === 'rolled' && currentEntry">
              <template v-if="currentEntry.followers.length > 1">
                <span>Rolled</span>
                <span class="dice-value">{{ currentDiceRoll }}</span>
                <template v-if="currentDiceRoll !== null">
                  <span>→ first threshold ≥ {{ currentDiceRoll }} is</span>
                  <span
                    v-if="findWordForRoll(currentEntry, currentDiceRoll)"
                    class="token highlight-second"
                    :class="{ punctuation: isPunctuation(findWordForRoll(currentEntry, currentDiceRoll) || '') }"
                  >{{ findWordForRoll(currentEntry, currentDiceRoll) }}</span>
                </template>
              </template>
              <template v-else>
                <span>Only option:</span>
                <span
                  class="token highlight-second"
                  :class="{ punctuation: isPunctuation(currentEntry.followers[0].word) }"
                >{{ currentEntry.followers[0].word }}</span>
              </template>
            </template>
            <template v-else-if="phase === 'writing' && currentWord">
              <span>Writing to output...</span>
            </template>
            <span v-else-if="isComplete" class="complete-message">
              Generation complete!
            </span>
            <span v-else class="placeholder">
              Click an entry to start, or press Play
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
              <span class="speed-label">Slow</span>
              <input
                id="pretrained-speed-slider"
                v-model.number="stepInterval"
                type="range"
                :min="PLAYBACK_CONFIG.MIN_STEP_INTERVAL_MS"
                :max="PLAYBACK_CONFIG.MAX_STEP_INTERVAL_MS"
                step="50"
              />
              <span class="speed-label">Fast</span>
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

.entries-content {
  column-width: 14rem;
  column-gap: 1.5rem;
  max-height: 20rem;
  overflow-y: auto;
}

.entry {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  break-inside: avoid;
}

.entry.clickable {
  cursor: pointer;
}

.entry.clickable:hover {
  background: var(--vp-c-bg-alt);
}

.entry.dead-end {
  opacity: 0.6;
}

.entry.highlighted {
  background: var(--vp-c-brand-soft);
}

.entry-prefix {
  font-weight: 700;
  font-size: 1.1rem;
}

.entry-prefix.punctuation {
  display: inline-block;
  padding: 0 0.2em;
  border: 1px solid var(--vp-c-text-3);
  border-radius: 2px;
  font-size: 1rem;
}

.dice-indicator {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-left: 0.15em;
  margin-right: 0.25em;
}

.entry-followers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  align-items: baseline;
}

.follower {
  font-size: 0.9rem;
  transition: background-color 0.2s;
  padding: 0 0.15em;
  border-radius: 2px;
}

.follower.selected {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.follower.punctuation .follower-word {
  display: inline-block;
  padding: 0 0.15em;
  border: 1px solid var(--vp-c-text-3);
  border-radius: 2px;
}

.threshold {
  font-weight: 600;
}

.follower-word {
  /* inherit styling */
}

.action-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.75rem;
  flex-wrap: wrap;
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

.complete-message {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .entry,
  .follower,
  .output-word {
    transition: none;
  }

  .dice-value.rolling {
    animation: none;
  }
}
</style>
