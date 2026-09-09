<script lang="ts">
  import {
    cupFor,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type LedgerEntry,
    type PaletteEntry,
  } from "../lib/ledger";

  interface Props {
    /** The row whose marks load the cup. */
    entry: LedgerEntry;
    columns?: number;
    firstRow?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    /**
     * Follower index of the counter drawn: it rises out of the cup with a
     * gold ring, and the label names its colour and word. Omit for a cup
     * that is loaded but not yet drawn from.
     */
    drawn?: number;
    /** Show the cup empty: the row is there, nothing has gone in yet. */
    empty?: boolean;
    /**
     * Load only the first `loaded` followers' counters, for a slide sequence
     * that fills the cup one colour at a time. Omit to load the whole row.
     */
    loaded?: number;
    id?: string;
  }

  let {
    entry,
    columns = LEDGER_COLUMNS,
    firstRow = 0,
    palette = LEDGER_PALETTE,
    drawn,
    empty = false,
    loaded,
    id = "ledger-cup",
  }: Props = $props();

  const counters = $derived(cupFor(entry, columns, firstRow, palette));
  // The one counter that comes out: the first of the drawn follower's.
  const drawnIndex = $derived(
    drawn === undefined ? -1 : counters.findIndex((c) => c.index === drawn),
  );
  const drawnCounter = $derived(drawnIndex >= 0 ? counters[drawnIndex] : null);

  // The cup's interior, as the drawing below tapers it: half-width TOP_HALF
  // at TOP_Y, narrowing to BOT_HALF at BOT_Y. Counters are packed bottom-up
  // inside that taper, inset by PAD on every side, so a full cup still has
  // paper showing around its counters however many the row holds.
  const R = 10;
  const GAP = 3;
  const PAD = 9;
  const TOP_Y = 70;
  const TOP_HALF = 80;
  const BOT_Y = 228;
  const BOT_HALF = 54;

  function halfWidth(y: number): number {
    const t = (y - TOP_Y) / (BOT_Y - TOP_Y);
    return TOP_HALF + t * (BOT_HALF - TOP_HALF);
  }

  // Every counter's place is fixed by the whole row's cup, never by how many
  // are on screen: a partly-loaded cup and a drawn-from one hold the rest
  // exactly where the full cup had them, so auto-animate moves only the
  // counter that left. A row wider than the cup can hold is packed anyway,
  // in rows that run past the rim rather than out through the sides --- but
  // no set in the room comes close (the widest is ten counters, three rows).
  function pack(total: number): { x: number; y: number }[] {
    const pitch = 2 * R + GAP;
    const places: { x: number; y: number }[] = [];
    let y = BOT_Y - PAD - R;
    while (places.length < total) {
      // The row is only as wide as its narrowest point, which is its base.
      const half = halfWidth(y + R) - PAD;
      const capacity = Math.max(1, Math.floor((2 * half + GAP) / pitch));
      const n = Math.min(capacity, total - places.length);
      for (let c = 0; c < n; c++) places.push({ x: 120 + (c - (n - 1) / 2) * pitch, y });
      y -= pitch;
    }
    return places;
  }

  const places = $derived(pack(counters.length));
  const inCup = $derived(
    loaded === undefined ? counters.length : counters.filter((c) => c.index < loaded).length,
  );
  const pile = $derived(
    counters
      .map((c, k) => ({ ...c, k, ...places[k] }))
      .filter((c) => c.k < inCup && c.k !== drawnIndex),
  );
</script>

<div class="cup" data-id={id}>
  <svg viewBox="0 0 240 240" role="img" aria-label="a cup of counters for {entry.prefix}">
    <path
      class="paper"
      d="M 38 64 L 66 220 Q 68 231 80 231 L 160 231 Q 172 231 174 220 L 202 64 Z"
    />
    <ellipse class="inside" cx="120" cy="64" rx="82" ry="13" />
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
        cy="16"
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
    {:else if empty || inCup === 0}
      <span class="hint">empty</span>
    {:else}
      <span class="hint">{inCup} counters, one per mark</span>
    {/if}
  </div>
</div>

<style>
  .cup {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2em;
    font-size: 1.2rem;
  }

  svg {
    inline-size: 11.5em;
    block-size: 11.5em;
  }

  .paper {
    fill: #f4efe4;
    stroke: #3a3020;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .inside {
    fill: #ddd3bd;
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
