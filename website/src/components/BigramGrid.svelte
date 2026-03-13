<script lang="ts">
  import { tally } from "../lib/tally";

  interface Props {
    vocabulary: string[];
    getCount: (from: string, to: string) => number;
    counts?: Map<string, number>;
    highlightedRow?: string | null;
    highlightedCol?: string | null;
    isHighlightedCol?: (word: string) => boolean;
    isCurrentCell?: (from: string, to: string) => boolean;
    clickableRows?: boolean;
    isRowClickable?: (word: string) => boolean;
    isDeadEnd?: (word: string) => boolean;
    showRowIndicator?: boolean;
    numericRows?: Set<string>;
    onrowclick?: (word: string) => void;
  }

  let {
    vocabulary,
    getCount,
    counts,
    highlightedRow = null,
    highlightedCol = null,
    isHighlightedCol,
    isCurrentCell,
    clickableRows = false,
    isRowClickable = () => true,
    isDeadEnd = () => false,
    showRowIndicator = false,
    numericRows = new Set<string>(),
    onrowclick,
  }: Props = $props();

  function checkHighlightedCol(word: string): boolean {
    if (isHighlightedCol) return isHighlightedCol(word);
    return highlightedCol === word;
  }

  function checkCurrentCell(from: string, to: string): boolean {
    if (isCurrentCell) return isCurrentCell(from, to);
    return highlightedRow === from && highlightedCol === to;
  }

  function handleRowClick(word: string) {
    if (clickableRows && isRowClickable(word)) {
      onrowclick?.(word);
    }
  }
</script>

<div class="grid-section">
  <table class="bigram-grid compact-grid">
    <thead>
      <tr>
        <th scope="col"></th>
        {#each vocabulary as word}
          <th
            scope="col"
            title={word}
            class:highlight-col={checkHighlightedCol(word)}
            class:punctuation={word === "." || word === ","}
          >
            <code>{word}</code>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each vocabulary as rowWord}
        <tr
          class:highlight-row={highlightedRow === rowWord ||
            numericRows.has(rowWord)}
          class:dead-end={isDeadEnd(rowWord)}
          class:clickable={clickableRows && isRowClickable(rowWord)}
          onclick={() => handleRowClick(rowWord)}
        >
          <th
            class="row-header"
            scope="row"
            title={rowWord}
            class:highlight-row={highlightedRow === rowWord ||
              numericRows.has(rowWord)}
            class:punctuation={rowWord === "." || rowWord === ","}
          >
            {#if showRowIndicator && highlightedRow === rowWord}
              <span class="row-indicator">▸</span>
            {/if}
            <code>{rowWord}</code>
          </th>
          {#each vocabulary as colWord}
            <td
              class="grid-cell"
              class:in-highlighted-col={checkHighlightedCol(colWord)}
              class:highlight-col={checkHighlightedCol(colWord) &&
                highlightedRow === rowWord}
              class:highlight-row={highlightedRow === rowWord ||
                numericRows.has(rowWord)}
              class:current-cell={checkCurrentCell(rowWord, colWord)}
              class:flash={checkCurrentCell(rowWord, colWord)}
            >
              {#if counts}
                {tally(counts.get(`${rowWord}->${colWord}`) || 0) || "\u200b"}
              {:else}
                {numericRows.has(rowWord)
                  ? getCount(rowWord, colWord)
                  : tally(getCount(rowWord, colWord)) || ""}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .grid-section {
    overflow-x: auto;
  }
  .bigram-grid th.highlight-col {
    background-color: var(--lm-highlight-medium);
  }
  .bigram-grid tr.clickable {
    cursor: pointer;
  }
  .bigram-grid tr.clickable:hover .row-header {
    background-color: var(--color-brand-soft);
  }
  .bigram-grid tr.dead-end {
    opacity: 0.4;
  }
  .bigram-grid tr.highlight-row {
    background-color: var(--lm-highlight-soft);
  }
  .row-header {
    background-color: var(--color-bg-alt);
    font-weight: 600;
    position: relative;
  }
  .row-header.highlight-row {
    background-color: var(--color-brand-soft);
  }
  .row-indicator {
    position: absolute;
    left: 0.25rem;
    color: var(--color-brand);
  }
  .grid-cell.highlight-row {
    background-color: var(--lm-highlight-soft);
  }
  .grid-cell.in-highlighted-col {
    background-color: var(--lm-highlight-soft);
  }
  .grid-cell.highlight-col {
    background-color: var(--lm-highlight-medium);
  }
  .grid-cell.current-cell {
    background-color: var(--lm-highlight-strong);
  }
  .grid-cell.flash {
    animation: cell-flash 0.3s ease-out;
  }
  @keyframes cell-flash {
    0% {
      background-color: var(--color-brand);
    }
    100% {
      background-color: var(--lm-highlight-strong);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .grid-cell.flash {
      animation: none;
    }
  }
</style>
