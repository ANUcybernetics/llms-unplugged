<script lang="ts">
  import { tally } from "../lib/tally";
  import { getBigrams, splitTokens } from "../lib/tokens";

  interface Props {
    /** The training text whose tallies are ghosted behind the numbers --- the
        same text the previous slide's grid was built from. */
    tokens: string;
    /** Column/row labels in grid order. */
    vocabulary: string;
    /** Score per cell, rows then columns, both in vocabulary order. */
    scores: number[][];
    /** Cell to ring, written "row col" --- the one the grid left empty. */
    highlight?: string;
  }

  let { tokens: tokenString, vocabulary, scores, highlight }: Props = $props();

  const vocab = $derived(splitTokens(vocabulary));
  const [markRow, markCol] = $derived(splitTokens(highlight ?? ""));

  const counts = $derived.by(() => {
    const m = new Map<string, Map<string, number>>();
    for (const [from, to] of getBigrams(splitTokens(tokenString))) {
      const row = m.get(from) ?? new Map<string, number>();
      row.set(to, (row.get(to) ?? 0) + 1);
      m.set(from, row);
    }
    return m;
  });
</script>

<table class="parameter-grid">
  <thead>
    <tr>
      <th scope="col"><span class="sr-only">Token</span></th>
      {#each vocab as col}
        <th scope="col"><code>{col}</code></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each vocab as row, r}
      <tr>
        <th scope="row"><code>{row}</code></th>
        {#each vocab as col, c}
          {@const count = counts.get(row)?.get(col) ?? 0}
          <td class:marked={row === markRow && col === markCol}>
            <span class="was">{count > 0 ? tally(count) : " "}</span>
            <span class="param">{(scores[r]?.[c] ?? 0).toFixed(2)}</span>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* Deck-only component. Deliberately the same grid as the slide before ---
     same tokens, same rows, same columns --- with the tally marks ghosted in
     place and a number under every one of them, including the cells the tallies
     never reached. That empty-cell-with-a-number is the whole slide. */

  table.parameter-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.3rem;
  }

  table.parameter-grid th,
  table.parameter-grid td {
    padding: 0.3rem 0.4rem;
    border: 1px solid var(--color-divider);
    text-align: center;
  }

  /* Reveal strips the last row's bottom border; put it back so the grid closes. */
  table.parameter-grid tbody tr:last-child th,
  table.parameter-grid tbody tr:last-child td {
    border-bottom: 1px solid var(--color-divider);
  }

  /* The tallies stay visible but recede: what was countable is now the faint
     thing underneath a number. Cells the text never saw keep the empty track so
     the rows stay aligned. */
  .was {
    display: block;
    min-height: 1.1em;
    font-family: var(--font-mono);
    font-size: 0.7em;
    line-height: 1.1;
    color: var(--color-text-muted);
    opacity: 0.45;
  }

  .param {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.85em;
    color: var(--anu-gold);
  }

  td.marked {
    outline: 2px solid var(--anu-gold);
    outline-offset: -2px;
    background: color-mix(in srgb, var(--anu-gold) 15%, transparent);
  }
</style>
