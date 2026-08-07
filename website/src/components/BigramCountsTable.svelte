<script lang="ts">
  import { tally } from "../lib/tally";

  interface Props {
    /** Column/row labels, in display order. */
    vocab: string[];
    /** Bigrams to tally into the grid (slice as needed for step-by-step reveal). */
    bigrams: [string, string][];
    /** Bigrams from a second source text, tallied in a contrasting colour.
        When set, `bigrams` tallies render gold and these render blue, so a
        two-corpus grid shows at a glance which book each count came from
        (the visionaries-showcase deck's hybrid corpus). A cell holding counts
        from both sources renders both, side by side. */
    bigramsB?: [string, string][] | null;
    /** Compact sizing for large vocabularies (the 26×26 hybrid grid), where
        the default cell padding would overflow the reveal canvas. */
    dense?: boolean;
    /** Row to band-highlight (the "current" previous-word). */
    activeRow?: string | null;
    /** Single cell to ring as the chosen/current pair, written [from, to]. */
    currentCell?: [string, string] | null;
    /** Cells to mark as candidate options (dashed ring), each written
        [from, to]. Used before a dice roll to show every option in play; the
        eventually-chosen cell also gets the solid `currentCell` ring on top. */
    candidateCells?: [string, string][] | null;
    /** When set, only these tokens' row/column headings are shown; the rest are
        still laid out (so the grid keeps its full size) but stay invisible until
        revealed. Null shows every heading. */
    revealedTokens?: Set<string> | null;
  }

  let {
    vocab,
    bigrams,
    bigramsB = null,
    dense = false,
    activeRow = null,
    currentCell = null,
    candidateCells = null,
    revealedTokens = null,
  }: Props = $props();

  const isRevealed = (token: string) => revealedTokens == null || revealedTokens.has(token);

  const isCandidate = (row: string, col: string) =>
    candidateCells != null && candidateCells.some(([from, to]) => from === row && to === col);

  const tallyUp = (pairs: [string, string][]) => {
    const m = new Map<string, Map<string, number>>();
    for (const word of vocab) {
      m.set(word, new Map());
    }
    for (const [from, to] of pairs) {
      const row = m.get(from)!;
      row.set(to, (row.get(to) || 0) + 1);
    }
    return m;
  };

  const counts = $derived(tallyUp(bigrams));
  const countsB = $derived(bigramsB ? tallyUp(bigramsB) : null);
</script>

<table class="bigram-grid" class:dense>
  <thead>
    <tr>
      <th scope="col"><span class="sr-only">Token</span></th>
      {#each vocab as col}
        <th scope="col"><code class:unrevealed={!isRevealed(col)}>{col}</code></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each vocab as row}
      <tr class:active-row={activeRow === row}>
        <th scope="row"><code class:unrevealed={!isRevealed(row)}>{row}</code></th>
        {#each vocab as col}
          {@const count = counts.get(row)?.get(col) || 0}
          {@const countB = countsB?.get(row)?.get(col) || 0}
          {@const isCurrent =
            currentCell != null && row === currentCell[0] && col === currentCell[1]}
          <td class="grid-cell" class:current={isCurrent} class:candidate={isCandidate(row, col)}>
            {#if countsB}
              {#if count > 0}<span class="tally-a">{tally(count)}</span>{/if}
              {#if countB > 0}<span class="tally-b">{tally(countB)}</span>{/if}
            {:else}
              {count > 0 ? tally(count) : " "}
            {/if}
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

  table.bigram-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.6rem;
  }

  table.bigram-grid th,
  table.bigram-grid td {
    text-align: center;
    padding: 0.4rem;
    /* Subtle gold-tinted grid lines (the website's bigram grid uses the same
       token) so cells read as a grid without competing with the gold tally
       marks and current-cell highlight. */
    border: 1px solid var(--color-divider);
  }

  /* Reveal's base theme strips the bottom border off the final row
     (.reveal table tbody tr:last-child td { border-bottom: none }), leaving the
     grid open along its bottom edge. Put it back so the grid reads as closed. */
  table.bigram-grid tbody tr:last-child td,
  table.bigram-grid tbody tr:last-child th {
    border-bottom: 1px solid var(--color-divider);
  }

  /* Headings fade in as the build reveals each token; the cells they sit in are
     always present, so the grid keeps its full size and never shifts. */
  table.bigram-grid th code {
    transition: opacity 0.3s ease;
  }

  table.bigram-grid code.unrevealed {
    opacity: 0;
  }

  table.bigram-grid td.grid-cell {
    font-weight: 700;
    min-width: 2em;
  }

  /* Two-source tallies: gold for the first corpus, blue for the second. The
     blue matches --corpus-seuss in widgets.css (the deck's colour-coded
     source-text reveal slide); keep the two in sync. */
  .tally-a {
    color: var(--anu-gold);
  }

  .tally-b {
    color: var(--corpus-seuss, #7cc0e8);
  }

  /* Dense mode: a 26×26 grid at the default sizing would overflow the reveal
     canvas. Sized so the full grid (27 rows with headings) fits the 720px
     canvas with no h2 above it; cells are wide-not-tall, which suits tally
     strokes drawn live over the slide with the whiteboard pen. */
  table.bigram-grid.dense {
    font-size: 0.85rem;
  }

  table.bigram-grid.dense th,
  table.bigram-grid.dense td {
    padding: 0.15rem 0.1rem;
  }

  table.bigram-grid.dense td.grid-cell {
    min-width: 1.2em;
  }

  tr.active-row td {
    background: color-mix(in srgb, var(--anu-gold) 15%, transparent);
  }

  /* Candidate options before a roll: a dashed ring on every cell in play. The
     chosen cell later gains `.current` (solid ring) on top --- declared after
     `.candidate` so its outline wins. */
  td.candidate {
    outline: 2px dashed color-mix(in srgb, var(--anu-gold) 70%, transparent);
    outline-offset: -2px;
  }

  td.current {
    outline: 2px solid var(--anu-gold);
    outline-offset: -2px;
  }
</style>
