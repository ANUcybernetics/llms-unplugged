<script lang="ts">
  interface Props {
    /** Endpoint labels across the top of the strip. */
    startLabel?: string;
    endLabel?: string;
    /** Each dial is a count at the start and a count at the end, plus the
        label to print for each. The counts place the marks on a shared
        log axis and pace the sweep; the labels carry the units. */
    contextFrom: number;
    contextFromLabel: string;
    contextTo?: number;
    contextToLabel?: string;
    trainingFrom: number;
    trainingFromLabel: string;
    trainingTo?: number;
    trainingToLabel?: string;
    modelFrom: number;
    modelFromLabel: string;
    modelTo?: number;
    modelToLabel?: string;
    /** Caption under the bars; pass "" to drop it. */
    footer?: string;
    /** Sweep pace. Every dial runs at the same zeros-per-second, so a dial
        that gains more zeros takes longer, and that is the point. */
    secondsPerZero?: number;
  }

  let {
    startLabel = "your grid",
    endLabel = "frontier LLM",
    contextFrom,
    contextFromLabel,
    contextTo = 1e6,
    contextToLabel = "1 million tokens",
    trainingFrom,
    trainingFromLabel,
    trainingTo = 15e12,
    trainingToLabel = "15 trillion tokens",
    modelFrom,
    modelFromLabel,
    modelTo = 1e12,
    modelToLabel = "~1 trillion parameters",
    footer = "three independent dials · none determines the others",
    secondsPerZero = 0.4,
  }: Props = $props();

  const GROUPS = ["", "thousand", "million", "billion", "trillion"];

  /** "1", "10", "100", "1 thousand", ... for a power of ten. */
  function powerLabel(exp: number): string {
    const group = Math.floor(exp / 3);
    const lead = 10 ** (exp - group * 3);
    const word = GROUPS[group];
    if (word === undefined) return `10^${exp}`;
    return word ? `${lead} ${word}` : `${lead}`;
  }

  interface Entry {
    text: string;
    /** Seconds into the sweep at which this label takes over. */
    at: number;
  }

  interface Dial {
    key: string;
    name: string;
    meaning: string;
    fromLabel: string;
    toLabel: string;
    /** Positions on the shared axis, as percentages. */
    x0: number;
    x1: number;
    duration: number;
    entries: Entry[];
  }

  const specs = $derived([
    {
      key: "context",
      name: "context",
      meaning: "how much it looks at before each guess",
      from: contextFrom,
      to: contextTo,
      fromLabel: contextFromLabel,
      toLabel: contextToLabel,
    },
    {
      key: "training",
      name: "training text",
      meaning: "how much the model reads",
      from: trainingFrom,
      to: trainingTo,
      fromLabel: trainingFromLabel,
      toLabel: trainingToLabel,
    },
    {
      key: "parameters",
      name: "model size",
      meaning: "how many learned numbers it contains",
      from: modelFrom,
      to: modelTo,
      fromLabel: modelFromLabel,
      toLabel: modelToLabel,
    },
  ]);

  // One axis for all three tracks, in powers of ten, with a little room past
  // the largest value so the last label isn't jammed against the edge.
  const axisMax = $derived(Math.max(...specs.map((s) => Math.log10(s.to))) + 0.35);

  const ticks = $derived(
    Array.from({ length: Math.floor(axisMax) + 1 }, (_, exp) => ({
      exp,
      x: (exp / axisMax) * 100,
      label: exp % 3 === 0 ? powerLabel(exp) : null,
    })),
  );

  const dials: Dial[] = $derived(
    specs.map((s) => {
      const l0 = Math.log10(s.from);
      const l1 = Math.log10(s.to);
      const zeros = l1 - l0;
      const duration = zeros * secondsPerZero;
      // The odometer ticks over at every whole power of ten strictly between
      // the two ends; the ends themselves print the caller's labels.
      const entries: Entry[] = [{ text: s.fromLabel, at: 0 }];
      for (let exp = Math.floor(l0) + 1; exp < l1; exp++) {
        entries.push({ text: powerLabel(exp), at: ((exp - l0) / zeros) * duration });
      }
      entries.push({ text: s.toLabel, at: duration });
      return {
        key: s.key,
        name: s.name,
        meaning: s.meaning,
        fromLabel: s.fromLabel,
        toLabel: s.toLabel,
        x0: (l0 / axisMax) * 100,
        x1: (l1 / axisMax) * 100,
        duration,
        entries,
      };
    }),
  );

  const ariaLabel = $derived(
    `Three dials on one logarithmic axis. ${dials
      .map((d) => `${d.name} grows from ${d.fromLabel} to ${d.toLabel}.`)
      .join(" ")}`,
  );

  function seconds(t: number): string {
    return `${t.toFixed(2)}s`;
  }
</script>

