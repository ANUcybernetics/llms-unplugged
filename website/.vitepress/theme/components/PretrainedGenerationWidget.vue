<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, computed, watch, onUnmounted } from "vue";
import { useTrainingText } from "../composables/useTrainingText";
import { parseTokens, getVocabulary, buildBigramModel } from "../utils/tokens";
import { rollDice } from "../utils/diceMapping";
import PlaybackControls from "./PlaybackControls.vue";
import FullscreenWrapper from "./FullscreenWrapper.vue";

const DICE_ROLL_ANIMATION_MS = 80;
const POST_WRITE_PAUSE_MS = 800;
const STEP_INTERVAL_MS = 100;

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
  phase.value = "selecting";
  isPlaying.value = false;
  isComplete.value = false;
}

function selectStartWord(word: string) {
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

    let nextWord: string | null;
    if (entry.followers.length === 1) {
      nextWord = entry.followers[0].word;
    } else {
      nextWord = findWordForRoll(entry, currentDiceRoll.value!);
    }

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

function handleEntryClick(prefix: string) {
  if (outputWords.value.length === 0) {
    selectStartWord(prefix);
  }
}

function isPunctuation(token: string): boolean {
  return token === "." || token === ",";
}

function isSelectedFollower(entry: ModelEntry, follower: EntryFollower): boolean {
  if (phase.value !== "rolled" && phase.value !== "writing") return false;
  if (entry.prefix !== currentWord.value) return false;
  if (entry.followers.length === 1) return true;
  if (currentDiceRoll.value === null) return false;

  for (const f of entry.followers) {
    if (currentDiceRoll.value <= f.threshold) {
      return f.word === follower.word && f.threshold === follower.threshold;
    }
  }
  return false;
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
                <span>→ first threshold ≥ {{ currentDiceRoll }} is</span>
                <span
                  class="token highlight-second"
                  :class="{ punctuation: isPunctuation(findWordForRoll(currentEntry, currentDiceRoll!)!) }"
                >{{ findWordForRoll(currentEntry, currentDiceRoll!) }}</span>
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
  .token,
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
