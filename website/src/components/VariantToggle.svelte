<script lang="ts">
  import {
    getVariant,
    setVariant,
    type Variant,
  } from "../lib/stores/variant.svelte";

  let current = $derived(getVariant());

  function select(v: Variant) {
    setVariant(v);
    document.documentElement.setAttribute("data-variant", v);
  }
</script>

<div class="lm-widget variant-toggle">
  <p class="variant-description">
    <strong>Choose your method:</strong> This lesson can be done with either a
    <em>grid</em> (paper and dice) or <em>cutouts</em> (physical tokens). Choose which
    suits your materials.
  </p>
  <div class="variant-buttons">
    <button
      class="variant-button"
      class:active={current === "grid"}
      onclick={() => select("grid")}
      aria-pressed={current === "grid"}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <rect
          x="3"
          y="3"
          width="6"
          height="6"
          fill="currentColor"
          opacity="0.15"
        />
        <rect
          x="3"
          y="9"
          width="6"
          height="15"
          rx="0"
          fill="currentColor"
          opacity="0.08"
        />
        <rect
          x="9"
          y="3"
          width="12"
          height="6"
          rx="0"
          fill="currentColor"
          opacity="0.08"
        />
      </svg>
      <span>Grid</span>
    </button>
    <button
      class="variant-button"
      class:active={current === "cutouts"}
      onclick={() => select("cutouts")}
      aria-pressed={current === "cutouts"}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <rect x="3" y="6" width="10" height="12" rx="1" />
        <rect x="7" y="3" width="10" height="12" rx="1" fill="currentColor" opacity="0.15" />
        <rect x="11" y="9" width="10" height="12" rx="1" />
      </svg>
      <span>Cutouts</span>
    </button>
  </div>
</div>

<style>
  .variant-description {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: var(--at-text-secondary);
  }

  .variant-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .variant-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--at-border);
    border-radius: 0.375rem;
    background: var(--at-bg);
    color: var(--at-text-secondary);
    cursor: pointer;
    font-size: 0.875rem;
    font-family: inherit;
    transition:
      color 0.15s,
      border-color 0.15s,
      background-color 0.15s;
  }

  .variant-button:hover {
    color: var(--at-text);
    border-color: var(--at-accent);
  }

  .variant-button.active {
    color: var(--at-accent);
    border-color: var(--at-accent);
    background: var(--at-accent-soft);
  }

  @media (max-width: 480px) {
    .variant-buttons {
      flex-direction: column;
    }
  }
</style>
