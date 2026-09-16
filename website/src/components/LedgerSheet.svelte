<script lang="ts">
  // One whole ledger sheet as a participant holds it: the alphabetical range
  // in the header, then every row the deal put on the page. LedgerSheets is
  // the same object seen from across the room (five blank thumbnails, the
  // ranges the point); this is the one sheet close enough to read.
  //
  // A slide that is about one row shows the whole sheet with that row lit
  // and the rest faded back, rather than the row on its own, so the eye
  // always has the same sheet in the same place and only the focus moves.
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
     * entries, which is what the deal does anyway; null prints no header,
     * as a blank sheet has none.
     */
    range?: [string, string] | null;
    /** A caption in the header's place, for a sheet that is not one the deal made. */
    label?: string;
    /** Prefix (or prefixes) of the rows to keep lit; the rest of the sheet fades back. */
    focus?: string | string[];
    /** Follower index to light within the focused rows; their other cells dim. */
    highlight?: number;
    /** Follower index whose newest mark is drawn in gold on the focused rows. */
    fresh?: number;
    /**
     * Physical rows the sheet has printed on it. Entries that don't fill
     * them are followed by blank rows, as a sheet still being filled in has.
     */
    rows?: number;
    id?: string;
  }

  let {
    entries,
    columns = LEDGER_COLUMNS,
    palette = LEDGER_PALETTE,
    range,
    label,
    focus,
    highlight,
    fresh,
    rows,
    id = "ledger-sheet",
  }: Props = $props();

  const BLANK: LedgerEntry = { prefix: "", followers: [] };

  // A row's colours depend on where it sits on the page, and a prefix with
  // more followers than there are columns takes more than one, so the
  // physical row of each entry accumulates down the sheet.
  const placed = $derived.by(() => {
    const out: { entry: LedgerEntry; firstRow: number; key: string }[] = [];
    let next = 0;
    for (const entry of entries) {
      out.push({ entry, firstRow: next, key: entry.prefix });
      next += physicalRows(entry, columns);
    }
    for (; next < (rows ?? 0); next++) {
      out.push({ entry: BLANK, firstRow: next, key: `blank-${next}` });
    }
    return out;
  });
  const focused = $derived(new Set(focus === undefined ? [] : [focus].flat()));
  const header = $derived(
    range === null
      ? null
      : (range ?? ([entries[0]?.prefix ?? "", entries.at(-1)?.prefix ?? ""] as const)),
  );
</script>

<div class="sheet paper-ground" data-id={id}>
  {#if label !== undefined}
    <div class="header label" data-id="{id}-header">{label}</div>
  {:else if header}
    <div class="header" data-id="{id}-header">
      <span class="ledger-token">{header[0]}</span>
      <span class="arrow">→</span>
      <span class="ledger-token">{header[1]}</span>
    </div>
  {/if}
  {#each placed as p, i (p.key)}
    {@const lit = focused.has(p.entry.prefix)}
    <div class="line" class:dim={focused.size > 0 && !lit}>
      <LedgerRow
        entry={p.entry}
        {columns}
        {palette}
        firstRow={p.firstRow}
        highlight={lit ? highlight : undefined}
        fresh={lit ? fresh : undefined}
        bare
        id="{id}-r{i}"
      />
    </div>
  {/each}
</div>

<style>
  /* Sized in rem, like the row: a sheet is a picture of a printed sheet and
     the deck sets --sheet-size where the slide gives it more or less room. */
  .sheet {
    display: inline-block;
    padding: 0.5em 0.7em 0.7em;
    margin-inline: auto;
    font-size: var(--sheet-size, 1.15rem);
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

  .header.label {
    font-size: 0.8em;
    color: var(--paper-ink-muted, rgb(0 0 0 / 55%));
    font-style: italic;
  }

  .arrow {
    color: rgb(0 0 0 / 50%);
  }

  .line {
    transition: opacity 0.3s;
  }

  .dim {
    opacity: var(--sheet-dim, 0.22);
  }
</style>
