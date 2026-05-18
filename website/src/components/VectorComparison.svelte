<script lang="ts">
  import { isPunctuation, type BigramModel } from "../lib/tokens";

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
  <table class="comparison-table compact-grid">
    <thead>
      <tr>
        <th scope="col"></th>
        {#each vocabulary as word}
          <th
            scope="col"
            title={word}
            class:punctuation={isPunctuation(word)}
          >
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
            class:punctuation={isPunctuation(vec.word)}
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

  .vector-row {
    background-color: var(--lm-highlight-soft);
  }

  .diff-row {
    border-top: 2px solid var(--at-accent);
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
