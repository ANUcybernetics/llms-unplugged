<div
  class="model-scale-bars"
  role="img"
  aria-label="Two independent scales: 15 trillion tokens of training text and about 1 trillion parameters in the model"
>
  <div class="metric training">
    <div class="metric-heading">
      <span class="metric-name">training text</span>
      <strong>15 trillion tokens</strong>
    </div>
    <div class="track" aria-hidden="true"><span class="fill"></span></div>
    <span class="meaning">how much the model reads</span>
  </div>

  <p class="independent">two scales, growing independently</p>

  <div class="metric parameters">
    <div class="metric-heading">
      <span class="metric-name">model size</span>
      <strong>~1 trillion parameters</strong>
    </div>
    <div class="track" aria-hidden="true"><span class="fill"></span></div>
    <span class="meaning">how many numbers it learns</span>
  </div>
</div>

<style>
  /* Each track is its own scale: tokens and parameters have different units,
     so matching lengths mean "both grew", not "these quantities are equal". */
  .model-scale-bars {
    display: grid;
    gap: 1.1rem;
    inline-size: min(100%, 54rem);
    color: var(--color-text);
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
    font-size: 1.45rem;
  }

  .metric-name {
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .metric-heading strong {
    color: var(--anu-gold-2);
    font-size: 1.8rem;
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

  .parameters .fill {
    background: var(--anu-gold-2);
  }

  .meaning {
    color: var(--color-text-muted);
    font-size: 1.05rem;
    text-align: left;
  }

  .independent {
    color: var(--color-text-secondary);
    font-size: 1.15rem;
    font-style: italic;
    text-align: center;
  }

  /* Reveal adds .present to the active section. The unequal timings make the
     bars visibly independent without pretending their unlike units share an
     axis. Global keyframe names are needed because this selector crosses the
     Svelte scope boundary to reach Reveal's section. */
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
