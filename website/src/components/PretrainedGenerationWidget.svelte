<script lang="ts">
  import { onMount } from "svelte";
  import {
    getTrainingText,
    setTrainingText,
  } from "../lib/stores/trainingText.svelte";
  import { parseTokens, getVocabulary, buildBigramModel } from "../lib/tokens";
  import { rollDice } from "../lib/diceMapping";
  import PlaybackSection from "./PlaybackSection.svelte";
  import FullscreenWrapper from "./FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../lib/config/playback";

  const DICE_ROLL_ANIMATION_MS = PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS;
  const POST_WRITE_PAUSE_MS = PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS;
  const DEFAULT_STEP_INTERVAL_MS = PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS;

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

  interface Props {
    loop?: boolean;
  }

  let { loop = true }: Props = $props();

  let trainingText = $state(getTrainingText());

  $effect(() => {
    setTrainingText(trainingText);
  });

  let outputWords = $state<string[]>([]);
  let currentDiceRoll = $state<number | null>(null);
  let isRolling = $state(false);

  type Phase = "selecting" | "showing-entry" | "rolling" | "rolled" | "writing";
  let phase = $state<Phase>("selecting");

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));

  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let validStarters = $derived(
    vocabulary.filter((w) => model.hasSuccessors(w)),
  );

  let modelEntries = $derived.by((): ModelEntry[] => {
    const entries: ModelEntry[] = [];

    for (const word of vocabulary) {
      const row = model.counts.get(word);
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

      followersRaw.sort((a, b) => b.count - a.count);

      const numDice = totalCount.toString().length;
      const ceiling = Math.pow(10, numDice) - 1;

      const followers: EntryFollower[] = [];
      let cumulative = -1;
      for (let i = 0; i < followersRaw.length; i++) {
        const f = followersRaw[i];
        const scaled = Math.round((f.count / totalCount) * (ceiling + 1));
        cumulative += scaled;
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

  let currentEntry = $derived.by((): ModelEntry | null => {
    if (!currentWord) return null;
    return modelEntries.find((e) => e.prefix === currentWord) || null;
  });

  function findWordForRoll(entry: ModelEntry, roll: number): string | null {
    for (const follower of entry.followers) {
      if (roll <= follower.threshold) {
        return follower.word;
      }
    }
    return entry.followers[entry.followers.length - 1]?.word || null;
  }

  let isPlaying = $state(false);
  let isComplete = $state(false);
  let stepInterval: number = $state(DEFAULT_STEP_INTERVAL_MS);
  let abortController: AbortController | null = null;

  function play() {
    isPlaying = true;
  }

  function pause() {
    isPlaying = false;
  }

  onMount(() => {
    return () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    };
  });

  function reset() {
    outputWords = [];
    currentDiceRoll = null;
    phase = "selecting";
    isPlaying = false;
    isComplete = false;
  }

  function selectStartWord(word: string) {
    if (outputWords.length > 0) return;
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-entry";
  }

  function rollMultipleDice(numDice: number): number {
    let result = 0;
    for (let i = 0; i < numDice; i++) {
      result = result * 10 + rollDice(10, 0);
    }
    return result;
  }

  async function animateDiceRoll(entry: ModelEntry): Promise<number> {
    isRolling = true;
    const finalRoll = rollMultipleDice(entry.numDice);

    for (let i = 0; i < 10; i++) {
      currentDiceRoll = rollMultipleDice(entry.numDice);
      await new Promise((resolve) =>
        setTimeout(resolve, DICE_ROLL_ANIMATION_MS),
      );
    }

    currentDiceRoll = finalRoll;
    isRolling = false;
    return finalRoll;
  }

  async function doStep() {
    if (phase === "selecting") {
      if (outputWords.length === 0 && validStarters.length > 0) {
        const randomStart =
          validStarters[Math.floor(Math.random() * validStarters.length)];
        selectStartWord(randomStart);
      }
      return;
    }

    if (phase === "showing-entry") {
      const entry = currentEntry;
      if (!entry) return;

      if (entry.followers.length === 1) {
        currentDiceRoll = null;
        phase = "rolled";
      } else {
        phase = "rolling";
        await animateDiceRoll(entry);
        phase = "rolled";
      }
      return;
    }

    if (phase === "rolled") {
      const entry = currentEntry;
      if (!entry) return;

      const nextWord =
        entry.followers.length === 1
          ? entry.followers[0].word
          : currentDiceRoll !== null
            ? findWordForRoll(entry, currentDiceRoll)
            : null;

      if (nextWord) {
        phase = "writing";
        outputWords = [...outputWords, nextWord];

        await new Promise((resolve) =>
          setTimeout(resolve, POST_WRITE_PAUSE_MS),
        );

        if (model.hasSuccessors(nextWord)) {
          phase = "showing-entry";
          currentDiceRoll = null;
        } else {
          phase = "selecting";
          currentDiceRoll = null;
          isComplete = true;
          if (!loop) {
            isPlaying = false;
          }
        }
      }
      return;
    }

    if (phase === "rolling" || phase === "writing") {
      return;
    }
  }

  function resetPlayState() {
    outputWords = [];
    currentDiceRoll = null;
    phase = "selecting";
    isComplete = false;
  }

  function handlePlay() {
    if (isComplete) {
      resetPlayState();
    }
    if (outputWords.length === 0 && validStarters.length > 0) {
      const randomStart =
        validStarters[Math.floor(Math.random() * validStarters.length)];
      selectStartWord(randomStart);
    }
    play();
  }

  $effect(() => {
    if (isPlaying) {
      abortController = new AbortController();
      const signal = abortController.signal;

      const abortableSleep = (ms: number) =>
        new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, ms);
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout);
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });

      (async () => {
        try {
          while (isPlaying && !signal.aborted) {
            await doStep();
            if (isComplete) {
              if (loop) {
                await abortableSleep(
                  stepInterval * PLAYBACK_CONFIG.LOOP_PAUSE_MULTIPLIER,
                );
                resetPlayState();
                continue;
              }
              break;
            }
            await abortableSleep(stepInterval);
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          throw error;
        }
      })();

      return () => {
        abortController?.abort();
        abortController = null;
      };
    }
  });

  function handleEntryClick(prefix: string) {
    selectStartWord(prefix);
  }

  function isPunctuation(token: string): boolean {
    return token === "." || token === ",";
  }

  function isSelectedFollower(
    entry: ModelEntry,
    follower: EntryFollower,
  ): boolean {
    if (phase !== "rolled" && phase !== "writing") return false;
    if (entry.prefix !== currentWord) return false;
    if (entry.followers.length === 1) return true;
    if (currentDiceRoll === null) return false;
    return follower.word === findWordForRoll(entry, currentDiceRoll);
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget pretrained-generation-widget">
    <div class="generation-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <div class="section-content">
          <textarea
            id="pretrained-generation-input"
            class="text-input"
            rows="2"
            placeholder="Enter training text..."
            bind:value={trainingText}
          ></textarea>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Generated</div>
        <div class="section-content output-content">
          {#each outputWords as word, i}
            <span
              class="output-word"
              class:latest={i === outputWords.length - 1}
              >{#if i > 0 && word !== "," && word !== "."}{" "}{/if}{word}</span
            >
          {/each}
          {#if outputWords.length === 0}
            <span class="placeholder">
              Click an entry to select starting word, or press Play
            </span>
          {/if}
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Model (booklet view)</div>
        <div class="section-content entries-content">
          {#if modelEntries.length === 0}
            <div class="placeholder">No entries yet</div>
          {/if}
          {#each modelEntries as entry}
            <div
              class="entry"
              class:highlighted={entry.prefix === currentWord}
              class:clickable={outputWords.length === 0 &&
                model.hasSuccessors(entry.prefix)}
              class:dead-end={!model.hasSuccessors(entry.prefix)}
              onclick={() => handleEntryClick(entry.prefix)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleEntryClick(entry.prefix);
              }}
            >
              <span
                class="entry-prefix"
                class:punctuation={isPunctuation(entry.prefix)}
              >
                {entry.prefix}
              </span>
              {#if entry.followers.length > 1}
                <span class="dice-indicator">{"♦".repeat(entry.numDice)}</span>
              {/if}
              <span class="entry-followers">
                {#each entry.followers as follower, i}
                  <span
                    class="follower"
                    class:selected={isSelectedFollower(entry, follower)}
                    class:punctuation={isPunctuation(follower.word)}
                    >{#if entry.followers.length > 1}<span class="threshold"
                        >{follower.threshold}</span
                      >|{/if}<span class="follower-word">{follower.word}</span
                    ></span
                  >
                {/each}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Current action</div>
        <div class="section-content action-content">
          {#if phase === "showing-entry" && currentEntry}
            <span>Looking up</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentEntry.prefix)}
              >{currentEntry.prefix}</span
            >
            {#if currentEntry.followers.length > 1}
              <span>
                --- roll {currentEntry.numDice} d10{currentEntry.numDice > 1
                  ? "s"
                  : ""}...
              </span>
            {:else}
              <span>--- only one option</span>
            {/if}
          {:else if phase === "rolling" && currentEntry}
            <span
              >Rolling {currentEntry.numDice} d10{currentEntry.numDice > 1
                ? "s"
                : ""}...</span
            >
            <span class="dice-value rolling">{currentDiceRoll}</span>
          {:else if phase === "rolled" && currentEntry}
            {#if currentEntry.followers.length > 1}
              <span>Rolled</span>
              <span class="dice-value">{currentDiceRoll}</span>
              {#if currentDiceRoll !== null}
                <span>&rarr; first threshold &ge; {currentDiceRoll} is</span>
                {#if findWordForRoll(currentEntry, currentDiceRoll)}
                  <span
                    class="token highlight-second"
                    class:punctuation={isPunctuation(
                      findWordForRoll(currentEntry, currentDiceRoll) || "",
                    )}>{findWordForRoll(currentEntry, currentDiceRoll)}</span
                  >
                {/if}
              {/if}
            {:else}
              <span>Only option:</span>
              <span
                class="token highlight-second"
                class:punctuation={isPunctuation(
                  currentEntry.followers[0].word,
                )}>{currentEntry.followers[0].word}</span
              >
            {/if}
          {:else if phase === "writing" && currentWord}
            <span>Writing to output...</span>
          {:else if isComplete}
            <span class="complete-message">Generation complete!</span>
          {:else}
            <span class="placeholder"
              >Click an entry to start, or press Play</span
            >
          {/if}
        </div>
      </div>

      <PlaybackSection
        {isPlaying}
        {isComplete}
        {stepInterval}
        {loop}
        sliderId="pretrained-speed-slider"
        onplay={handlePlay}
        onpause={pause}
        onstep={doStep}
        onreset={reset}
        onstepintervalchange={(v) => (stepInterval = v)}
      />
    </div>
  </div>
</FullscreenWrapper>

<style>
  .generation-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .output-content {
    font-family: var(--font-mono);
    min-height: 1.5rem;
  }

  .output-word {
    transition: color 0.2s;
  }

  .output-word.latest {
    color: var(--color-brand);
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
    background: var(--color-bg-alt);
  }

  .entry.dead-end {
    opacity: 0.6;
  }

  .entry.highlighted {
    background: var(--color-brand-soft);
  }

  .entry-prefix {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .entry-prefix.punctuation {
    display: inline-block;
    padding: 0 0.2em;
    border: 1px solid var(--color-text-muted);
    border-radius: 2px;
    font-size: 1rem;
  }

  .dice-indicator {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
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
    background: var(--color-brand-soft);
    color: var(--color-brand);
  }

  .follower.punctuation .follower-word {
    display: inline-block;
    padding: 0 0.15em;
    border: 1px solid var(--color-text-muted);
    border-radius: 2px;
  }

  .threshold {
    font-weight: 600;
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
    background: var(--color-brand);
    color: white;
    border-radius: 0.25rem;
    font-family: var(--font-mono);
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
    color: var(--color-brand);
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
