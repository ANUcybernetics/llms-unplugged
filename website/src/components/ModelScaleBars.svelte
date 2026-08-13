<script lang="ts">
  interface Props {
    /** Endpoint labels across the top of the strip. */
    startLabel?: string;
    endLabel?: string;
    /** Give `contextStart` to add a context row above the other two ---
        the three-dial form the scaling-up section uses. */
    contextStart?: string;
    contextEnd?: string;
    trainingStart: string;
    modelStart: string;
    trainingEnd?: string;
    modelEnd?: string;
    /** Caption under the bars; pass "" to drop it. */
    footer?: string;
  }

  let {
    startLabel = "today",
    endLabel = "frontier LLM",
    contextStart,
    contextEnd = "the whole conversation",
    trainingStart,
    modelStart,
    trainingEnd = "15 trillion tokens",
    modelEnd = "~1 trillion parameters",
    footer = "two independent scales · different kinds of model",
  }: Props = $props();

  const ariaContext = $derived(
    contextStart ? ` Context grows from ${contextStart} to ${contextEnd}.` : "",
  );
</script>

<div
  class="model-scale-bars"
  role="img"
  aria-label={`Independent scales.${ariaContext} Training text grows from ${trainingStart} to ${trainingEnd}. Model size grows from ${modelStart} to ${modelEnd}.`}
>
  <div class="endpoints" aria-hidden="true">
    <strong>{startLabel}</strong>
    <strong>{endLabel}</strong>
  </div>

  {#if contextStart}
    <div class="metric context">
      <div class="metric-heading">
        <span class="metric-name">context</span>
        <span class="meaning">how much it looks at before each guess</span>
      </div>
      <div class="track" aria-hidden="true"><span class="fill"></span></div>
      <div class="values">
        <strong>{contextStart}</strong>
        <strong>{contextEnd}</strong>
      </div>
    </div>
  {/if}

  <div class="metric training">
    <div class="metric-heading">
      <span class="metric-name">training text</span>
      <span class="meaning">how much the model reads</span>
    </div>
    <div class="track" aria-hidden="true"><span class="fill"></span></div>
    <div class="values">
      <strong>{trainingStart}</strong>
      <strong>{trainingEnd}</strong>
    </div>
  </div>

  <div class="metric parameters">
    <div class="metric-heading">
      <span class="metric-name">model size</span>
      <span class="meaning">how many learned numbers it contains</span>
    </div>
    <div class="track" aria-hidden="true"><span class="fill"></span></div>
    <div class="values">
      <strong>{modelStart}</strong>
      <strong>{modelEnd}</strong>
    </div>
  </div>

  {#if footer}
    <p class="independent">{footer}</p>
  {/if}
</div>

<style>
  /* Each track is its own scale: tokens and parameters have different units,
     so matching lengths mean "both grew", not "these quantities are equal". */
  .model-scale-bars {
    display: grid;
    gap: 1.35rem;
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
    border-block-end: 1px solid var(--color-divider);
    color: var(--color-text-secondary);
    font-size: 1.15rem;
  }

  .metric {
    display: grid;
    gap: 0.45rem;
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
    block-size: 2.4rem;
    overflow: hidden;
    border: 2px solid var(--color-border);
    background: var(--color-bg-soft);
  }

  .fill {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    background: var(--anu-gold);
    transform: scaleX(0);
    transform-origin: left center;
  }

  .context .fill,
  .parameters .fill {
    background: var(--anu-gold-2);
  }

  .meaning {
    color: var(--color-text-muted);
  }

  .values {
    align-items: baseline;
    color: var(--color-text-secondary);
    font-size: 1.15rem;
  }

  .values strong:last-child {
    color: var(--anu-gold-2);
    font-size: 1.45rem;
  }

  .independent {
    color: var(--color-text-secondary);
    font-size: 1.15rem;
    font-style: italic;
    text-align: center;
  }

  /* Reveal adds .present to the active section. Each track owns its scale: the
     animation says both quantities grew, without comparing unlike units or
     implying that one determines the other. */
  @keyframes -global-grow-context-scale {
    to {
      transform: scaleX(1);
    }
  }

  @keyframes -global-grow-training-scale {
    to {
      transform: scaleX(1);
    }
  }

  @keyframes -global-grow-parameter-scale {
    to {
      transform: scaleX(1);
    }
  }

  :global(section.present) .context .fill {
    animation: grow-context-scale 1.2s cubic-bezier(0.2, 0.75, 0.25, 1) 0.05s both;
  }

  :global(section.present) .training .fill {
    animation: grow-training-scale 1.5s cubic-bezier(0.2, 0.75, 0.25, 1) 0.15s both;
  }

  :global(section.present) .parameters .fill {
    animation: grow-parameter-scale 2.1s cubic-bezier(0.2, 0.75, 0.25, 1) 0.35s both;
  }

  @media (prefers-reduced-motion: reduce) {
    .fill {
      transform: scaleX(1);
    }

    :global(section.present) .fill {
      animation: none;
    }
  }

  :global(html.print-pdf) .fill {
    animation: none;
    transform: scaleX(1);
  }
</style>
