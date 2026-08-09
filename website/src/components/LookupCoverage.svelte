<script lang="ts">
  interface Props {
    contextLabel?: string;
    note?: string;
  }

  let {
    contextLabel = "three words of context · 100,000-token vocabulary",
    note = "at one centimetre per cell: 20 × the surface of the Earth",
  }: Props = $props();
</script>

<div
  class="lookup-coverage"
  role="img"
  aria-label="15 trillion observed tokens can cover at most one cell in seven million of a 100 quintillion-cell lookup table"
>
  <div class="field" aria-hidden="true">
    <span class="observed-cell"></span>
  </div>

  <div class="calculation">
    <p class="context">{contextLabel}</p>
    <div class="fraction">
      <span><strong>15 trillion</strong> observations</span>
      <span class="rule"></span>
      <span><strong>100 quintillion</strong> possible cells</span>
    </div>
    <p class="result"><strong>one cell</strong> in seven million</p>
    <p class="meaning">can ever have been seen</p>
    {#if note}<p class="note">{note}</p>{/if}
  </div>
</div>

<style>
  .lookup-coverage {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    align-items: center;
    gap: 3.5rem;
    inline-size: min(100%, 61rem);
    color: var(--color-text);
  }

  .field {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border: 2px solid var(--color-border);
    background-color: var(--color-bg-soft);
    background-image:
      linear-gradient(to right, var(--color-divider) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-divider) 1px, transparent 1px);
    background-size: 0.38rem 0.38rem;
  }

  .field::after {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 31% 42%, transparent 0, var(--color-bg) 72%);
    content: "";
    opacity: 0.48;
  }

  .observed-cell {
    position: absolute;
    z-index: 1;
    inset: 42% auto auto 31%;
    inline-size: 0.8rem;
    block-size: 0.8rem;
    background: var(--anu-gold-2);
    box-shadow: 0 0 1.5rem var(--anu-gold-2);
    transform: translate(-50%, -50%);
  }

  :global(section.present) .observed-cell {
    animation: coverage-cell-pulse 1.2s ease-out 0.35s both;
  }

  .calculation {
    display: grid;
    gap: 0.8rem;
    text-align: left;
  }

  .calculation p {
    margin: 0;
  }

  .context,
  .meaning,
  .note {
    color: var(--color-text-muted);
  }

  .context {
    font-size: 1rem;
  }

  .fraction {
    display: grid;
    gap: 0.35rem;
    color: var(--color-text-secondary);
    font-size: 1.15rem;
  }

  .fraction strong {
    color: var(--color-text);
    font-size: 1.45rem;
  }

  .rule {
    block-size: 2px;
    inline-size: 100%;
    background: var(--color-border);
  }

  .result {
    color: var(--anu-gold-2);
    font-size: 1.75rem;
    font-weight: 600;
  }

  .result strong {
    font-size: 2.3rem;
  }

  .meaning {
    font-size: 1.1rem;
  }

  .note {
    padding-block-start: 0.5rem;
    border-block-start: 1px solid var(--color-divider);
    font-size: 0.9rem;
  }

  @keyframes -global-coverage-cell-pulse {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    55% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.8);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(section.present) .observed-cell {
      animation: none;
    }
  }

  :global(html.print-pdf) .observed-cell {
    animation: none;
  }
</style>
