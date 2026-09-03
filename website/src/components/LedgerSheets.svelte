<script lang="ts">
  import {
    isPale,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type PaletteEntry,
    paletteFor,
  } from "../lib/ledger";

  interface Props {
    /** Each sheet's first and last prefix, as its header prints them. */
    ranges: [string, string][];
    /** Who holds each sheet, if the slide wants to say. */
    holders?: string[];
    /** Index of the sheet to light, the one that holds the prefix in question. */
    highlight?: number;
    columns?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
  }

  let {
    ranges,
    holders,
    highlight,
    columns = LEDGER_COLUMNS,
    palette = LEDGER_PALETTE,
  }: Props = $props();
  const ROWS = 4;
</script>

<div class="sheets">
  {#each ranges as [first, last], i (i)}
    <div
      class="sheet paper-ground"
      class:lit={highlight === i}
      class:dim={highlight !== undefined && highlight !== i}
    >
      <div class="header">
        <span class="ledger-token">{first}</span>
        <span class="arrow">→</span>
        <span class="ledger-token">{last}</span>
      </div>
      {#each Array.from({ length: ROWS }) as _, r (r)}
        <div class="row" style="--columns: {columns}">
          <span class="stub"></span>
          {#each paletteFor(r, columns, palette) as colour (colour.name)}
            <span class="cell"></span>
            <span
              class="ledger-strip mini"
              class:pale={isPale(colour.hex)}
              style="--c: {colour.hex}"
            ></span>
          {/each}
        </div>
      {/each}
      {#if holders?.[i]}
        <div class="holder">{holders[i]}</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .sheets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8em;
    font-size: 1rem;
  }

  .sheet {
    inline-size: 11em;
    padding: 0.4em 0.5em;
    transition: opacity 0.3s;
  }

  .sheet.lit {
    outline: 3px solid var(--anu-gold);
  }

  .sheet.dim {
    opacity: 0.45;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 0.3em;
    padding-block-end: 0.25em;
    margin-block-end: 0.3em;
    border-bottom: 1px solid var(--anu-gold);
    font-size: 0.95em;
  }

  .arrow {
    color: rgb(0 0 0 / 50%);
  }

  .row {
    display: grid;
    grid-template-columns: 1.4em repeat(var(--columns), 1fr 0.9em);
    gap: 0.15em;
    margin-block: 0.2em;
  }

  .stub {
    border-right: 1px solid rgb(0 0 0 / 35%);
  }

  .cell {
    min-block-size: 0.9em;
    border-bottom: 1px solid rgb(0 0 0 / 12%);
  }

  .ledger-strip.mini {
    min-block-size: 0.9em;
    border-left-width: 0.2em;
  }

  .holder {
    margin-block-start: 0.3em;
    font-size: 0.7em;
    color: rgb(0 0 0 / 55%);
    text-align: center;
  }
</style>
