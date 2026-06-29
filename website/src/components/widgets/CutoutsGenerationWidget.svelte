<script lang="ts">
  import { onMount } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import {
    createCutoutsGenerationMachine,
    selectStartWord,
  } from "../../lib/machines/cutoutsGeneration";
  import type { CutoutsGenerationState } from "../../lib/machines/cutoutsGeneration";
  import { getTrainingText, setTrainingText } from "../../lib/stores/trainingText.svelte";
  import { buildBigramModel, getVocabulary, isPunctuation, parseTokens } from "../../lib/tokens";
  import { buildCutoutsFromModel } from "../../lib/cutouts";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

  interface Props {
    loop?: boolean;
  }

  let { loop = true }: Props = $props();

  let trainingText = $derived(getTrainingText());

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));
  let cutouts = $derived(buildCutoutsFromModel(vocabulary, model));

  let machine = $derived(createCutoutsGenerationMachine(model, vocabulary));
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.GENERATION_DEFAULT_STEP_INTERVAL_MS,
    loop: () => loop,
  });

  let { outputWords, phase } = $derived(scheduler.state);
  let currentWord = $derived(outputWords.length === 0 ? null : outputWords.at(-1));

  let animatingIndex = $state<number | null>(null);
  let isShuffling = $state(false);

  let prevPhase = $state<CutoutsGenerationState["phase"]["kind"]>("idle");
  $effect(() => {
    const current = phase;
    if (current.kind === "picked" && prevPhase === "showing-matches") {
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
    const matchingTokens =
      phase.kind === "picked" ? (cutouts.find((c) => c.label === currentWord)?.tokens ?? []) : [];
    let frame = 0;
    const totalFrames = 10;

    function tick() {
      if (frame < totalFrames) {
        animatingIndex = Math.floor(Math.random() * matchingTokens.length);
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
    isShuffling ? animatingIndex : phase.kind === "picked" ? phase.pickedIndex : null,
  );

  function handleStartWord(word: string) {
    if (outputWords.length > 0) return;
    const newState = selectStartWord(word, model, vocabulary);
    if (newState) scheduler.setState(newState);
  }

  onMount(() => scheduler.cleanup);
</script>

<FullscreenWrapper>
  <div class="lm-widget cutouts-generation-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="cutouts-generation-input"
          class="text-input"
          rows="2"
          aria-label="Training text"
          placeholder="Enter training text..."
          value={trainingText}
          oninput={(e) => setTrainingText(e.currentTarget.value)}></textarea>
      </div>

      <div class="widget-section">
        <div class="section-header">Model</div>
        <div class="cutouts-content">
          {#each cutouts as cutout}
            {@const actionable = outputWords.length === 0 && model.hasSuccessors(cutout.label)}
            <div
              class="cutout"
              class:highlighted={cutout.label === currentWord}
              class:clickable={actionable}
              class:dead-end={!model.hasSuccessors(cutout.label)}
              onclick={() => handleStartWord(cutout.label)}
              role="button"
              aria-disabled={!actionable}
              tabindex={actionable ? 0 : -1}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleStartWord(cutout.label);
                }
              }}
            >
              <div class="cutout-label" class:punctuation={isPunctuation(cutout.label)}>
                {cutout.label}
              </div>
              <div class="cutout-contents">
                {#each cutout.tokens as token, i}
                  <span
                    class="cutout-option"
                    class:punctuation={isPunctuation(token)}
                    class:shuffling={cutout.label === currentWord &&
                      isShuffling &&
                      i === animatingIndex}
                    class:picked={cutout.label === currentWord &&
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
          {#if phase.kind === "showing-matches" && currentWord}
            <span>Looking for the</span>
            <span class="token highlight-first" class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
            >
            <span>cutouts...</span>
          {:else if phase.kind === "picked" && isShuffling && currentWord}
            <span>Picking randomly from the</span>
            <span class="token highlight-first" class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
            >
            <span>cutouts...</span>
          {:else if phase.kind === "picked" && phase.pickedToken}
            <span>Picked</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(phase.pickedToken)}>{phase.pickedToken}</span
            >
            <span>from the</span>
            {#if currentWord}
              <span class="token highlight-first" class:punctuation={isPunctuation(currentWord)}
                >{currentWord}</span
              >
            {/if}
            <span>cutouts!</span>
          {:else if phase.kind === "complete"}
            <span class="complete-message">Generation complete!</span>
          {/if}
        </div>
        <div class="output-content">
          {#if outputWords.length > 0}
            {#each outputWords as word, i}
              <span class="output-word" class:latest={i === outputWords.length - 1}
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
        sliderId="cutouts-generation-speed-slider"
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
  .cutout.clickable {
    cursor: pointer;
  }

  .cutout.clickable:hover {
    border-color: var(--at-accent-hover);
  }

  .cutout.dead-end {
    opacity: 0.6;
  }

  .cutout-option.shuffling {
    background: var(--lm-highlight-medium);
    transform: scale(1.15);
    animation: shake 0.1s linear infinite;
  }

  .cutout-option.picked {
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
    .cutout-option.shuffling {
      animation: none;
    }
  }
</style>
