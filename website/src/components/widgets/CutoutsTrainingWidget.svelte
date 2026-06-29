<script lang="ts">
  import { onMount } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import { createTrainingMachine } from "../../lib/machines/training";
  import { getTrainingText, setTrainingText } from "../../lib/stores/trainingText.svelte";
  import { getBigrams, isPunctuation, parseTokens } from "../../lib/tokens";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

  interface Props {
    loop?: boolean;
  }

  let { loop = true }: Props = $props();

  let inputText = $derived(getTrainingText());

  let tokens = $derived(parseTokens(inputText));
  let bigrams = $derived(getBigrams(tokens));

  // Derived so a fresh machine (with the correct totalSteps) is built whenever
  // the text changes; the scheduler resets to its initialState on the swap, so
  // reset() and loop-restart can't restore a stale step count.
  let machine = $derived(createTrainingMachine(bigrams.length));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.TRAINING_DEFAULT_STEP_INTERVAL_MS,
    loop: () => loop,
  });

  let cutouts = $derived.by((): { label: string; tokens: string[] }[] => {
    const cutoutsByLabel = new Map<string, string[]>();
    const order: string[] = [];

    for (let i = 0; i < scheduler.state.currentStep && i < bigrams.length; i++) {
      const [from, to] = bigrams[i];
      if (!cutoutsByLabel.has(from)) {
        cutoutsByLabel.set(from, []);
        order.push(from);
      }
      cutoutsByLabel.get(from)!.push(to);
    }

    return order.map((label) => ({
      label,
      tokens: cutoutsByLabel.get(label) || [],
    }));
  });

  let highlights = $derived.by(() => {
    const step = scheduler.state.currentStep;
    if (step === 0 || step > bigrams.length) {
      return {
        match: null as string | null,
        token: null as string | null,
        tokenIdx: -1,
        nextIdx: -1,
      };
    }
    const bigram = bigrams[step - 1];
    return {
      match: bigram[0],
      token: bigram[1],
      tokenIdx: step - 1,
      nextIdx: step,
    };
  });

  onMount(() => scheduler.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget cutouts-training-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="cutouts-training-input"
          class="text-input"
          rows="2"
          aria-label="Training text"
          placeholder="Enter text to train on..."
          value={inputText}
          oninput={(e) => setTrainingText(e.currentTarget.value)}></textarea>
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
        {#if highlights.match}
          <div class="action-content">
            <span>Add</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(highlights.token!)}>{highlights.token}</span
            >
            <span>to the</span>
            <span class="token highlight-first" class:punctuation={isPunctuation(highlights.match)}
              >{highlights.match}</span
            >
            <span>cutouts</span>
          </div>
        {/if}
      </div>

      <div class="widget-section">
        <div class="section-header">Model</div>
        <div class="cutouts-content">
          {#each cutouts as cutout}
            <div class="cutout" class:highlighted={cutout.label === highlights.match}>
              <div
                class="cutout-label"
                class:punctuation={isPunctuation(cutout.label)}
                title={cutout.label}
              >
                {cutout.label}
              </div>
              <div class="cutout-contents">
                {#each cutout.tokens as token, i}
                  <span
                    class="cutout-option"
                    class:punctuation={isPunctuation(token)}
                    class:just-added={cutout.label === highlights.match &&
                      i === cutout.tokens.length - 1}
                    title={token}
                  >
                    {token}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
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
        sliderId="cutouts-training-speed-slider"
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
  .cutout-option.just-added {
    background: var(--lm-highlight-strong);
    transform: scale(1.1);
  }
</style>
