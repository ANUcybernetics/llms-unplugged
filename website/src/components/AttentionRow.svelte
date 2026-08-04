<script lang="ts">
  import { tally } from "../lib/tally";
  import { getBigrams, isPunctuation, splitTokens } from "../lib/tokens";

  interface Context {
    /** Words the model can see before the row token, space-separated. */
    before: string;
    /** Next-token weight per vocabulary entry, in grid column order. Any scale
        will do --- the bars are normalised against the largest weight. */
    weights: number[];
  }

  interface Props {
    /** The training text the grid was tallied from (space-separated tokens). */
    tokens: string;
    /** Column/row labels in grid order. */
    vocabulary: string;
    /** The token whose row is being re-weighted. */
    token: string;
    /** The same row as it would look under each preceding context. */
    contexts: Context[];
    /** 0 shows the plain grid with the row banded; 1..n swaps that row for the
        matching context's re-weighted version. Stepping this across slides is
        the build: everything else holds still while one row changes shape. */
    active?: number;
  }

  let { tokens: tokenString, vocabulary, token, contexts, active = 0 }: Props = $props();

  const vocab = $derived(splitTokens(vocabulary));
  const context = $derived(active > 0 ? (contexts[active - 1] ?? null) : null);
  const peak = $derived(Math.max(1, ...contexts.flatMap((c) => c.weights)));

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

<table class="attention-grid">
  <thead>
    <tr>
      <th scope="col"><span class="sr-only">Context</span></th>
      {#each vocab as col}
        <th scope="col"><code class:punctuation={isPunctuation(col)}>{col}</code></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each vocab as row}
      {@const isRow = row === token}
      <tr class:banded={isRow && !context} class:dimmed={context != null && !isRow}>
        <th scope="row">
          <span class="row-key">
            {#if isRow && context}
              {#each splitTokens(context.before) as word}
                <code class="dim" class:punctuation={isPunctuation(word)}>{word}</code>
              {/each}
            {/if}
            <code class:row-token={isRow} class:punctuation={isPunctuation(row)}>{row}</code>
          </span>
        </th>
        {#each vocab as col, i}
          {#if isRow && context}
            {@const weight = context.weights[i] ?? 0}
            <td class="bar-cell">
              <span class="bar" style="--fill: {Math.round((weight / peak) * 100)}%"></span>
            </td>
          {:else}
            {@const count = counts.get(row)?.get(col) ?? 0}
            <td class="grid-cell">{count > 0 ? tally(count) : " "}</td>
          {/if}
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* Deck-only component, tuned for the 1280x720 canvas. It renders the whole
     bigram grid the audience already built --- same borders, same column order,
     same tallies --- so that stepping `active` across slides leaves every row
     where it was and re-shapes exactly one of them. That stillness is the
     argument: attention doesn't add rows, it redraws one. */

  table.attention-grid {
    width: 100%;
    margin: 0;
    /* Fixed layout, so the columns are set by the header row and stay put when
       the active row's heading grows from `,` to `see spot ,`. Under auto
       layout that growth nudges every column sideways, and a grid that shuffles
       between slides undoes the point of the build. */
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 1.6rem;
  }

  table.attention-grid thead th:first-child {
    width: 26%;
  }

  table.attention-grid th,
  table.attention-grid td {
    /* Every cell keeps the bar row's height whether it holds a bar or tally
       marks, so the grid's geometry is identical on all three slides. */
    height: 3.2rem;
    padding: 0.3rem 0.4rem;
    border: 1px solid var(--color-divider);
    text-align: center;
  }

  /* Reveal strips the last row's bottom border; put it back so the grid closes. */
  table.attention-grid tbody tr:last-child th,
  table.attention-grid tbody tr:last-child td {
    border-bottom: 1px solid var(--color-divider);
  }

  table.attention-grid td.grid-cell {
    font-weight: 700;
    min-width: 2em;
  }

  table.attention-grid tbody th {
    text-align: end;
    white-space: nowrap;
  }

  .row-key {
    display: inline-flex;
    align-items: center;
    justify-content: end;
    gap: 0.3em;
  }

  .row-key code.dim {
    opacity: 0.45;
  }

  .row-key code.row-token {
    outline: 2px solid var(--anu-gold);
    outline-offset: 2px;
  }

  /* Clear of the theme's header tint, which every th now carries on both axes.
     The band has to say "this row, next" against a grid whose first column is
     already tinted, so 15% no longer reads as a band at all. */
  tr.banded td,
  tr.banded th {
    background: color-mix(in srgb, var(--anu-gold) 32%, transparent);
  }

  /* Once a context is in play the rest of the grid steps back --- still there,
     still tallied, just not the thing that moved. */
  tr.dimmed td,
  tr.dimmed th {
    opacity: 0.35;
  }

  /* Bars run bottom-up inside the cell so the two contexts stay aligned and the
     shape difference is the only thing that moves. A zero-weight column keeps
     its empty track rather than going blank, so it reads as "no chance" rather
     than as a cell that failed to render. */
  .bar {
    display: block;
    width: 100%;
    height: 2.6rem;
    background: linear-gradient(
      to top,
      var(--anu-gold) 0 var(--fill),
      var(--lm-highlight-soft) var(--fill) 100%
    );
    border-radius: 2px;
  }
</style>
