<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import { createTrainingMachine } from "../../lib/machines/training";
  import { getTrainingText, setTrainingText } from "../../lib/stores/trainingText.svelte";
  import { getCjkMode, setCjkMode } from "../../lib/stores/cjkMode.svelte";
  import {
    containsCJK,
    getBigrams,
    getVocabulary,
    isPunctuation,
    parseTokens,
  } from "../../lib/tokens";
  import { tokenizeWords } from "../../lib/cjkTokenize";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import BigramGrid from "../BigramGrid.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

  interface Props {
    initialText?: string;
    loop?: boolean;
  }

  let { initialText, loop = true }: Props = $props();

  // With initialText the widget is a standalone instance; without it, it reads
  // and writes the shared training-text store so co-located widgets stay in sync.
  let localText = $state(untrack(() => initialText ?? ""));
  let inputText = $derived(initialText != null ? localText : getTrainingText());

  function setText(value: string) {
    if (initialText != null) {
      localText = value;
    } else {
      setTrainingText(value);
    }
  }

  let cjkMode = $derived(getCjkMode());
  let showCjkToggle = $derived(containsCJK(inputText));

  // Word-level Chinese needs the jieba wasm, loaded on demand, so tokens are
  // $state driven by an effect; English (and char mode) stays synchronous and
  // never touches the wasm. Effects don't run during SSR, so the server render
  // only ever sees the synchronous path.
  let tokens = $state<string[]>(parseTokens(untrack(() => inputText)));
  $effect(() => {
    const text = inputText;
    if (cjkMode === "word" && containsCJK(text)) {
      let cancelled = false;
      tokenizeWords(text).then((result) => {
        if (!cancelled) tokens = result;
      });
      return () => {
        cancelled = true;
      };
    }
    tokens = parseTokens(text);
  });

  let bigrams = $derived(getBigrams(tokens));
  let vocabulary = $derived(getVocabulary(tokens));

  // Derived so a fresh machine (with the correct totalSteps) is built whenever
  // the text changes; the scheduler resets to its initialState on the swap, so
  // reset() and loop-restart can't restore a stale step count.
  let machine = $derived(createTrainingMachine(bigrams.length));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.TRAINING_DEFAULT_STEP_INTERVAL_MS,
    loop: () => loop,
  });

  let gridCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (let i = 0; i < scheduler.state.currentStep && i < bigrams.length; i++) {
      const [from, to] = bigrams[i];
      const key = `${from}->${to}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  });

  let highlights = $derived.by(() => {
    const step = scheduler.state.currentStep;
    if (step === 0 || step > bigrams.length) {
      return {
        row: null as string | null,
        col: null as string | null,
        tokenIdx: -1,
        nextIdx: -1,
      };
    }
    const bigram = bigrams[step - 1];
    return {
      row: bigram[0],
      col: bigram[1],
      tokenIdx: step - 1,
      nextIdx: step,
    };
  });

  function getCount(from: string, to: string): number {
    return gridCounts.get(`${from}->${to}`) || 0;
  }

  // One bigram is "current" each step: its row + column band-highlight and the
  // cell at their intersection flashes as it's tallied.
  let highlightedCols: Set<string> = $derived(
    highlights.col ? new Set([highlights.col]) : new Set(),
  );
  let currentCell: [string, string] | null = $derived(
    highlights.row && highlights.col ? [highlights.row, highlights.col] : null,
  );

  onMount(() => scheduler.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget training-widget">
    <div class="widget-view">
      <div class="input-row">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <textarea
            id="training-input"
            class="text-input"
            rows="2"
            aria-label="Training text"
            placeholder="Enter text to train on..."
            value={inputText}
            oninput={(e) => setText(e.currentTarget.value)}></textarea>
        </div>

        <div class="widget-section">
          <div class="section-header">
            Training text (tokenised)
            {#if showCjkToggle}
              <span class="cjk-toggle" role="group" aria-label="Chinese segmentation">
                <button
                  type="button"
                  class:active={cjkMode === "word"}
                  onclick={() => setCjkMode("word")}>words</button>
                <button
                  type="button"
                  class:active={cjkMode === "char"}
                  onclick={() => setCjkMode("char")}>characters</button>
              </span>
            {/if}
          </div>
          <div class="tokens-content">
            {#each tokens as token, i}
              <span
                class="token"
                class:highlight-first={i === highlights.tokenIdx}
                class:highlight-second={i === highlights.nextIdx}
                class:punctuation={isPunctuation(token)}
              >
                {token}
              </span>
            {/each}
          </div>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Model</div>
        <BigramGrid
          {vocabulary}
          {getCount}
          highlightedRow={highlights.row}
          {highlightedCols}
          {currentCell}
        />
      </div>

      <PlaybackSection
        isPlaying={scheduler.isPlaying}
        isComplete={scheduler.isComplete}
        currentStep={scheduler.state.currentStep}
        totalSteps={scheduler.state.totalSteps}
        stepInterval={scheduler.stepInterval}
        minStepInterval={PLAYBACK_CONFIG.TRAINING_MIN_STEP_INTERVAL_MS}
        maxStepInterval={PLAYBACK_CONFIG.TRAINING_MAX_STEP_INTERVAL_MS}
        {loop}
        sliderId="training-speed-slider"
        onplay={scheduler.play}
        onpause={scheduler.pause}
        onstep={scheduler.step}
        onreset={scheduler.reset}
        onstepintervalchange={(v) => (scheduler.stepInterval = v)}
      />
    </div>
  </div>
</FullscreenWrapper>
