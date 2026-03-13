<script lang="ts">
  import type { BigramModel } from "../lib/tokens";

  interface Props {
    vocabulary: string[];
    model: BigramModel;
    selectedRows: string[];
    distance: number | null;
  }

  let { vocabulary, model, selectedRows, distance }: Props = $props();

  let vectors = $derived(
    selectedRows.map((word) => ({
      word,
      values: vocabulary.map((col) => model.getCount(word, col)),
    })),
  );

  let diffs = $derived.by(() => {
    if (vectors.length < 2) return null;
    const [a, b] = vectors;
    return a.values.map((v, i) => Math.abs(v - b.values[i]));
  });
</script>

<div class="vector-comparison">
  <table class="comparison-table">
    <thead>
      <tr>
        <th scope="col"></th>
        {#each vocabulary as word}
          <th scope="col" title={word} class:punctuation={word === "." || word === ","}>
            <code>{word}</code>
          </th>
        {/each}
        {#if diffs}
          <th scope="col"></th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each vectors as vec}
        <tr class="vector-row">
          <th
            scope="row"
            title={vec.word}
            class:punctuation={vec.word === "." || vec.word === ","}
          >
            <code>{vec.word}</code>
          </th>
          {#each vec.values as val}
            <td>{val}</td>
          {/each}
          {#if diffs}
            <td class="spacer"></td>
          {/if}
        </tr>
      {/each}
      {#if diffs}
        <tr class="diff-row">
          <th scope="row"><code>|d|</code></th>
          {#each diffs as val}
            <td class:nonzero={val > 0}>{val}</td>
          {/each}
          <td class="distance-sum">= {distance}</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
  .vector-comparison {
    overflow-x: auto;
  }

  .comparison-table {
    border-collapse: collapse;
    border: 1px solid var(--color-border);
    font-size: 0.875rem;
    font-family: var(--font-mono);
  }

  .comparison-table th,
  .comparison-table td {
    padding: 0.25rem;
    text-align: center;
    width: 2.5rem;
    max-width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--color-border);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comparison-table th {
    background-color: var(--color-bg-alt);
    font-weight: 600;
  }

  .vector-row {
    background-color: var(--lm-highlight-soft);
  }

  .diff-row {
    border-top: 2px solid var(--color-brand);
  }

  .diff-row td.nonzero {
    background-color: var(--lm-highlight-medium);
    font-weight: 600;
  }

  .spacer {
    border: none;
    background: none;
  }

  .distance-sum {
    font-weight: 700;
    white-space: nowrap;
    border: none;
    background: none;
  }
</style>
