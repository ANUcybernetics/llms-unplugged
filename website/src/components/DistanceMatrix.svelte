<script lang="ts">
  interface Props {
    vocabulary: string[];
    matrix: number[][];
    selectedPair: [string, string] | null;
  }

  let { vocabulary, matrix, selectedPair }: Props = $props();

  let maxDistance = $derived.by(() => {
    let max = 0;
    for (const row of matrix) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  });

  function cellStyle(val: number): string {
    const max = maxDistance;
    const opacity = max > 0 ? 1 - val / max : 1;
    const light = opacity > 0.45;
    return `background-color: rgba(190, 131, 14, ${opacity}); color: ${light ? "#000" : "#fff"};`;
  }

  function isHighlighted(rowWord: string, colWord: string): boolean {
    if (!selectedPair) return false;
    const [a, b] = selectedPair;
    return (rowWord === a && colWord === b) || (rowWord === b && colWord === a);
  }

  function isHeaderHighlighted(word: string): boolean {
    if (!selectedPair) return false;
    return selectedPair.includes(word);
  }
</script>

<div class="distance-matrix-section">
  <table class="distance-matrix compact-grid">
    <thead>
      <tr>
        <th scope="col"></th>
        {#each vocabulary as word}
          <th
            scope="col"
            title={word}
            class:highlight-header={isHeaderHighlighted(word)}
            class:punctuation={word === "." || word === ","}
          >
            <code>{word}</code>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each matrix as row, i}
        <tr>
          <th
            scope="row"
            title={vocabulary[i]}
            class:highlight-header={isHeaderHighlighted(vocabulary[i])}
            class:punctuation={vocabulary[i] === "." || vocabulary[i] === ","}
          >
            <code>{vocabulary[i]}</code>
          </th>
          {#each row as val, j}
            <td
              style={cellStyle(val)}
              class:highlight-cell={isHighlighted(vocabulary[i], vocabulary[j])}
            >
              {val}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .distance-matrix-section {
    overflow-x: auto;
  }

  .distance-matrix th.highlight-header {
    background-color: var(--lm-highlight-medium);
  }

  .distance-matrix td.highlight-cell {
    outline: 3px solid var(--color-brand);
    outline-offset: -3px;
    font-weight: 700;
  }
</style>
