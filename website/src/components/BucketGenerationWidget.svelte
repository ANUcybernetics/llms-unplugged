<script lang="ts">
  import { onMount } from "svelte";
  import {
    getTrainingText,
    setTrainingText,
  } from "../lib/stores/trainingText.svelte";
  import { parseTokens, getVocabulary, buildBigramModel } from "../lib/tokens";
  import PlaybackSection from "./PlaybackSection.svelte";
  import FullscreenWrapper from "./FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../lib/config/playback";

  const PICK_ANIMATION_MS = PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS;
  const POST_WRITE_PAUSE_MS = PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS;
  const DEFAULT_STEP_INTERVAL_MS = PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS;

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

  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let validStarters = $derived(
    vocabulary.filter((w) => model.hasSuccessors(w)),
  );

  interface BucketContents {
    label: string;
    tokens: string[];
  }

  let buckets = $derived.by((): BucketContents[] => {
    const bucketMap = new Map<string, string[]>();
    const order: string[] = [];

    for (const word of vocabulary) {
      const row = model.counts.get(word);
      if (row) {
        const tokensInBucket: string[] = [];
        for (const [to, count] of row.entries()) {
          for (let i = 0; i < count; i++) {
            tokensInBucket.push(to);
          }
        }
        if (tokensInBucket.length > 0) {
          bucketMap.set(word, tokensInBucket);
          order.push(word);
        }
      }
    }

    return order.map((label) => ({
      label,
      tokens: bucketMap.get(label) || [],
    }));
  });

  let currentBucketTokens = $derived.by(() => {
    if (!currentWord) return [];
    const bucket = buckets.find((b) => b.label === currentWord);
    return bucket?.tokens || [];
  });

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
    pickedToken = null;
    shufflingIndex = null;
    phase = "selecting";
    isPlaying = false;
    isComplete = false;
    isPickingFromBucket = false;
  }

  function selectStartWord(word: string) {
    if (outputWords.length > 0) return;
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-bucket";
  }

  async function animatePicking(): Promise<string> {
    isPickingFromBucket = true;
    const bucketTokens = currentBucketTokens;
    const finalIndex = Math.floor(Math.random() * bucketTokens.length);

    for (let i = 0; i < 10; i++) {
      shufflingIndex = Math.floor(Math.random() * bucketTokens.length);
      await new Promise((resolve) => setTimeout(resolve, PICK_ANIMATION_MS));
    }

    shufflingIndex = finalIndex;
    isPickingFromBucket = false;
    return bucketTokens[finalIndex];
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

      await new Promise((resolve) => setTimeout(resolve, POST_WRITE_PAUSE_MS));

      if (model.hasSuccessors(nextWord)) {
        phase = "showing-bucket";
        pickedToken = null;
        shufflingIndex = null;
      } else {
        phase = "selecting";
        pickedToken = null;
        shufflingIndex = null;
        isComplete = true;
        if (!loop) {
          isPlaying = false;
        }
      }
      return;
    }

    if (phase === "picking" || phase === "writing") {
      return;
    }
  }

  function resetPlayState() {
    outputWords = [];
    pickedToken = null;
    shufflingIndex = null;
    phase = "selecting";
    isComplete = false;
    isPickingFromBucket = false;
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

  function handleBucketClick(word: string) {
    selectStartWord(word);
  }

  function isPunctuation(token: string): boolean {
    return token === "." || token === ",";
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget bucket-generation-widget">
    <div class="generation-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <div class="section-content">
          <textarea
            id="bucket-generation-input"
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
              Click a bucket to select starting word, or press Play
            </span>
          {/if}
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Buckets</div>
        <div class="section-content buckets-content">
          {#if buckets.length === 0}
            <div class="placeholder">No buckets yet</div>
          {/if}
          {#each buckets as bucket}
            <div
              class="bucket"
              class:highlighted={bucket.label === currentWord}
              class:clickable={outputWords.length === 0 &&
                model.hasSuccessors(bucket.label)}
              class:dead-end={!model.hasSuccessors(bucket.label)}
              onclick={() => handleBucketClick(bucket.label)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleBucketClick(bucket.label);
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
        <div class="section-header">Current action</div>
        <div class="section-content action-content">
          {#if phase === "showing-bucket" && currentWord}
            <span>Looking in the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}>{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase === "picking" && currentWord}
            <span>Picking randomly from the</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}>{currentWord}</span
            >
            <span>bucket...</span>
          {:else if phase === "picked" && pickedToken}
            <span>Picked</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(pickedToken)}>{pickedToken}</span
            >
            <span>from the bucket!</span>
          {:else if phase === "writing" && pickedToken}
            <span>Writing</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(pickedToken)}>{pickedToken}</span
            >
            <span>to output...</span>
          {:else if isComplete}
            <span class="complete-message">Generation complete!</span>
          {:else}
            <span class="placeholder"
              >Click a bucket to start, or press Play</span
            >
          {/if}
        </div>
      </div>

      <PlaybackSection
        {isPlaying}
        {isComplete}
        {stepInterval}
        {loop}
        sliderId="bucket-generation-speed-slider"
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

  .buckets-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: 0.75rem;
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

  .action-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.75rem;
    flex-wrap: wrap;
  }

  .complete-message {
    color: var(--color-brand);
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    .bucket,
    .bucket-token,
    .output-word {
      transition: none;
    }

    .bucket-token.shuffling {
      animation: none;
    }
  }
</style>
