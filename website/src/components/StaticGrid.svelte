<script lang="ts">
  import { getBigrams, getVocabulary } from "../lib/tokens";
  import { tally } from "../lib/tally";

  interface Props {
    tokens: string;
    vocabulary?: string;
    step: number;
  }

  let { tokens: tokenString, vocabulary: vocabString, step }: Props = $props();

  const tokenList = tokenString.trim().split(/\s+/).filter(Boolean);
  const vocab = vocabString
    ? vocabString.trim().split(/\s+/).filter(Boolean)
    : getVocabulary(tokenList);
  const allBigrams = getBigrams(tokenList);
  const visibleBigrams = allBigrams.slice(0, step);

  const counts = new Map<string, Map<string, number>>();
  for (const word of vocab) {
    counts.set(word, new Map());
  }
  for (const [from, to] of visibleBigrams) {
    const row = counts.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  const currentPairIndex = step - 1;
  const currentPair =
    currentPairIndex >= 0 && currentPairIndex < allBigrams.length
      ? allBigrams[currentPairIndex]
      : null;
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
          <td
            class="grid-cell"
            class:current={isCurrentCell}
          >
            {count > 0 ? tally(count) : "\u00A0"}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .static-grid-tokens {
    margin-bottom: 2.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
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

  td.current {
    outline: 2px solid var(--anu-gold);
    outline-offset: -2px;
  }
</style>
