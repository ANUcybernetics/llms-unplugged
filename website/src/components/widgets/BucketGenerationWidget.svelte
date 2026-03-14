<script lang="ts">
  import { onMount } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import {
    createBucketGenerationMachine,
    selectStartWord,
  } from "../../lib/machines/bucketGeneration";
  import type { BucketGenerationState } from "../../lib/machines/bucketGeneration";
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
  import { buildBucketsFromModel } from "../../lib/buckets";
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
  let buckets = $derived(buildBucketsFromModel(vocabulary, model));

  let machine = $derived(createBucketGenerationMachine(model, vocabulary));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.GENERATION_DEFAULT_STEP_INTERVAL_MS,
    loop,
  });

  let { outputWords, phase } = $derived(scheduler.state);
  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let animatingIndex = $state<number | null>(null);
  let isShuffling = $state(false);

  let prevPhase = $state<BucketGenerationState["phase"]["kind"]>("idle");
  $effect(() => {
    const current = phase;
    if (current.kind === "picked" && prevPhase === "showing-bucket") {
      animatePicking(current.pickedIndex);
    } else if (current.kind !== "picked") {
      animatingIndex = null;
      isShuffling = false;
    }
    prevPhase = current.kind;
  });

  function animatePicking(finalIndex: number) {
    isShuffling = true;
    const frameMs = Math.max(20, scheduler.stepInterval * 0.025);
    const bucketTokens =
      phase.kind === "picked"
        ? (buckets.find((b) => b.label === currentWord)?.tokens ?? [])
        : [];
    let frame = 0;
    const totalFrames = 10;

    function tick() {
      if (frame < totalFrames) {
        animatingIndex = Math.floor(Math.random() * bucketTokens.length);
        frame++;
        setTimeout(tick, frameMs);
      } else {
        animatingIndex = finalIndex;
        isShuffling = false;
      }
    }
    tick();
  }

  let displayIndex = $derived(
    isShuffling
      ? animatingIndex
      : phase.kind === "picked"
        ? phase.pickedIndex
        : null,
  );

  function handleStartWord(word: string) {
    if (outputWords.length > 0) return;
    const newState = selectStartWord(word, model, vocabulary);
    if (newState) scheduler.setState(newState);
  }

  onMount(() => scheduler.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget bucket-generation-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="bucket-generation-input"
          class="text-input"
          rows="2"
          placeholder="Enter training text..."
          bind:value={trainingText}
        ></textarea>
      </div>

      <div class="widget-section">
        <div class="section-header">Model</div>
        <div class="buckets-content">
          {#each buckets as bucket}
            <div
              class="bucket"
              class:highlighted={bucket.label === currentWord}
              class:clickable={outputWords.length === 0 &&
                model.hasSuccessors(bucket.label)}
              class:dead-end={!model.hasSuccessors(bucket.label)}
              onclick={() => handleStartWord(bucket.label)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleStartWord(bucket.label);
              }}
            >
              <div
                class="bucket-label"
                class:punctuation={isPunctuation(bucket.label)}
              >
                {bucket.label}
              </div>
              <div class="bucket-contents">
                {#each bucket.tokens as token, i}
                  <span
                    class="bucket-token"
                    class:punctuation={isPunctuation(token)}
                    class:shuffling={bucket.label === currentWord &&
                      isShuffling &&
                      i === animatingIndex}
                    class:picked={bucket.label === currentWord &&
                      !isShuffling &&
                      i === displayIndex &&
                      phase.kind === "picked"}
                  >
                    {token}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Output</div>
        <div class="action-content">
          {#if phase.kind === "showing-bucket" && currentWord}
            <span>Looking in the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}>{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase.kind === "picked" && isShuffling && currentWord}
            <span>Picking randomly from the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}>{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase.kind === "picked" && phase.pickedToken}
            <span>Picked</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(phase.pickedToken)}
              >{phase.pickedToken}</span
            >
            <span>from the bucket!</span>
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
        sliderId="bucket-generation-speed-slider"
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
  .bucket.clickable {
    cursor: pointer;
  }

  .bucket.clickable:hover {
    border-color: var(--color-brand-hover);
  }

  .bucket.dead-end {
    opacity: 0.6;
  }

  .bucket-token.shuffling {
    background: var(--lm-highlight-medium);
    transform: scale(1.15);
    animation: shake 0.1s linear infinite;
  }

  .bucket-token.picked {
    background: var(--lm-highlight-strong);
    transform: scale(1.2);
  }

  @keyframes shake {
    0%,
    100% {
      transform: scale(1.15) translateX(0);
    }
    25% {
      transform: scale(1.15) translateX(-2px);
    }
    75% {
      transform: scale(1.15) translateX(2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bucket-token.shuffling {
      animation: none;
    }
  }
</style>
