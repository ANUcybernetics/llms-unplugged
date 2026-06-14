<script lang="ts">
  import { getBigrams, getVocabulary, splitTokens } from "../lib/tokens";
  import BigramCountsTable from "./BigramCountsTable.svelte";
  import GeneratedSequence from "./GeneratedSequence.svelte";

  interface Props {
    tokens: string;
    vocabulary?: string;
    sequence: string;
    step: number;
    /** "preroll" shows every option in the current row (dashed, no pick yet);
        "resolve" (default) rings the chosen cell and reveals the pick. The two
        phases let a choice play out over two slides: candidates, then winner. */
    phase?: "preroll" | "resolve";
    /** Optional space-separated d10 roll per step ("-" = single option, no roll
        needed). When the current step has a roll, it's shown as a result line. */
    rolls?: string;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    sequence: sequenceString,
    step,
    phase = "resolve",
    rolls: rollsString,
  }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(vocabString ? splitTokens(vocabString) : getVocabulary(tokenList));
  const bigrams = $derived(getBigrams(tokenList));
  const sequenceTokens = $derived(splitTokens(sequenceString));

  const currentWord = $derived(step < sequenceTokens.length ? sequenceTokens[step] : null);
  const chosenNext = $derived(step + 1 < sequenceTokens.length ? sequenceTokens[step + 1] : null);
  const generatedSoFar = $derived(sequenceTokens.slice(0, step + 1));

  // Every distinct next-word for the current row, in grid (vocab) order.
  const options = $derived(
    currentWord
      ? vocab.filter((to) => bigrams.some(([from, t]) => from === currentWord && t === to))
      : [],
  );
  const hasChoice = $derived(options.length > 1);

  const isPreroll = $derived(phase === "preroll");
  // Outline every option only when there's an actual choice to roll on.
  const candidateCells = $derived<[string, string][] | null>(
    hasChoice && currentWord ? options.map((to) => [currentWord, to] as [string, string]) : null,
  );
  // Before the roll we haven't picked yet, so hide the chosen cell and the
  // ghosted next token.
  const revealedNext = $derived(isPreroll ? null : chosenNext);
  const currentCell = $derived<[string, string] | null>(
    !isPreroll && currentWord && chosenNext ? [currentWord, chosenNext] : null,
  );

  const rollList = $derived(
    rollsString ? splitTokens(rollsString).map((r) => (r === "-" ? null : Number(r))) : [],
  );
  const currentRoll = $derived(step < rollList.length ? rollList[step] : null);
</script>

<GeneratedSequence generated={generatedSoFar} next={revealedNext} />

{#if isPreroll && hasChoice}
  <p class="roll-line roll-prompt">{options.length} options — roll the die!</p>
{:else if !isPreroll && currentRoll !== null && chosenNext}
  <p class="roll-line">rolled <strong>{currentRoll}</strong> → <code>{chosenNext}</code></p>
{:else}
  <p class="roll-line roll-none">one option — no roll needed</p>
{/if}

<BigramCountsTable {vocab} {bigrams} activeRow={currentWord} {currentCell} {candidateCells} />

<style>
  /* Deck-only component, tuned for the 1280×720 / 16px-root reveal canvas. */

  .roll-line {
    margin: 0 0 0.75rem;
    font-size: 1.4rem;
    min-height: 1.4em; /* reserve the line so the grid never shifts between phases */
  }

  .roll-line strong {
    color: var(--anu-gold);
  }

  .roll-line code {
    padding: 0 0.2em;
  }

  .roll-prompt {
    color: var(--anu-gold);
    font-weight: 600;
  }

  .roll-none {
    color: var(--at-text-secondary);
  }
</style>
