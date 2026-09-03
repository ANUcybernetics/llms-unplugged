<script lang="ts">
  import {
    isPale,
    layoutCells,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type LedgerEntry,
    type PaletteEntry,
  } from "../lib/ledger";

  interface Props {
    /** The prefix and its followers with counts (see src/lib/ledger.ts). */
    entry: LedgerEntry;
    columns?: number;
    /**
     * The physical row of the page the entry starts on. Strips are coloured
     * by column and the palette cycles down the page's rows, so this is what
     * decides which colours the row prints in; pass the real row so the
     * slide shows the colours the sheet in the room has.
     */
    firstRow?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    /** Print the follower words (a "followers" or "tallies" sheet). */
    showFollowers?: boolean;
    /** Draw the tally marks (a "tallies" sheet). */
    showTallies?: boolean;
    /** Follower index to light; the other cells dim. */
    highlight?: number;
    /** Follower index whose newest mark is drawn in gold: the one just added. */
    fresh?: number;
    /** data-id stem, so Reveal auto-animate can match the cells across slides. */
    id?: string;
  }

  let {
    entry,
    columns = LEDGER_COLUMNS,
    firstRow = 0,
    palette = LEDGER_PALETTE,
    showFollowers = true,
    showTallies = true,
    highlight,
    fresh,
    id = "ledger-row",
  }: Props = $props();

  const rows = $derived(layoutCells(entry, columns, firstRow, palette));
  // Cell ids carry the prefix, so auto-animate matches cells only between
  // frames of the same row (load the bag, then draw) and crossfades when the
  // walkthrough moves to another prefix. Matching "them"'s cells to "in"'s
  // would slide them across the canvas, which reads as nonsense and leaves
  // transformed boxes in the row's scroll area while the frame settles.
  const cellId = (suffix: string) => `${id}-${entry.prefix}-${suffix}`;
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);

  // One five-bar gate per five marks, as cli/ledger.typ draws them: four
  // uprights and a diagonal through them. The newest mark of the `fresh`
  // follower is gold.
  function gates(count: number): { marks: number; last: boolean }[] {
    const out = [];
    for (let g = 0; g < Math.ceil(count / 5); g++) {
      const marks = Math.min(5, count - 5 * g);
      out.push({ marks, last: g === Math.ceil(count / 5) - 1 });
    }
    return out;
  }
</script>

{#snippet token(text: string)}
  <span class="ledger-token"
    >{#if PUNCT.has(text)}<span class="ledger-punct">{text}</span>{:else}{text}{/if}</span
  >
{/snippet}

{#snippet gate(marks: number, goldLast: boolean)}
  <svg class="gate" viewBox="0 0 20 18" aria-hidden="true">
    {#each Array.from({ length: Math.min(marks, 4) }) as _, i (i)}
      <line
        x1={(i + 0.5) * 5}
        y1="0.5"
        x2={(i + 0.5) * 5}
        y2="17.5"
        class:fresh={goldLast && marks < 5 && i === marks - 1}
      />
    {/each}
    {#if marks >= 5}
      <line x1="0" y1="17.5" x2="20" y2="0.5" class:fresh={goldLast} />
    {/if}
  </svg>
{/snippet}

<div
  class="ledger-row paper-ground"
  style="--columns: {columns}"
  data-id={id}
  role="table"
  aria-label="ledger row for {entry.prefix}"
>
  {#each rows as cells, r (r)}
    <div class="prow" class:continues={r > 0} role="row">
      <div class="prefix" class:repeat={r > 0} role="rowheader" data-id={cellId(`p${r}`)}>
        {@render token(entry.prefix)}
      </div>
      {#each cells as cell (cell.index)}
        <div
          class="word"
          class:dim={highlight !== undefined && highlight !== cell.index}
          role="cell"
          data-id={cellId(`w${cell.index}`)}
        >
          {#if cell.follower && showFollowers}
            {@render token(cell.follower.text)}
          {/if}
        </div>
        <div
          class="ledger-strip"
          class:dim={highlight !== undefined && highlight !== cell.index}
          class:lit={highlight === cell.index}
          class:pale={isPale(cell.colour.hex)}
          style="--c: {cell.colour.hex}"
          role="cell"
          data-id={cellId(`s${cell.index}`)}
        >
          {#if cell.follower && showTallies}
            <span class="marks">
              {#each gates(cell.follower.count) as g, k (k)}
                {@render gate(g.marks, fresh === cell.index && g.last)}
              {/each}
            </span>
          {/if}
          <span class="ledger-strip-name">{cell.colour.name}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  /* Sized in rem, not the slide's em: a row is a picture of a printed row
     and has to fit the canvas beside its bag whatever the slide's text size. */
  .ledger-row {
    display: inline-grid;
    padding: 0;
    margin-inline: auto;
    font-size: 1.3rem;
  }

  .prow {
    display: grid;
    grid-template-columns: 5em repeat(var(--columns), minmax(4.6em, auto) 4.2em);
    grid-auto-rows: 2.9em;
    align-items: stretch;
  }

  .prow.continues {
    border-top: 1px solid rgb(0 0 0 / 15%);
  }

  .prefix,
  .word {
    display: flex;
    align-items: center;
    padding-inline: 0.5em;
  }

  .prefix {
    border-right: 1px solid rgb(0 0 0 / 40%);
  }

  .prefix.repeat {
    color: rgb(0 0 0 / 40%);
  }

  .prefix.repeat :global(.ledger-token) {
    color: inherit;
    font-weight: 400;
    font-size: 0.9em;
  }

  .word :global(.ledger-token) {
    font-weight: 400;
  }

  .ledger-strip {
    margin: 0.2em;
    transition: opacity 0.3s;
  }

  .ledger-strip.lit {
    outline: 3px solid var(--anu-gold);
    outline-offset: 1px;
  }

  .dim {
    opacity: 0.3;
  }

  .marks {
    position: absolute;
    inset: 0.25em 0.35em 0.75em 0.5em;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.15em 0.2em;
  }

  .gate {
    inline-size: 1.15em;
    block-size: 1em;
  }

  .gate line {
    stroke: #111;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .gate line.fresh {
    stroke: var(--anu-gold);
    stroke-width: 2.4;
  }
</style>
