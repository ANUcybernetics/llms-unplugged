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
     * Follower index of the counter drawn: it leaves the cup for its box on
     * the row (LedgerRow's `counters.drawn`), and the label names its colour.
     * Omit for a cup that is loaded but not yet drawn from.
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

  // The cup seen from above, as the videos draw it (ops/video/STYLE.md): a
  // rim in line with the counters filled in their colours. Counters are laid
  // on a sunflower spiral, which fills a circle evenly for any count. Every
  // counter's place is fixed by the whole row's cup, never by how many are on
  // screen, so a partly-loaded cup and a drawn-from one hold the rest exactly
  // where the full cup had them and auto-animate moves only the counters that
  // arrived or left.
  //
  // The counters are HTML, not SVG, and their data-ids (`${id}-c${k}`, k the
  // counter's place in cupFor) are shared with LedgerRow's `counters`: a
  // row's lifted counters fly from its box into the cup, and the drawn one
  // flies out of the cup onto its box.
  const FACE = 11.5;
  const COUNTER = 1.05;
  const REACH = FACE / 2 - 0.45 - COUNTER / 2 - 0.3;

  function slot(i: number, n: number): { x: number; y: number } {
    const k = i + 0.5;
    const r = Math.sqrt(k / Math.max(n, 1)) * REACH;
    const th = k * 2.399963 + 0.7;
    return { x: FACE / 2 + r * Math.cos(th), y: FACE / 2 + r * Math.sin(th) };
  }

  const inCup = $derived(
    loaded === undefined ? counters.length : counters.filter((c) => c.index < loaded).length,
  );
  const pile = $derived(
    counters
      .map((c, k) => ({ ...c, k, ...slot(k, counters.length) }))
      .filter((c) => c.k < inCup && c.k !== drawnIndex),
  );
</script>

<div class="cup" data-id={id} style="--face: {FACE}em; --counter: {COUNTER}em">
  <div class="face" role="img" aria-label="a cup of counters for {entry.prefix}">
    <!-- Matched across slides, so the rim holds still while counters move. -->
    <span class="rim" data-id="{id}-rim"></span>
    {#if !empty}
      {#each pile as c (c.k)}
        <span
          class="ledger-counter"
          style="--c: {c.colour.hex}; left: {c.x}em; top: {c.y}em"
          data-id="{id}-c{c.k}"
        ></span>
      {/each}
    {/if}
  </div>
  <!-- No data-id: matched, auto-animate would stretch the old label into the
       new one. Unmatched, it changes the moment the counters start to move. -->
  <div class="label">
    {#if drawnCounter}
      <span class="ledger-counter" style="--c: {drawnCounter.colour.hex}"></span>
      <span class="name">{drawnCounter.colour.name}</span>
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
    gap: 0.4em;
    font-size: 1.2rem;
  }

  .face {
    position: relative;
    inline-size: var(--face);
    block-size: var(--face);
  }

  /* The rim: one line in the slide's ink, and a fainter one inside it. */
  .rim {
    position: absolute;
    inset: 0;
    border: 2px solid var(--color-text);
    border-radius: 50%;
  }

  .rim::after {
    content: "";
    position: absolute;
    inset: 0.4em;
    border: 1px solid var(--color-text-muted);
    border-radius: 50%;
  }

  .face .ledger-counter {
    position: absolute;
    inline-size: var(--counter);
    block-size: var(--counter);
    translate: -50% -50%;
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

  .hint {
    color: var(--color-text-muted);
  }
</style>
