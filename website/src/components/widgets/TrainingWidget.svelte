<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import { createTrainingMachine } from "../../lib/machines/training";
  import {
    getTrainingText,
    setTrainingText,
  } from "../../lib/stores/trainingText.svelte";
  import {
    parseTokens,
    getVocabulary,
    getBigrams,
    isPunctuation,
  } from "../../lib/tokens";
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

  let tokens = $derived(parseTokens(inputText));
  let bigrams = $derived(getBigrams(tokens));
  let vocabulary = $derived(getVocabulary(tokens));

  const machine = createTrainingMachine(untrack(() => bigrams.length));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.TRAINING_DEFAULT_STEP_INTERVAL_MS,
    loop: () => loop,
  });

  $effect(() => {
    const newTotal = bigrams.length;
    const currentStep = untrack(() => scheduler.state.currentStep);
    scheduler.setState({
      currentStep: Math.min(currentStep, newTotal),
      totalSteps: newTotal,
    });
  });

  let gridCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (
      let i = 0;
      i < scheduler.state.currentStep && i < bigrams.length;
      i++
    ) {
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
            placeholder="Enter text to train on..."
            value={inputText}
            oninput={(e) => setText(e.currentTarget.value)}
          ></textarea>
        </div>

        <div class="widget-section">
          <div class="section-header">Training text (tokenised)</div>
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
          counts={gridCounts}
          highlightedRow={highlights.row}
          highlightedCol={highlights.col}
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
