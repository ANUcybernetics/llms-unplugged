<script lang="ts">
  interface Props {
    /** Grid dimensions to draw. */
    rows: number;
    cols: number;
    /** Whose grid this is, e.g. "Frankenstein". */
    label: string;
    /** Sub-label under the block, e.g. "7,441 tokens · 55 million cells". */
    detail?: string;
    /** A smaller grid drawn at true relative scale inside this one, so the
        audience can see the previous step shrink to a speck. */
    compareRows?: number;
    compareCols?: number;
    compareLabel?: string;
    /** Extra line under the comparison callout. */
    note?: string;
  }

  let {
    rows,
    cols,
    label,
    detail,
    compareRows,
    compareCols,
    compareLabel = "your grid",
    note,
  }: Props = $props();

  // Everything is drawn in viewBox px against a fixed 900x600 stage, so the
  // component sizes itself purely from CSS and the text never fights the block.
  // The block is centred and every caption is centred under it, which keeps a
  // 5-wide context strip and a 400-wide square looking like the same diagram.
  // BOX is the block's drawn size; the 130px below it is the caption stack, so
  // the stage height is BOX + 130.
  const BOX = 470;
  const CENTRE = 450;
  const TOP = 34;

  const unit = $derived(Math.min(BOX / cols, BOX / rows));
  const width = $derived(cols * unit);
  const height = $derived(rows * unit);
  const originX = $derived(CENTRE - width / 2);
  const bottom = $derived(TOP + height);
  // The block is one tiled pattern rather than rows*cols <rect>s: the cells are
  // uniform, so they render identically, and a 7,441-square grid would
  // otherwise be tens of megabytes of SSR'd markup. Below ~2px a tile is all
  // stroke and reads as flat grey, which is where the literal grid stops being
  // drawable --- the scale beat hands over to physical-area figures there.
  const tile = $derived(Math.max(unit, 2));

  const hasCompare = $derived(compareRows != null && compareCols != null);
  const compareW = $derived(hasCompare ? compareCols! * unit : 0);
  const compareH = $derived(hasCompare ? compareRows! * unit : 0);
  // Once the earlier grid is smaller than a few px it can no longer be seen as
  // a rectangle, so it gets a ringed speck and a leader line instead.
  const speck = $derived(hasCompare && (compareW < 8 || compareH < 8));
</script>

<svg class="grid-zoom" viewBox="0 0 900 600" role="img" aria-label="{label}: {rows} by {cols} grid">
  <defs>
    <pattern
      id="mesh-{rows}-{cols}"
      x={originX}
      y={TOP}
      width={tile}
      height={tile}
      patternUnits="userSpaceOnUse"
    >
      <path d="M {tile} 0 L 0 0 0 {tile}" fill="none" class="mesh" />
    </pattern>
  </defs>

  <rect x={originX} y={TOP} {width} {height} fill="url(#mesh-{rows}-{cols})" />
  <rect class="frame" x={originX} y={TOP} {width} {height} />

  {#if hasCompare}
    {#if speck}
      <!-- A speck plus a leader up to the caption: below a few px the earlier
           grid can't be read as a rectangle any more, and routing the leader
           above the block keeps it off the mesh. -->
      <circle class="speck" cx={originX + 5} cy={TOP + 5} r="5" />
      <line class="leader" x1={originX + 5} y1={TOP - 2} x2={CENTRE} y2={TOP - 14} />
    {:else}
      <rect class="compare" x={originX} y={TOP} width={compareW} height={compareH} />
    {/if}
    <text class="compare-label" x={CENTRE} y={TOP - 18}>{compareLabel}</text>
  {/if}

  <text class="label" x={CENTRE} y={bottom + 34}>{label}</text>
  {#if detail}
    <text class="detail" x={CENTRE} y={bottom + 60}>{detail}</text>
  {/if}
  {#if note}
    <text class="note" x={CENTRE} y={bottom + 86}>{note}</text>
  {/if}
</svg>

<style>
  /* Deck-only component, sized for the 1280x720 canvas: the block is a constant
     470 viewBox px square (for square grids), so stepping through the slides
     shrinks the cells rather than the block --- the zoom-out effect the scale
     beat is built on. The cap is set by the one slide that still carries an h2
     ("Every context needs its own row"); the scale-sequence slides run
     headingless, but they take the same cap so the block stays the same size
     across the whole run. */

  svg.grid-zoom {
    display: block;
    width: 100%;
    height: auto;
    max-height: 33rem;
    margin: 0 auto;
  }

  .mesh {
    stroke: var(--color-divider);
    stroke-width: 1;
  }

  .frame {
    fill: none;
    stroke: var(--color-border);
    stroke-width: 2;
  }

  .compare,
  .speck {
    fill: var(--lm-highlight-strong);
    stroke: var(--anu-gold);
    stroke-width: 2;
  }

  .leader {
    stroke: var(--anu-gold);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }

  text {
    fill: var(--color-text);
    font-family: var(--r-main-font, inherit);
    text-anchor: middle;
  }

  .label {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .detail {
    font-size: 1.15rem;
    fill: var(--color-text-secondary);
  }

  .compare-label {
    font-size: 1.15rem;
    fill: var(--anu-gold);
    font-weight: 600;
  }

  .note {
    font-size: 1.05rem;
    fill: var(--color-text-muted);
  }
</style>
