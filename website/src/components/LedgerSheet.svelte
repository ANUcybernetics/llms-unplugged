<script lang="ts">
  // One whole ledger sheet as a participant holds it: the alphabetical range
  // in the header, then every row the deal put on the page. LedgerSheets is
  // the same object seen from across the room (five blank thumbnails, the
  // ranges the point); this is the one sheet close enough to read.
  import {
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type LedgerEntry,
    type PaletteEntry,
    physicalRows,
  } from "../lib/ledger";
  import LedgerRow from "./LedgerRow.svelte";

  interface Props {
    /** The sheet's rows, in the order the deal printed them. */
    entries: LedgerEntry[];
    columns?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    /**
     * The header's first and last prefix. Omit and it reads them off the
     * entries, which is what the deal does anyway.
     */
    range?: [string, string];
    /** Index of the row to keep lit; the rest of the sheet fades back. */
    focus?: number;
    id?: string;
  }

  let {
    entries,
    columns = LEDGER_COLUMNS,
    palette = LEDGER_PALETTE,
    range,
    focus,
    id = "ledger-sheet",
  }: Props = $props();

  // A row's colours depend on where it sits on the page, and a prefix with
  // more followers than there are columns takes more than one, so the
  // physical row of each entry accumulates down the sheet.
  const placed = $derived(
    entries.reduce<{ entry: LedgerEntry; firstRow: number; i: number }[]>((acc, entry, i) => {
      const prev = acc.at(-1);
      const firstRow = prev ? prev.firstRow + physicalRows(prev.entry, columns) : 0;
      return [...acc, { entry, firstRow, i }];
    }, []),
  );
  const header = $derived(
    range ?? ([entries[0]?.prefix ?? "", entries.at(-1)?.prefix ?? ""] as const),
  );
</script>

<div class="sheet paper-ground" data-id={id}>
  <div class="header" data-id="{id}-header">
    <span class="ledger-token">{header[0]}</span>
    <span class="arrow">→</span>
    <span class="ledger-token">{header[1]}</span>
  </div>
  {#each placed as p (p.entry.prefix)}
    <div class="line" class:dim={focus !== undefined && focus !== p.i}>
      <LedgerRow entry={p.entry} {columns} {palette} firstRow={p.firstRow} bare id="{id}-r{p.i}" />
    </div>
  {/each}
</div>

<style>
  .sheet {
    display: inline-block;
    padding: 0.5em 0.7em 0.7em;
    margin-inline: auto;
    font-size: 1.15rem;
  }

  /* The sheet is the paper, so its rows sit on it bare and at the sheet's
     own size rather than the free-standing row's. */
  .sheet :global(.ledger-row) {
    --row-size: 1em;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 0.4em;
    padding-block-end: 0.3em;
    margin-block-end: 0.35em;
    border-bottom: 1px solid var(--anu-gold);
    font-size: 1.1em;
  }

  .arrow {
    color: rgb(0 0 0 / 50%);
  }

  .line {
    transition: opacity 0.3s;
  }

  .line + .line {
    border-top: 1px solid rgb(0 0 0 / 15%);
  }

  .dim {
    opacity: 0.22;
  }
</style>
