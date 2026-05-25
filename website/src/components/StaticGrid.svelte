<script lang="ts">
  import { getBigrams, getVocabulary } from "../lib/tokens";
  import { tally } from "../lib/tally";

  interface Props {
    tokens: string;
    vocabulary?: string;
    step: number;
  }

  let { tokens: tokenString, vocabulary: vocabString, step }: Props = $props();

  const tokenList = $derived(tokenString.trim().split(/\s+/).filter(Boolean));
  const vocab = $derived(
    vocabString
      ? vocabString.trim().split(/\s+/).filter(Boolean)
      : getVocabulary(tokenList),
  );
  const allBigrams = $derived(getBigrams(tokenList));
  const visibleBigrams = $derived(allBigrams.slice(0, step));

  const counts = $derived.by(() => {
    const m = new Map<string, Map<string, number>>();
    for (const word of vocab) {
      m.set(word, new Map());
    }
    for (const [from, to] of visibleBigrams) {
      const row = m.get(from)!;
      row.set(to, (row.get(to) || 0) + 1);
    }
    return m;
  });

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

<table class="bigram-grid">
  <thead>
    <tr>
      <th></th>
      {#each vocab as col}
        <th><code>{col}</code></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each vocab as row}
      <tr>
        <td><code>{row}</code></td>
        {#each vocab as col}
          {@const count = counts.get(row)?.get(col) || 0}
          {@const isCurrentCell =
            currentPair && row === currentPair[0] && col === currentPair[1]}
          <td class="grid-cell" class:current={isCurrentCell}>
            {count > 0 ? tally(count) : "\u00A0"}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* Deck-only component. Assumes it lives inside .reveal .slides section
     beneath an h2, with the standard 1280×720 / 16px-root reveal canvas and
     4rem 5rem section padding (→ ~1120×500 content budget below the h2).
     All sizing is tuned for that envelope; no external deck overrides
     needed. */

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

  table.bigram-grid {
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: 1.6rem;
  }

  table.bigram-grid th,
  table.bigram-grid td {
    text-align: center;
    padding: 0.4rem;
  }

  table.bigram-grid td.grid-cell {
    font-weight: 700;
    min-width: 2em;
  }

  td.current {
    outline: 2px solid var(--anu-gold);
    outline-offset: -2px;
  }
</style>
