<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import {
    createPretrainedGenerationMachine,
    selectStartWord,
  } from "../../lib/machines/pretrainedGeneration";
  import type { PretrainedGenerationState } from "../../lib/machines/pretrainedGeneration";
  import {
    getTrainingText,
    setTrainingText,
  } from "../../lib/stores/trainingText.svelte";
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

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));
  let modelEntries = $derived(buildModelEntries(vocabulary, model));

  let machine = $derived(createPretrainedGenerationMachine(model, vocabulary));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.GENERATION_DEFAULT_STEP_INTERVAL_MS,
    loop: () => loop,
  });

  let { outputWords, phase } = $derived(scheduler.state);
  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );
  let currentEntry = $derived.by((): ModelEntry | null => {
    if (phase.kind === "showing-entry" || phase.kind === "rolled") {
      return phase.entry;
    }
    return null;
  });

  let animatedDiceRoll = $state<number | null>(null);
  let isAnimating = $state(false);

  function rollMultipleDice(numDice: number): number {
    let result = 0;
    for (let i = 0; i < numDice; i++) {
      result = result * 10 + rollDice(10, 0);
    }
    return result;
  }

  let prevPhase = $state<PretrainedGenerationState["phase"]["kind"]>("idle");
  $effect(() => {
    const current = phase;
    if (
      current.kind === "rolled" &&
      prevPhase === "showing-entry" &&
      current.diceRoll !== null
    ) {
      animateDiceRollEffect(current.entry.numDice, current.diceRoll);
    } else if (current.kind !== "rolled") {
      animatedDiceRoll = null;
      isAnimating = false;
    }
    prevPhase = current.kind;
  });

  function animateDiceRollEffect(numDice: number, finalRoll: number) {
    isAnimating = true;
    const frameMs = Math.max(20, scheduler.stepInterval * 0.025);
    let frame = 0;
    const totalFrames = 10;

    function tick() {
      if (frame < totalFrames) {
        animatedDiceRoll = rollMultipleDice(numDice);
        frame++;
        setTimeout(tick, frameMs);
      } else {
        animatedDiceRoll = finalRoll;
        isAnimating = false;
      }
    }
    tick();
  }

  let displayDiceRoll = $derived(
    isAnimating
      ? animatedDiceRoll
      : phase.kind === "rolled"
        ? phase.diceRoll
        : null,
  );

  function handleStartWord(word: string) {
    if (outputWords.length > 0) return;
    const newState = selectStartWord(word, model, vocabulary);
    if (newState) scheduler.setState(newState);
  }

  function isSelectedFollower(
    entry: ModelEntry,
    follower: { word: string; threshold: number },
  ): boolean {
    if (phase.kind !== "rolled") return false;
    if (entry.prefix !== currentWord) return false;
    if (entry.followers.length === 1) return true;
    if (phase.diceRoll === null) return false;
    return follower.word === findWordForThresholdRoll(entry, phase.diceRoll);
  }

  onMount(() => scheduler.cleanup);
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
        <div class="section-header">Model</div>
        <div class="entries-content">
          {#each modelEntries as entry}
            <div
              class="entry"
              class:highlighted={entry.prefix === currentWord}
              class:clickable={outputWords.length === 0 &&
                model.hasSuccessors(entry.prefix)}
              class:dead-end={!model.hasSuccessors(entry.prefix)}
              onclick={() => handleStartWord(entry.prefix)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleStartWord(entry.prefix);
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
          {#if phase.kind === "showing-entry" && currentEntry}
            <span>Looking up</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentEntry.prefix)}
              >{currentEntry.prefix}</span
            >
            {#if currentEntry.followers.length > 1}
              <span>
                — roll {currentEntry.numDice} d10{currentEntry.numDice > 1
                  ? "s"
                  : ""}...
              </span>
            {:else}
              <span>— only one option</span>
            {/if}
          {:else if phase.kind === "rolled" && isAnimating && currentEntry}
            <span
              >Rolling {currentEntry.numDice} d10{currentEntry.numDice > 1
                ? "s"
                : ""}...</span
            >
            <span class="dice-value rolling">{displayDiceRoll}</span>
          {:else if phase.kind === "rolled" && currentEntry}
            {#if currentEntry.followers.length > 1}
              <span>Rolled</span>
              <span class="dice-value">{displayDiceRoll}</span>
              {#if displayDiceRoll !== null}
                <span>&rarr; first threshold &ge; {displayDiceRoll} is</span>
                <span
                  class="token highlight-second"
                  class:punctuation={isPunctuation(phase.nextWord)}
                  >{phase.nextWord}</span
                >
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
          {:else if phase.kind === "complete"}
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
        isPlaying={scheduler.isPlaying}
        isComplete={scheduler.isComplete}
        stepInterval={scheduler.stepInterval}
        {loop}
        sliderId="pretrained-speed-slider"
        onplay={scheduler.play}
        onpause={scheduler.pause}
        onstep={scheduler.step}
        onreset={scheduler.reset}
        onstepintervalchange={(v) => (scheduler.stepInterval = v)}
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
