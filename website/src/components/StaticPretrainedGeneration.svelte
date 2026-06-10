<script lang="ts">
  import {
    buildBigramModel,
    getVocabulary,
    isPunctuation,
    parseTokens,
    splitTokens,
  } from "../lib/tokens";
  import { buildModelEntries, findWordForThresholdRoll } from "../lib/modelEntries";
  import GeneratedSequence from "./GeneratedSequence.svelte";

  interface Props {
    tokens: string;
    vocabulary?: string;
    sequence: string;
    step: number;
    rolls: string;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    sequence: sequenceString,
    step,
    rolls: rollsString,
  }: Props = $props();

  const tokenList = $derived(parseTokens(tokenString));
  const vocab = $derived(vocabString ? splitTokens(vocabString) : getVocabulary(tokenList));
  const model = $derived(buildBigramModel(tokenList));
  const entries = $derived(buildModelEntries(vocab, model));
  const sequenceTokens = $derived(splitTokens(sequenceString));
  const diceRolls = $derived(splitTokens(rollsString).map((r) => (r === "-" ? null : Number(r))));

  const currentWord = $derived(step < sequenceTokens.length ? sequenceTokens[step] : null);
  const chosenNext = $derived(step + 1 < sequenceTokens.length ? sequenceTokens[step + 1] : null);
  const currentRoll = $derived(step < diceRolls.length ? diceRolls[step] : null);
  const generatedSoFar = $derived(sequenceTokens.slice(0, step + 1));
</script>

<GeneratedSequence generated={generatedSoFar} next={chosenNext} />

<div class="entries-list">
  {#each entries as entry}
    {@const isActive = entry.previousWord === currentWord}
    {@const selectedWord =
      isActive && currentRoll !== null ? findWordForThresholdRoll(entry, currentRoll) : null}
    <div class="entry" class:highlighted={isActive}>
      <span class="entry-previous-word" class:punctuation={isPunctuation(entry.previousWord)}>
        {entry.previousWord}
      </span>
      {#if entry.nextWords.length > 1}
        <span class="dice-indicator">{"♦".repeat(entry.numDice)}</span>
      {/if}
      <span class="entry-next-words">
        {#each entry.nextWords as nextWord}
          <span
            class="next-word"
            class:selected={isActive && nextWord.word === selectedWord}
            class:punctuation={isPunctuation(nextWord.word)}
          >
            {#if entry.nextWords.length > 1}
              <span class="threshold">{nextWord.threshold}</span>|{/if}<span class="next-word-text"
              >{nextWord.word}</span
            >
          </span>
        {/each}
      </span>
      {#if isActive && currentRoll !== null}
        <span class="roll-badge">rolled {currentRoll}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  /* Deck-only component. Assumes it lives inside .reveal .slides section
     beneath an h2, with the standard 1280×720 / 16px-root reveal canvas and
     4rem 5rem section padding (→ ~1120×500 content budget below the h2).
     All sizing is tuned for that envelope; no external deck overrides
     needed. */

  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-family: var(--font-libertinus-serif), serif;
  }

  .entries-list .next-word-text,
  .entries-list .entry-previous-word,
  .entries-list .threshold {
    font-family: inherit;
  }

  .entry {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .entry.highlighted {
    background: color-mix(in srgb, var(--anu-gold) 15%, transparent);
  }

  .entry-previous-word {
    font-weight: 700;
    font-size: 1.1em;
  }

  .entry-previous-word.punctuation {
    display: inline-block;
    padding: 0 0.2em;
    border: 1px solid var(--at-text-muted);
    border-radius: 2px;
    font-size: 1em;
  }

  .dice-indicator {
    font-size: 0.85em;
    color: var(--at-text-secondary);
    margin-left: 0.15em;
    margin-right: 0.25em;
  }

  .entry-next-words {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    align-items: baseline;
  }

  .next-word {
    font-size: 0.9em;
    padding: 0 0.15em;
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  .next-word.selected {
    outline: 2px solid var(--anu-gold);
    outline-offset: 1px;
  }

  .next-word.punctuation .next-word-text {
    display: inline-block;
    padding: 0 0.15em;
    border: 1px solid var(--at-text-muted);
    border-radius: 2px;
  }

  .threshold {
    font-weight: 600;
  }

  .roll-badge {
    font-size: 0.85em;
    font-weight: 600;
    color: var(--anu-gold);
    margin-left: 0.5em;
  }

  @media (prefers-reduced-motion: reduce) {
    .entry,
    .next-word {
      transition: none;
    }
  }
</style>
