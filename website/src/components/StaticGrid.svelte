<script lang="ts">
  import { getBigrams, getVocabulary, splitTokens } from "../lib/tokens";
  import BigramCountsTable from "./BigramCountsTable.svelte";

  interface Props {
    tokens: string;
    vocabulary?: string;
    step: number;
  }

  let { tokens: tokenString, vocabulary: vocabString, step }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(
    vocabString ? splitTokens(vocabString) : getVocabulary(tokenList),
  );
  const allBigrams = $derived(getBigrams(tokenList));
  const visibleBigrams = $derived(allBigrams.slice(0, step));

  // Grow the grid token-by-token: only tokens seen up to this step (the first
  // `step + 1` tokens) get a row/column, kept in vocab order. New rows/columns
  // appear as each new token shows up, rather than the full vocabulary being
  // laid out up front.
  const seenTokens = $derived(new Set(tokenList.slice(0, step + 1)));
  const visibleVocab = $derived(vocab.filter((token) => seenTokens.has(token)));

  const currentPairIndex = $derived(step - 1);
  const currentPair = $derived(
    currentPairIndex >= 0 && currentPairIndex < allBigrams.length
      ? allBigrams[currentPairIndex]
      : null,
  );
</script>

<div class="static-grid-tokens">
  {#each tokenList as token, i}
    <code
      class:highlight={currentPair &&
        (i === currentPairIndex || i === currentPairIndex + 1)}
      class:dimmed={i > currentPairIndex + 1}>{token}</code
    >
  {/each}
</div>

<BigramCountsTable
  vocab={visibleVocab}
  bigrams={visibleBigrams}
  currentCell={currentPair}
/>

<style>
  /* Deck-only component, tuned for the 1280×720 / 16px-root reveal canvas. */

  .static-grid-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    margin: 0.5rem 0 1.5rem;
    font-size: 1.6rem;
  }

  .static-grid-tokens code {
    transition: opacity 0.2s;
  }

  .static-grid-tokens code.highlight {
    outline: 2px solid var(--anu-gold);
    outline-offset: 2px;
  }

  .static-grid-tokens code.dimmed {
    opacity: 0.25;
  }
</style>
