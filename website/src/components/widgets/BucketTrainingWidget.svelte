<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import { createTrainingMachine } from "../../lib/machines/training";
  import {
    getTrainingText,
    setTrainingText,
  } from "../../lib/stores/trainingText.svelte";
  import { parseTokens, getBigrams, isPunctuation } from "../../lib/tokens";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

  interface Props {
    loop?: boolean;
  }

  let { loop = true }: Props = $props();

  let inputText = $state(getTrainingText());

  $effect(() => {
    setTrainingText(inputText);
  });

  let tokens = $derived(parseTokens(inputText));
  let bigrams = $derived(getBigrams(tokens));

  const machine = createTrainingMachine(untrack(() => bigrams.length));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.TRAINING_DEFAULT_STEP_INTERVAL_MS,
    loop: untrack(() => loop),
  });

  $effect(() => {
    const newTotal = bigrams.length;
    const currentStep = untrack(() => scheduler.state.currentStep);
    scheduler.setState({
      currentStep: Math.min(currentStep, newTotal),
      totalSteps: newTotal,
    });
  });

  let buckets = $derived.by((): { label: string; tokens: string[] }[] => {
    const bucketMap = new Map<string, string[]>();
    const order: string[] = [];

    for (
      let i = 0;
      i < scheduler.state.currentStep && i < bigrams.length;
      i++
    ) {
      const [from, to] = bigrams[i];
      if (!bucketMap.has(from)) {
        bucketMap.set(from, []);
        order.push(from);
      }
      bucketMap.get(from)!.push(to);
    }

    return order.map((label) => ({
      label,
      tokens: bucketMap.get(label) || [],
    }));
  });

  let highlights = $derived.by(() => {
    const step = scheduler.state.currentStep;
    if (step === 0 || step > bigrams.length) {
      return {
        bucket: null as string | null,
        token: null as string | null,
        tokenIdx: -1,
        nextIdx: -1,
      };
    }
    const bigram = bigrams[step - 1];
    return {
      bucket: bigram[0],
      token: bigram[1],
      tokenIdx: step - 1,
      nextIdx: step,
    };
  });

  onMount(() => scheduler.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget bucket-training-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="bucket-training-input"
          class="text-input"
          rows="2"
          placeholder="Enter text to train on..."
          bind:value={inputText}
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
        {#if highlights.bucket}
          <div class="action-content">
            <span>Put</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(highlights.token!)}
              >{highlights.token}</span
            >
            <span>into the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(highlights.bucket)}
              >{highlights.bucket}</span
            >
            <span>bucket</span>
          </div>
        {/if}
      </div>

      <div class="widget-section">
        <div class="section-header">Model</div>
        <div class="buckets-content">
          {#each buckets as bucket}
            <div
              class="bucket"
              class:highlighted={bucket.label === highlights.bucket}
            >
              <div
                class="bucket-label"
                class:punctuation={isPunctuation(bucket.label)}
                title={bucket.label}
              >
                {bucket.label}
              </div>
              <div class="bucket-contents">
                {#each bucket.tokens as token, i}
                  <span
                    class="bucket-token"
                    class:punctuation={isPunctuation(token)}
                    class:just-added={bucket.label === highlights.bucket &&
                      i === bucket.tokens.length - 1}
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
        sliderId="bucket-training-speed-slider"
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
  .bucket-token.just-added {
    background: var(--lm-highlight-strong);
    transform: scale(1.1);
  }
</style>
