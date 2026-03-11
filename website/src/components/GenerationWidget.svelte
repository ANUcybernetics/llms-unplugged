<script lang="ts">
  import { onMount } from "svelte";
  import {
    getTrainingText,
    setTrainingText,
  } from "../lib/stores/trainingText.svelte";
  import { parseTokens, getVocabulary, buildBigramModel } from "../lib/tokens";
  import {
    createDiceMapping,
    rollDice,
    findWordForRoll,
  } from "../lib/diceMapping";
  import type { DiceMapping } from "../lib/diceMapping";
  import PlaybackSection from "./PlaybackSection.svelte";
  import FullscreenWrapper from "./FullscreenWrapper.svelte";
  import BigramGrid from "./BigramGrid.svelte";
  import { PLAYBACK_CONFIG } from "../lib/config/playback";

  const DICE_ROLL_ANIMATION_MS = PLAYBACK_CONFIG.DICE_ROLL_ANIMATION_MS;
  const POST_WRITE_PAUSE_MS = PLAYBACK_CONFIG.POST_WRITE_PAUSE_MS;
  const DEFAULT_STEP_INTERVAL_MS = PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS;

  interface Props {
    diceSides?: number;
    loop?: boolean;
  }

  let { diceSides = 10, loop = true }: Props = $props();

  let trainingText = $state(getTrainingText());

  $effect(() => {
    setTrainingText(trainingText);
  });

  let outputWords = $state<string[]>([]);
  let currentDiceRoll = $state<number | null>(null);
  let currentMappings = $state<DiceMapping[]>([]);
  let isRolling = $state(false);

  type Phase =
    | "selecting"
    | "showing-options"
    | "rolling"
    | "rolled"
    | "writing";
  let phase = $state<Phase>("selecting");

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));

  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let currentRowOptions = $derived.by(() => {
    if (!currentWord) return [];
    const row = model.counts.get(currentWord);
    if (!row) return [];
    return [...row.entries()]
      .filter(([, count]) => count > 0)
      .map(([word, count]) => ({ word, count }));
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
    currentDiceRoll = null;
    currentMappings = [];
    phase = "selecting";
    isPlaying = false;
    isComplete = false;
  }

  function selectStartWord(word: string) {
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-options";
    currentMappings = createDiceMapping(currentRowOptions, diceSides);
  }

  async function animateDiceRoll(): Promise<number> {
    isRolling = true;
    const finalRoll = rollDice(diceSides);

    for (let i = 0; i < 10; i++) {
      currentDiceRoll = rollDice(diceSides);
      await new Promise((resolve) =>
        setTimeout(resolve, DICE_ROLL_ANIMATION_MS),
      );
    }

    currentDiceRoll = finalRoll;
    isRolling = false;
    return finalRoll;
  }

  async function doStep() {
    if (phase === "selecting") {
      if (outputWords.length === 0) {
        const validStarters = vocabulary.filter((w) => model.hasSuccessors(w));
        if (validStarters.length > 0) {
          const randomStart =
            validStarters[Math.floor(Math.random() * validStarters.length)];
          selectStartWord(randomStart);
        }
      }
      return;
    }

    if (phase === "showing-options") {
      phase = "rolling";
      await animateDiceRoll();
      phase = "rolled";
      return;
    }

    if (phase === "rolled") {
      const nextWord = findWordForRoll(currentMappings, currentDiceRoll!);
      if (nextWord) {
        phase = "writing";
        outputWords = [...outputWords, nextWord];

        await new Promise((resolve) =>
          setTimeout(resolve, POST_WRITE_PAUSE_MS),
        );

        if (model.hasSuccessors(nextWord)) {
          phase = "showing-options";
          currentDiceRoll = null;
          currentMappings = createDiceMapping(
            [...(model.counts.get(nextWord)?.entries() || [])]
              .filter(([, count]) => count > 0)
              .map(([word, count]) => ({ word, count })),
            diceSides,
          );
        } else {
          phase = "selecting";
          currentMappings = [];
          currentDiceRoll = null;
          isComplete = true;
          if (!loop) {
            isPlaying = false;
          }
        }
      }
      return;
    }

    if (phase === "rolling" || phase === "writing") {
      return;
    }
  }

  function resetPlayState() {
    outputWords = [];
    currentDiceRoll = null;
    currentMappings = [];
    phase = "selecting";
    isComplete = false;
  }

  function handlePlay() {
    if (isComplete) {
      resetPlayState();
    }
    if (outputWords.length === 0) {
      const validStarters = vocabulary.filter((w) => model.hasSuccessors(w));
      if (validStarters.length > 0) {
        const randomStart =
          validStarters[Math.floor(Math.random() * validStarters.length)];
        selectStartWord(randomStart);
      }
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

  function isHighlightedCol(word: string): boolean {
    if (
      phase !== "showing-options" &&
      phase !== "rolling" &&
      phase !== "rolled"
    )
      return false;
    return currentRowOptions.some((opt) => opt.word === word);
  }

  function handleRowClick(word: string) {
    if (outputWords.length === 0) {
      selectStartWord(word);
    }
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget generation-widget">
    <div class="generation-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <div class="section-content">
          <textarea
            id="generation-input"
            class="text-input"
            rows="2"
            placeholder="Enter training text..."
            bind:value={trainingText}
          ></textarea>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Tokens</div>
        <div class="section-content tokens-content">
          {#each tokens as token, i}
            <span
              class="token"
              class:punctuation={token === "." || token === ","}
            >
              {token}
            </span>
          {/each}
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
              Click a row to select starting word, or press Play
            </span>
          {/if}
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Model grid</div>
        <div class="section-content">
          <BigramGrid
            {vocabulary}
            getCount={model.getCount}
            highlightedRow={currentWord}
            {isHighlightedCol}
            clickableRows={outputWords.length === 0}
            isRowClickable={(w) => model.hasSuccessors(w)}
            isDeadEnd={(w) => !model.hasSuccessors(w)}
            showRowIndicator={true}
            onrowclick={handleRowClick}
          />
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">Dice mapping (d{diceSides})</div>
        <div class="section-content dice-content">
          {#if currentMappings.length > 0}
            <div class="dice-mapping">
              {#each currentMappings as mapping}
                <span
                  class="mapping-item"
                  class:selected={currentDiceRoll !== null &&
                    currentDiceRoll >= mapping.diceRange[0] &&
                    currentDiceRoll <= mapping.diceRange[1]}
                >
                  [{mapping
                    .diceRange[0]}{#if mapping.diceRange[0] !== mapping.diceRange[1]}&ndash;{mapping
                      .diceRange[1]}{/if}]&rarr;{mapping.word}
                </span>
              {/each}
            </div>
            <div class="dice-result">
              {#if currentDiceRoll !== null}
                <span class="result-label">Roll:</span>
                <span class="dice-value" class:rolling={isRolling}
                  >{currentDiceRoll}</span
                >
                {#if !isRolling}
                  <span>
                    &rarr; "<strong
                      >{findWordForRoll(
                        currentMappings,
                        currentDiceRoll,
                      )}</strong
                    >"
                  </span>
                {/if}
              {:else}
                <span class="dice-result-placeholder">&nbsp;</span>
              {/if}
            </div>
          {:else}
            <span class="placeholder"
              >Select a starting word to see dice mapping</span
            >
          {/if}
        </div>
      </div>

      <PlaybackSection
        {isPlaying}
        {isComplete}
        {stepInterval}
        {loop}
        sliderId="generation-speed-slider"
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

  .tokens-content {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
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

  .dice-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 3rem;
  }

  .dice-mapping {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .mapping-item {
    padding: 0.25rem 0.5rem;
    background: var(--color-bg-alt);
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    transition: background-color 0.2s;
  }

  .mapping-item.selected {
    background: var(--color-brand-soft);
    color: var(--color-brand);
    font-weight: 600;
  }

  .dice-result {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.75rem;
  }

  .result-label {
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .dice-result-placeholder {
    display: inline-block;
    height: 1.75rem;
  }

  .dice-value {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: var(--color-brand);
    color: white;
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
  }

  .dice-value.rolling {
    animation: dice-spin 0.1s linear infinite;
  }

  @keyframes dice-spin {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .output-word,
    .mapping-item {
      transition: none;
    }

    .dice-value.rolling {
      animation: none;
    }
  }
</style>