<div class="model-scale-bars" role="img" aria-label={ariaLabel}>
  <div class="endpoints" aria-hidden="true">
    <strong>{startLabel}</strong>
    <strong>{endLabel}</strong>
  </div>

  {#each dials as dial (dial.key)}
    <div class="metric {dial.key}" style="--dur: {seconds(dial.duration)}">
      <div class="metric-heading">
        <span class="metric-name">{dial.name}</span>
        <span class="meaning">{dial.meaning}</span>
      </div>
      <div class="track" aria-hidden="true">
        {#each ticks as tick (tick.exp)}
          <span class="tick" class:major={tick.label !== null} style="--x: {tick.x}%"></span>
        {/each}
        <span class="fill" style="--x0: {dial.x0}%; --w: {dial.x1 - dial.x0}%"></span>
        <span class="start" style="--x: {dial.x0}%"></span>
      </div>
      <div class="values">
        <strong>{dial.fromLabel}</strong>
        <span class="odometer">
          {#each dial.entries as entry, i (i)}
            <strong
              class="entry"
              class:first={i === 0}
              class:last={i === dial.entries.length - 1}
              style="--at: {seconds(entry.at)}; --next: {seconds(
                dial.entries[i + 1]?.at ?? entry.at,
              )}">{entry.text}</strong
            >
          {/each}
        </span>
      </div>
    </div>
  {/each}

  <div class="ruler" aria-hidden="true">
    {#each ticks as tick (tick.exp)}
      {#if tick.label !== null}
        <span class="ruler-label" style="--x: {tick.x}%">{tick.label}</span>
      {/if}
    {/each}
  </div>

  {#if footer}
    <p class="independent">{footer}</p>
  {/if}
</div>

<style>
  /* Every track sits on the same axis of powers of ten, so a position is a
     count and a length is a number of zeros gained. That compares "how many"
     across unlike units (words, cells, parameters), which is the claim being
     made; the labels carry the units. */
  .model-scale-bars {
    display: grid;
    gap: 0.75rem;
    inline-size: min(100%, 54rem);
    color: var(--color-text);
  }

  .endpoints,
  .values {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
  }

  .endpoints {
    padding-block-end: 0.2rem;
    border-block-end: var(--grid-rule-width) solid var(--grid-rule-color);
    color: var(--color-text-secondary);
    font-size: 1.15rem;
  }

  .metric {
    display: grid;
    gap: 0.3rem;
  }

  .metric-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 2rem;
    font-size: 1.2rem;
  }

  .metric-name {
    color: var(--anu-gold-2);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .track {
    position: relative;
    block-size: 2.1rem;
    overflow: hidden;
    border: 2px solid var(--color-border);
    background: var(--color-bg-soft);
  }

  .tick {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--x);
    inline-size: 1px;
    background: var(--color-border);
    opacity: 0.5;
  }

  .tick.major {
    inline-size: 2px;
    opacity: 1;
  }

  .fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--x0);
    inline-size: var(--w);
    background: var(--anu-gold);
    transform: scaleX(0);
    transform-origin: left center;
  }

  .context .fill,
  .parameters .fill {
    background: var(--anu-gold-2);
  }

  /* Where the grid already stands, visible before the sweep starts. */
  .start {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--x);
    inline-size: 4px;
    margin-inline-start: -2px;
    background: var(--color-text);
  }

  .meaning {
    color: var(--color-text-muted);
  }

  .values {
    align-items: baseline;
    color: var(--color-text-secondary);
    font-size: 1.15rem;
  }

  /* The odometer stacks every label on the same spot and shows one at a
     time, so the count ticks over a power of ten at the moment the sweep
     passes it. All entries are laid out, so the slot is as tall as one line
     and as wide as the widest label. */
  .odometer {
    position: relative;
    display: grid;
    text-align: end;
  }

  .entry {
    grid-area: 1 / 1;
    color: var(--anu-gold-2);
    font-size: 1.45rem;
    white-space: nowrap;
    opacity: 0;
  }

  .entry.first {
    opacity: 1;
  }

  .ruler {
    position: relative;
    block-size: 1.3rem;
    color: var(--color-text-muted);
    font-size: 1rem;
  }

  .ruler-label {
    position: absolute;
    inset-inline-start: var(--x);
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .ruler-label:first-child {
    transform: none;
  }

  .independent {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 1.15rem;
    font-style: italic;
    text-align: center;
  }

  /* Reveal adds .present to the active section. The sweep is linear so the
     odometer's step times, computed in log space, line up with the bar's tip. */
  @keyframes -global-dial-sweep {
    to {
      transform: scaleX(1);
    }
  }

  @keyframes -global-dial-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes -global-dial-out {
    from {
      opacity: 1;
    }

    to {
      opacity: 0;
    }
  }

  :global(section.present) .fill {
    animation: dial-sweep var(--dur) linear 0.3s both;
  }

  :global(section.present) .entry {
    animation:
      dial-in 1ms linear calc(0.3s + var(--at)) both,
      dial-out 1ms linear calc(0.3s + var(--next)) forwards;
  }

  :global(section.present) .entry.first {
    animation: dial-out 1ms linear calc(0.3s + var(--next)) forwards;
  }

  :global(section.present) .entry.last {
    animation: dial-in 1ms linear calc(0.3s + var(--at)) both;
  }

  @media (prefers-reduced-motion: reduce) {
    .fill,
    :global(section.present) .fill {
      animation: none;
      transform: scaleX(1);
    }

    .entry,
    :global(section.present) .entry {
      animation: none;
      opacity: 0;
    }

    .entry.last,
    :global(section.present) .entry.last {
      opacity: 1;
    }
  }

  :global(html.print-pdf) .fill {
    animation: none;
    transform: scaleX(1);
  }

  :global(html.print-pdf) .entry {
    animation: none;
    opacity: 0;
  }

  :global(html.print-pdf) .entry.last {
    opacity: 1;
  }
</style>
