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

  let outputWords = $state<string[]>([]);
  let isPickingFromBucket = $state(false);
  let pickedToken = $state<string | null>(null);
  let shufflingIndex = $state<number | null>(null);

  type Phase =
    | "selecting"
    | "showing-bucket"
    | "picking"
    | "picked"
    | "writing";
  let phase = $state<Phase>("selecting");

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));
  let buckets = $derived(buildBucketsFromModel(vocabulary, model));

  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let validStarters = $derived(
    vocabulary.filter((w) => model.hasSuccessors(w)),
  );

  let currentBucketTokens = $derived.by(() => {
    if (!currentWord) return [];
    const bucket = buckets.find((b) => b.label === currentWord);
    return bucket?.tokens || [];
  });

  function selectStartWord(word: string) {
    if (outputWords.length > 0) return;
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-bucket";
  }

  function selectRandomStart() {
    if (validStarters.length > 0) {
      selectStartWord(
        validStarters[Math.floor(Math.random() * validStarters.length)],
      );
    }
  }

  async function animatePicking(): Promise<string> {
    isPickingFromBucket = true;
    const bucketTokens = currentBucketTokens;
    const finalIndex = Math.floor(Math.random() * bucketTokens.length);

    for (let i = 0; i < 10; i++) {
      shufflingIndex = Math.floor(Math.random() * bucketTokens.length);
      await new Promise((resolve) =>
        setTimeout(resolve, PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS),
      );
    }

    shufflingIndex = finalIndex;
    isPickingFromBucket = false;
    return bucketTokens[finalIndex];
  }

  async function doStep() {
    if (phase === "selecting") {
      if (outputWords.length === 0) selectRandomStart();
      return;
    }

    if (phase === "showing-bucket") {
      phase = "picking";
      const picked = await animatePicking();
      pickedToken = picked;
      phase = "picked";
      return;
    }

    if (phase === "picked") {
      const nextWord = pickedToken!;
      phase = "writing";
      outputWords = [...outputWords, nextWord];

      await new Promise((resolve) =>
        setTimeout(resolve, PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS),
      );

      if (model.hasSuccessors(nextWord)) {
        phase = "showing-bucket";
        pickedToken = null;
        shufflingIndex = null;
      } else {
        phase = "selecting";
        pickedToken = null;
        shufflingIndex = null;
        playback.markComplete();
      }
      return;
    }
  }

  const playback = createGenerationPlayback({
    doStep,
    resetState() {
      outputWords = [];
      pickedToken = null;
      shufflingIndex = null;
      phase = "selecting";
      isPickingFromBucket = false;
    },
    preparePlay() {
      if (outputWords.length === 0) selectRandomStart();
    },
    loop,
  });

  onMount(() => playback.cleanup);
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
              onclick={() => selectStartWord(bucket.label)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  selectStartWord(bucket.label);
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
                      isPickingFromBucket &&
                      i === shufflingIndex}
                    class:picked={bucket.label === currentWord &&
                      !isPickingFromBucket &&
                      i === shufflingIndex &&
                      phase === "picked"}
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
          {#if phase === "showing-bucket" && currentWord}
            <span>Looking in the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase === "picking" && currentWord}
            <span>Picking randomly from the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase === "picked" && pickedToken}
            <span>Picked</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(pickedToken)}
              >{pickedToken}</span
            >
            <span>from the bucket!</span>
          {:else if phase === "writing" && pickedToken}
            <span>Writing</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(pickedToken)}
              >{pickedToken}</span
            >
            <span>to output...</span>
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
        sliderId="bucket-generation-speed-slider"
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
  .buckets-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: 1rem;
    min-height: 6rem;
    align-items: stretch;
  }

  .bucket {
    display: grid;
    grid-template-rows: auto 1fr;
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-bg-alt);
    transition:
      border-color 0.2s,
      background-color 0.2s;
  }

  .bucket.clickable {
    cursor: pointer;
  }

  .bucket.clickable:hover {
    border-color: var(--color-brand-hover);
  }

  .bucket.dead-end {
    opacity: 0.6;
  }

  .bucket.highlighted {
    border-color: var(--color-brand);
    background: var(--color-brand-soft);
  }

  .bucket-label {
    padding: 0.375rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 0.375rem 0.375rem 0 0;
  }

  .bucket-label.punctuation {
    font-size: 1rem;
  }

  .bucket.highlighted .bucket-label {
    border-bottom-color: var(--color-brand);
  }

  .bucket-contents {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
    min-height: 2rem;
    justify-content: center;
    align-content: flex-start;
  }

  .bucket-token {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: var(--color-bg);
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    text-align: center;
    transition:
      background-color 0.2s,
      transform 0.2s;
  }

  .bucket-token.punctuation {
    font-weight: 700;
    font-size: 0.875rem;
  }

  .bucket-token.shuffling {
    background: var(--vp-c-warning-soft, #fef3c7);
    transform: scale(1.15);
    animation: shake 0.1s linear infinite;
  }

  .bucket-token.picked {
    background: var(--lm-highlight-strong, #a7f3d0);
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
    .bucket,
    .bucket-token {
      transition: none;
    }

    .bucket-token.shuffling {
      animation: none;
    }
  }
</style>
