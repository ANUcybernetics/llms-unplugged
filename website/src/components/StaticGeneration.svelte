<script lang="ts">
  import { getBigrams, getVocabulary } from "../lib/tokens";
  import { tally } from "../lib/tally";

  interface Props {
    tokens: string;
    vocabulary?: string;
    sequence: string;
    step: number;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    sequence: sequenceString,
    step,
  }: Props = $props();

  const tokenList = $derived(tokenString.trim().split(/\s+/).filter(Boolean));
  const vocab = $derived(
    vocabString
      ? vocabString.trim().split(/\s+/).filter(Boolean)
      : getVocabulary(tokenList),
  );
  const bigrams = $derived(getBigrams(tokenList));
  const sequenceTokens = $derived(
    sequenceString.trim().split(/\s+/).filter(Boolean),
  );

  const counts = $derived.by(() => {
    const m = new Map<string, Map<string, number>>();
    for (const word of vocab) {
      m.set(word, new Map());
    }
    for (const [from, to] of bigrams) {
      const row = m.get(from)!;
      row.set(to, (row.get(to) || 0) + 1);
    }
    return m;
  });

  const currentWord = $derived(
    step < sequenceTokens.length ? sequenceTokens[step] : null,
  );
  const chosenNext = $derived(
    step + 1 < sequenceTokens.length ? sequenceTokens[step + 1] : null,
  );
  const generatedSoFar = $derived(sequenceTokens.slice(0, step + 1));
</script>

<div class="generation-output">
  {#each generatedSoFar as token, i}
    <code class:latest={i === generatedSoFar.length - 1}>{token}</code>
  {/each}
  {#if chosenNext}
    <code class="next">{chosenNext}</code>
  {/if}
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
      {@const isCurrentRow = row === currentWord}
      <tr class:active-row={isCurrentRow}>
        <td><code>{row}</code></td>
        {#each vocab as col}
          {@const count = counts.get(row)?.get(col) || 0}
          {@const isChosenCell = isCurrentRow && col === chosenNext}
          <td
            class="grid-cell"
            class:current={isChosenCell}
          >
            {count > 0 ? tally(count) : "\u00A0"}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .generation-output {
    margin-top: 1.5rem;
    margin-bottom: 2.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }

  .generation-output code.latest {
    outline: 2px solid var(--anu-gold);
    outline-offset: 2px;
  }

  .generation-output code.next {
    outline: 2px dashed var(--anu-gold);
    outline-offset: 2px;
    opacity: 0.6;
  }

  tr.active-row td {
    background: color-mix(in srgb, var(--anu-gold) 15%, transparent);
  }

  td.current {
    outline: 2px solid var(--anu-gold);
    outline-offset: -2px;
  }
</style>
