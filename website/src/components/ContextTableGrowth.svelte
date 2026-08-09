<script lang="ts">
  interface Props {
    vocabulary: number;
    footprints: [string, string, string];
  }

  let { vocabulary, footprints }: Props = $props();

  const rows = $derived([vocabulary, vocabulary ** 2, vocabulary ** 3]);

  function compact(value: number): string {
    const [scale, suffix] =
      value >= 1e12
        ? [1e12, " trillion"]
        : value >= 1e9
          ? [1e9, " billion"]
          : value >= 1e6
            ? [1e6, " million"]
            : [1, ""];
    const scaled = value / scale;
    const rounded = scaled >= 100 ? Math.round(scaled) : Number(scaled.toPrecision(3));
    return `${rounded.toLocaleString("en-AU")}${suffix}`;
  }

  const stages = $derived(
    rows.map((rowCount, index) => ({
      context: ["one word", "two words", "three words"][index],
      rows: `${compact(rowCount)} rows`,
      footprint: footprints[index],
    })),
  );
</script>

<div
  class="context-growth"
  role="img"
  aria-label={`As context grows from one to three words, the table keeps ${compact(vocabulary)} next-token columns while its rows grow from ${compact(rows[0])} to ${compact(rows[2])}`}
>
  <div class="fixed-axis">
    <span class="axis-line" aria-hidden="true"></span>
    <strong>{compact(vocabulary)} next-token columns</strong>
    <span>stay fixed</span>
  </div>

  <div class="stages">
    {#each stages as stage, index}
      <div class:fragment={index > 0} class="stage">
        <div class="table-shell" class:has-break={index > 0} style:--stage={index}>
          <div class="table-fill"></div>
          {#if index > 0}<span class="break" aria-hidden="true">⋯</span>{/if}
        </div>
        <strong class="context">{stage.context}</strong>
        <span class="rows">{stage.rows}</span>
        <span class="footprint">{stage.footprint}</span>
      </div>
    {/each}
  </div>

  <p class="growth-rule">each extra context word multiplies the rows by {compact(vocabulary)}</p>
  <p class="scale-note">schematic — heights are not to scale</p>
</div>

<style>
  .context-growth {
    display: grid;
    gap: 0.7rem;
    inline-size: min(100%, 60rem);
    color: var(--color-text);
  }

  .fixed-axis {
    display: grid;
    grid-template-columns: 1fr auto auto 1fr;
    align-items: center;
    gap: 0.7rem;
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }

  .fixed-axis::after,
  .axis-line {
    block-size: 2px;
    background: var(--color-border);
    content: "";
  }

  .fixed-axis strong {
    color: var(--anu-gold-2);
    font-size: 1.35rem;
  }

  .stages {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: end;
    gap: 2.5rem;
    min-block-size: 22rem;
  }

  .stage {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
  }

  .table-shell {
    position: relative;
    inline-size: 10.5rem;
    block-size: calc(6rem + var(--stage) * 6.5rem);
    overflow: hidden;
    border: 2px solid var(--color-border);
    background: var(--color-bg-soft);
  }

  .table-fill {
    inline-size: 100%;
    block-size: 100%;
    background-color: var(--lm-highlight-soft);
    background-image:
      linear-gradient(to right, var(--color-divider) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-divider) 1px, transparent 1px);
    background-size: 0.55rem 0.55rem;
    transform-origin: center bottom;
  }

  .stage.fragment .table-fill {
    transform: scaleY(0);
  }

  .stage.fragment:global(.visible) .table-fill {
    animation: grow-context-table 0.85s cubic-bezier(0.2, 0.75, 0.25, 1) both;
  }

  .break {
    position: absolute;
    inset: 50% 0 auto;
    display: grid;
    place-items: center;
    block-size: 2rem;
    background: var(--color-bg);
    color: var(--anu-gold-2);
    font-size: 2rem;
    line-height: 1;
    transform: translateY(-50%);
  }

  .context {
    margin-block-start: 0.3rem;
    font-size: 1.3rem;
  }

  .rows {
    color: var(--anu-gold-2);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .footprint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .growth-rule,
  .scale-note {
    margin: 0;
    text-align: center;
  }

  .growth-rule {
    color: var(--color-text-secondary);
    font-size: 1.2rem;
  }

  .scale-note {
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  @keyframes -global-grow-context-table {
    to {
      transform: scaleY(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stage.fragment .table-fill {
      transform: scaleY(1);
    }

    .stage.fragment:global(.visible) .table-fill {
      animation: none;
    }
  }

  :global(html.print-pdf) .stage.fragment .table-fill {
    animation: none;
    transform: scaleY(1);
  }
</style>
