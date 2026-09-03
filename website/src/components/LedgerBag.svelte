<script lang="ts">
  import {
    bagFor,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type LedgerEntry,
    type PaletteEntry,
  } from "../lib/ledger";

  interface Props {
    /** The row whose marks load the bag. */
    entry: LedgerEntry;
    columns?: number;
    firstRow?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    /**
     * Follower index of the counter drawn: it rises out of the bag with a
     * gold ring, and the label names its colour and word. Omit for a bag
     * that is loaded but not yet drawn from.
     */
    drawn?: number;
    /** Show the bag empty: the row is there, nothing has gone in yet. */
    empty?: boolean;
    id?: string;
  }

  let {
    entry,
    columns = LEDGER_COLUMNS,
    firstRow = 0,
    palette = LEDGER_PALETTE,
    drawn,
    empty = false,
    id = "ledger-bag",
  }: Props = $props();

  const counters = $derived(bagFor(entry, columns, firstRow, palette));
  // The one counter that comes out: the first of the drawn follower's.
  const drawnIndex = $derived(
    drawn === undefined ? -1 : counters.findIndex((c) => c.index === drawn),
  );
  const drawnCounter = $derived(drawnIndex >= 0 ? counters[drawnIndex] : null);

  // Counters sit in rows inside the bag's body, bottom row first, so a bag
  // with a few counters looks part-full rather than floating.
  const PER_ROW = 7;
  const R = 11;
  function place(k: number): { x: number; y: number } {
    const row = Math.floor(k / PER_ROW);
    const col = k % PER_ROW;
    const inRow = Math.min(PER_ROW, counters.length - (drawnIndex >= 0 ? 1 : 0) - row * PER_ROW);
    const x = 120 + (col - (inRow - 1) / 2) * 25;
    return { x, y: 206 - row * 24 };
  }
  const pile = $derived(
    counters
      .map((c, k) => ({ ...c, k }))
      .filter((c) => c.k !== drawnIndex)
      .map((c, k) => ({ ...c, ...place(k) })),
  );
</script>

<div class="bag" data-id={id}>
  <svg viewBox="0 0 240 240" role="img" aria-label="a bag of counters for {entry.prefix}">
    <path
      class="sack"
      d="M 72 62 Q 62 40 92 30 L 148 30 Q 178 40 168 62 Q 222 120 212 198 Q 206 232 120 232 Q 34 232 28 198 Q 18 120 72 62 Z"
    />
    <path class="tie" d="M 66 62 Q 120 74 174 62" />
    {#if !empty}
      {#each pile as c (c.k)}
        <circle
          cx={c.x}
          cy={c.y}
          r={R}
          class="counter"
          style="--c: {c.colour.hex}"
          data-id="{id}-c{c.k}"
        />
      {/each}
    {/if}
    {#if drawnCounter}
      <circle
        cx="120"
        cy="14"
        r={R + 3}
        class="counter drawn"
        style="--c: {drawnCounter.colour.hex}"
        data-id="{id}-c{drawnIndex}"
      />
    {/if}
  </svg>
  <div class="label" data-id="{id}-label">
    {#if drawnCounter}
      <span class="ledger-counter" style="--c: {drawnCounter.colour.hex}"></span>
      <span class="name">{drawnCounter.colour.name}</span>
      <span class="word">{drawnCounter.follower.text}</span>
    {:else if empty}
      <span class="hint">empty</span>
    {:else}
      <span class="hint">{counters.length} counters, one per mark</span>
    {/if}
  </div>
</div>

<style>
  .bag {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2em;
    font-size: 1.2rem;
  }

  svg {
    inline-size: 12em;
    block-size: 12em;
  }

  .sack {
    fill: #e9dfc9;
    stroke: #3a3020;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .tie {
    fill: none;
    stroke: #3a3020;
    stroke-width: 2;
  }

  .counter {
    fill: var(--c);
    stroke: rgb(0 0 0 / 60%);
    stroke-width: 1;
  }

  .counter.drawn {
    stroke: var(--anu-gold);
    stroke-width: 3;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 0.4em;
    font-size: 0.9em;
    min-block-size: 1.5em;
  }

  .name {
    color: var(--color-text-secondary);
  }

  .word {
    font-weight: 700;
    color: var(--anu-gold);
    font-size: 1.3em;
  }

  .hint {
    color: var(--color-text-muted);
  }
</style>
