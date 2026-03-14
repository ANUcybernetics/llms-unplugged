<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { createScheduler } from "../../lib/scheduler.svelte";
  import {
    createDiceGenerationMachine,
    selectStartWord,
  } from "../../lib/machines/diceGeneration";
  import type { DiceGenerationState } from "../../lib/machines/diceGeneration";
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
  import { rollDice, findWordForRoll } from "../../lib/diceMapping";
  import PlaybackSection from "../PlaybackSection.svelte";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import BigramGrid from "../BigramGrid.svelte";
  import { PLAYBACK_CONFIG } from "../../lib/config/playback";

  interface Props {
    diceSides?: number;
    loop?: boolean;
  }

  let { diceSides = 10, loop = true }: Props = $props();

  let trainingText = $state(getTrainingText());

  $effect(() => {
    setTrainingText(trainingText);
  });

  let tokens = $derived(parseTokens(trainingText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));

  let machine = $derived(
    createDiceGenerationMachine(model, vocabulary, diceSides),
  );
  const scheduler = createScheduler(() => machine, {
    defaultInterval: PLAYBACK_CONFIG.GENERATION_DEFAULT_STEP_INTERVAL_MS,
    loop: untrack(() => loop),
  });

  let { outputWords, phase } = $derived(scheduler.state);
  let currentWord = $derived(
    outputWords.length === 0 ? null : outputWords[outputWords.length - 1],
  );

  let animatedDiceRoll = $state<number | null>(null);
  let isAnimating = $state(false);

  let prevPhase = $state<DiceGenerationState["phase"]["kind"]>("idle");
  $effect(() => {
    const current = phase;
    if (current.kind === "rolled" && prevPhase === "showing-options") {
      animateDiceRoll(current.diceRoll);
    } else if (current.kind !== "rolled") {
      animatedDiceRoll = null;
      isAnimating = false;
    }
    prevPhase = current.kind;
  });

  function animateDiceRoll(finalRoll: number) {
    isAnimating = true;
    const frameMs = Math.max(20, scheduler.stepInterval * 0.025);
    let frame = 0;
    const totalFrames = 10;

    function tick() {
      if (frame < totalFrames) {
        animatedDiceRoll = rollDice(diceSides);
        frame++;
        setTimeout(tick, frameMs);
      } else {
        animatedDiceRoll = finalRoll;
        isAnimating = false;
      }
    }
    tick();
  }

  let displayDiceRoll = $derived(
    isAnimating
      ? animatedDiceRoll
      : phase.kind === "rolled"
        ? phase.diceRoll
        : null,
  );

  let currentRowOptions = $derived.by(() => {
    if (!currentWord) return [];
    const row = model.counts.get(currentWord);
    if (!row) return [];
    return [...row.entries()]
      .filter(([, count]) => count > 0)
      .map(([word]) => word);
  });

  function handleRowClick(word: string) {
    if (outputWords.length > 0) return;
    const newState = selectStartWord(word, model, diceSides);
    if (newState) scheduler.setState(newState);
  }

  function isHighlightedCol(word: string): boolean {
    if (phase.kind !== "showing-options" && phase.kind !== "rolled")
      return false;
    return currentRowOptions.includes(word);
  }

  onMount(() => scheduler.cleanup);
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
              <span class="token" class:punctuation={isPunctuation(token)}>
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
          {#if phase.kind === "showing-options" && currentWord}
            <span>Looking up</span>
            <span
              class="token highlight-first"
              class:punctuation={isPunctuation(currentWord)}>{currentWord}</span
            >
            <span>— roll d{diceSides}...</span>
          {:else if phase.kind === "rolled" && isAnimating}
            <span>Rolling d{diceSides}...</span>
            <span class="dice-value rolling">{displayDiceRoll}</span>
          {:else if phase.kind === "rolled" && displayDiceRoll !== null}
            <span>Rolled</span>
            <span class="dice-value">{displayDiceRoll}</span>
            <span>&rarr;</span>
            <span
              class="token highlight-second"
              class:punctuation={isPunctuation(phase.nextWord)}
              >{phase.nextWord}</span
            >
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
        sliderId="generation-speed-slider"
        onplay={scheduler.play}
        onpause={scheduler.pause}
        onstep={scheduler.step}
        onreset={scheduler.reset}
        onstepintervalchange={(v) => (scheduler.stepInterval = v)}
      />
    </div>
  </div>
</FullscreenWrapper>
