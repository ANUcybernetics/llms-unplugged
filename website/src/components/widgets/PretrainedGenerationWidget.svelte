<script lang="ts">
  import { onMount } from "svelte";
  import {
    getTrainingText,
    setTrainingText,
  } from "../../lib/stores/trainingText.svelte";
  import { createGenerationPlayback } from "../../lib/stores/generationPlayback.svelte";
  import {
    parseTokens,
    getVocabulary,
    buildBigramModel,
    isPunctuation,
  } from "../../lib/tokens";
  import {
    buildModelEntries,
    findWordForThresholdRoll,
  } from "../../lib/modelEntries";
  import type { ModelEntry } from "../../lib/modelEntries";
  import { rollDice } from "../../lib/diceMapping";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

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
  let modelEntries = $derived(buildModelEntries(vocabulary, model));

  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let validStarters = $derived(
    vocabulary.filter((w) => model.hasSuccessors(w)),
  );

  let currentEntry = $derived.by((): ModelEntry | null => {
    if (!currentWord) return null;
    return modelEntries.find((e) => e.prefix === currentWord) || null;
  });

  function rollMultipleDice(numDice: number): number {
    let result = 0;
    for (let i = 0; i < numDice; i++) {
      result = result * 10 + rollDice(10, 0);
    }
    return result;
  }

  function selectStartWord(word: string) {
    if (outputWords.length > 0) return;
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-entry";
  }

  function selectRandomStart() {
    if (validStarters.length > 0) {
      selectStartWord(
        validStarters[Math.floor(Math.random() * validStarters.length)],
      );
    }
  }

  async function animateDiceRoll(entry: ModelEntry): Promise<number> {
    isRolling = true;
    const finalRoll = rollMultipleDice(entry.numDice);

    for (let i = 0; i < 10; i++) {
      currentDiceRoll = rollMultipleDice(entry.numDice);
      await new Promise((resolve) =>
        setTimeout(resolve, PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS),
      );
    }

    currentDiceRoll = finalRoll;
    isRolling = false;
    return finalRoll;
  }

  async function doStep() {
    if (phase === "selecting") {
      if (outputWords.length === 0) selectRandomStart();
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
            ? findWordForThresholdRoll(entry, currentDiceRoll)
            : null;

      if (nextWord) {
        phase = "writing";
        outputWords = [...outputWords, nextWord];

        await new Promise((resolve) =>
          setTimeout(resolve, PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS),
        );

        if (model.hasSuccessors(nextWord)) {
          phase = "showing-entry";
          currentDiceRoll = null;
        } else {
          phase = "selecting";
          currentDiceRoll = null;
          playback.markComplete();
        }
      }
      return;
    }
  }

  const playback = createGenerationPlayback({
    doStep,
    resetState() {
      outputWords = [];
      currentDiceRoll = null;
      phase = "selecting";
    },
    preparePlay() {
      if (outputWords.length === 0) selectRandomStart();
    },
    loop,
  });

  onMount(() => playback.cleanup);

  function isSelectedFollower(
    entry: ModelEntry,
    follower: { word: string; threshold: number },
  ): boolean {
    if (phase !== "rolled" && phase !== "writing") return false;
    if (entry.prefix !== currentWord) return false;
    if (entry.followers.length === 1) return true;
    if (currentDiceRoll === null) return false;
    return follower.word === findWordForThresholdRoll(entry, currentDiceRoll);
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget pretrained-generation-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="pretrained-generation-input"
          class="text-input"
          rows="2"
          placeholder="Enter training text..."
          bind:value={trainingText}
        ></textarea>
      </div>

      <div class="widget-section">
        <div class="section-header">Model (booklet view)</div>
        <div class="entries-content">
          {#each modelEntries as entry}
            <div
              class="entry"
              class:highlighted={entry.prefix === currentWord}
              class:clickable={outputWords.length === 0 &&
                model.hasSuccessors(entry.prefix)}
              class:dead-end={!model.hasSuccessors(entry.prefix)}
              onclick={() => selectStartWord(entry.prefix)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  selectStartWord(entry.prefix);
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
                {#each entry.followers as follower}
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
        <div class="section-header">Output</div>
        <div class="action-content">
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
                {#if findWordForThresholdRoll(currentEntry, currentDiceRoll)}
                  <span
                    class="token highlight-second"
                    class:punctuation={isPunctuation(
                      findWordForThresholdRoll(currentEntry, currentDiceRoll) || "",
                    )}>{findWordForThresholdRoll(currentEntry, currentDiceRoll)}</span
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
          {:else if playback.isComplete}
            <span class="complete-message">Generation complete!</span>
          {/if}
        </div>
        <div class="output-content">
          {#if outputWords.length > 0}
            {#each outputWords as word, i}
              <span
                class="output-word"
                class:latest={i === outputWords.length - 1}
                >{#if i > 0 && word !== "," && word !== "."}{" "}{/if}{word}</span
              >
            {/each}
          {/if}
        </div>
      </div>

      <PlaybackSection
        isPlaying={playback.isPlaying}
        isComplete={playback.isComplete}
        stepInterval={playback.stepInterval}
        {loop}
        sliderId="pretrained-speed-slider"
        onplay={playback.play}
        onpause={playback.pause}
        onstep={playback.step}
        onreset={playback.reset}
        onstepintervalchange={(v) => (playback.stepInterval = v)}
      />
    </div>
  </div>
</FullscreenWrapper>

<style>
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

  @media (prefers-reduced-motion: reduce) {
    .entry,
    .follower {
      transition: none;
    }
  }
</style>
