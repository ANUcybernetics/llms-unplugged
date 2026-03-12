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
  import {
    createDiceMapping,
    rollDice,
    findWordForRoll,
  } from "../../lib/diceMapping";
  import type { DiceMapping } from "../../lib/diceMapping";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import BigramGrid from "../BigramGrid.svelte";


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

  function selectStartWord(word: string) {
    if (!model.hasSuccessors(word)) return;
    outputWords = [word];
    phase = "showing-options";
    currentMappings = createDiceMapping(currentRowOptions, diceSides);
  }

  function selectRandomStart() {
    const validStarters = vocabulary.filter((w) => model.hasSuccessors(w));
    if (validStarters.length > 0) {
      selectStartWord(
        validStarters[Math.floor(Math.random() * validStarters.length)],
      );
    }
  }

  async function animateDiceRoll(frameMs: number): Promise<number> {
    isRolling = true;
    const finalRoll = rollDice(diceSides);

    for (let i = 0; i < 10; i++) {
      currentDiceRoll = rollDice(diceSides);
      await new Promise((resolve) => setTimeout(resolve, frameMs));
    }

    currentDiceRoll = finalRoll;
    isRolling = false;
    return finalRoll;
  }

  async function doStep(stepInterval: number) {
    const diceFrameMs = Math.max(20, stepInterval * 0.025);
    const writePauseMs = stepInterval * 0.25;
    if (phase === "selecting") {
      if (outputWords.length === 0) selectRandomStart();
      return;
    }

    if (phase === "showing-options") {
      phase = "rolling";
      await animateDiceRoll(diceFrameMs);
      phase = "rolled";
      return;
    }

    if (phase === "rolled") {
      const nextWord = findWordForRoll(currentMappings, currentDiceRoll!);
      if (nextWord) {
        phase = "writing";
        outputWords = [...outputWords, nextWord];

        await new Promise((resolve) =>
          setTimeout(resolve, writePauseMs),
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
          playback.markComplete();
        }
      }
      return;
    }
  }

  const playback = createGenerationPlayback({
    doStep,
    resetState() {
      outputWords = [];
      currentDiceRoll = null;
      currentMappings = [];
      phase = "selecting";
    },
    preparePlay() {
      if (outputWords.length === 0) selectRandomStart();
    },
    loop,
  });

  onMount(() => playback.cleanup);

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
    <div class="widget-view">
      <div class="input-row">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <textarea
            id="generation-input"
            class="text-input"
            rows="2"
            placeholder="Enter training text..."
            bind:value={trainingText}
          ></textarea>
        </div>

        <div class="widget-section">
          <div class="section-header">Training text (tokenised)</div>
          <div class="tokens-content">
            {#each tokens as token}
              <span
                class="token"
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

      <div class="widget-section">
        <div class="section-header">Output</div>
        <div class="action-content">
          {#if phase === "showing-options" && currentWord}
            <span>Looking up</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
            >
            <span>--- roll d{diceSides}...</span>
          {:else if phase === "rolling"}
            <span>Rolling d{diceSides}...</span>
            <span class="dice-value rolling">{currentDiceRoll}</span>
          {:else if phase === "rolled" && currentDiceRoll !== null}
            <span>Rolled</span>
            <span class="dice-value">{currentDiceRoll}</span>
            <span>&rarr;</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(
                findWordForRoll(currentMappings, currentDiceRoll) || "",
              )}
              >{findWordForRoll(currentMappings, currentDiceRoll)}</span
            >
          {:else if phase === "writing" && currentWord}
            <span>Writing</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(currentWord)}
              >{currentWord}</span
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
        sliderId="generation-speed-slider"
        onplay={playback.play}
        onpause={playback.pause}
        onstep={playback.step}
        onreset={playback.reset}
        onstepintervalchange={(v) => (playback.stepInterval = v)}
      />
    </div>
  </div>
</FullscreenWrapper>

