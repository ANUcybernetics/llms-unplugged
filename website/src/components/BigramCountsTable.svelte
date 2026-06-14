<script lang="ts">
  import { tally } from "../lib/tally";

  interface Props {
    /** Column/row labels, in display order. */
    vocab: string[];
    /** Bigrams to tally into the grid (slice as needed for step-by-step reveal). */
    bigrams: [string, string][];
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
    activeRow = null,
    currentCell = null,
    candidateCells = null,
    revealedTokens = null,
  }: Props = $props();

  const isRevealed = (token: string) => revealedTokens == null || revealedTokens.has(token);

  const isCandidate = (row: string, col: string) =>
    candidateCells != null && candidateCells.some(([from, to]) => from === row && to === col);

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
</script>

<table class="bigram-grid">
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
          {@const isCurrent =
            currentCell != null && row === currentCell[0] && col === currentCell[1]}
          <td class="grid-cell" class:current={isCurrent} class:candidate={isCandidate(row, col)}>
            {count > 0 ? tally(count) : " "}
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
    margin: 0;
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
