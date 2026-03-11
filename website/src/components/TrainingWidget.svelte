<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createPlayback } from "../lib/stores/playback.svelte";
  import {
    getTrainingText,
    setTrainingText,
  } from "../lib/stores/trainingText.svelte";
  import { parseTokens, getVocabulary, getBigrams } from "../lib/tokens";
  import PlaybackSection from "./PlaybackSection.svelte";
  import FullscreenWrapper from "./FullscreenWrapper.svelte";
  import BigramGrid from "./BigramGrid.svelte";

  interface Props {
    initialText?: string;
    loop?: boolean;
  }

  let { initialText, loop = true }: Props = $props();

  let inputText = $state(untrack(() => initialText ?? getTrainingText()));

  $effect(() => {
    if (!initialText) {
      setTrainingText(inputText);
    }
  });

  let tokens = $derived(parseTokens(inputText));
  let bigrams = $derived(getBigrams(tokens));
  let vocabulary = $derived(getVocabulary(tokens));
  const playback = createPlayback(
    () => bigrams.length,
    { loop: untrack(() => loop) },
  );

  let gridCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (let i = 0; i < playback.currentStep && i < bigrams.length; i++) {
      const [from, to] = bigrams[i];
      const key = `${from}->${to}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  });

  let highlights = $derived.by(() => {
    if (playback.currentStep === 0 || playback.currentStep > bigrams.length) {
      return {
        row: null as string | null,
        col: null as string | null,
        tokenIdx: -1,
        nextIdx: -1,
      };
    }
    const bigram = bigrams[playback.currentStep - 1];
    return {
      row: bigram[0],
      col: bigram[1],
      tokenIdx: playback.currentStep - 1,
      nextIdx: playback.currentStep,
    };
  });

  function getCount(from: string, to: string): number {
    return gridCounts.get(`${from}->${to}`) || 0;
  }

  onMount(() => playback.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget training-widget">
    <div class="training-view">
      <div class="input-row">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <textarea
            id="training-input"
            class="text-input"
            rows="2"
            placeholder="Enter text to train on..."
            bind:value={inputText}
          ></textarea>
        </div>

        <div class="widget-section">
          <div class="section-header">Tokens</div>
          <div class="tokens-content">
            {#each tokens as token, i}
              <span
                class="token"
                class:highlight-first={i === highlights.tokenIdx}
                class:highlight-second={i === highlights.nextIdx}
                class:punctuation={token === "." || token === ","}
              >
                {token}
              </span>
            {/each}
          </div>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Model grid</div>
        <BigramGrid
          {vocabulary}
          {getCount}
          counts={gridCounts}
          highlightedRow={highlights.row}
          highlightedCol={highlights.col}
        />
      </div>

      <div class="status-row">
        <div class="widget-section">
          <div class="section-header">Current bigram</div>
          <div class="bigram-content">
            {#if highlights.row}
              <span
                class="token highlight-first"
                class:punctuation={highlights.row === "." ||
                  highlights.row === ","}
              >
                {highlights.row}
              </span>
              <span class="arrow">&rarr;</span>
              <span
                class="token highlight-second"
                class:punctuation={highlights.col === "." ||
                  highlights.col === ","}
              >
                {highlights.col}
              </span>
            {:else if playback.isComplete}
              <span class="complete-message">Training complete!</span>
            {/if}
          </div>
        </div>

        <PlaybackSection
          isPlaying={playback.isPlaying}
          isComplete={playback.isComplete}
          currentStep={playback.currentStep}
          totalSteps={playback.totalSteps}
          showStepCounter={true}
          stepInterval={playback.stepInterval}
          {loop}
          sliderId="training-speed-slider"
          onplay={playback.play}
          onpause={playback.pause}
          onstep={playback.step}
          onreset={playback.reset}
          onstepintervalchange={(v) => (playback.stepInterval = v)}
        />
      </div>
    </div>
  </div>
</FullscreenWrapper>

<style>
  .training-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-row,
  .status-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @container (min-width: 640px) {
    .input-row {
      flex-direction: row;
    }

    .input-row > :global(*) {
      flex: 1;
      min-width: 0;
    }

    .status-row {
      flex-direction: row;
      align-items: start;
    }

    .status-row > :global(:first-child) {
      flex: 0 0 16rem;
    }

    .status-row > :global(:last-child) {
      flex: 1;
      min-width: 0;
    }
  }

  .tokens-content {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .bigram-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.75rem;
  }

  .complete-message {
    color: var(--color-brand);
    font-weight: 600;
  }

  .arrow {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
  }
</style>
