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
    <em>grid</em> (paper and dice) or <em>buckets</em> (physical tokens). Choose which
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
      class:active={current === "bucket"}
      onclick={() => select("bucket")}
      aria-pressed={current === "bucket"}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M4 6h16l-2 14H6L4 6z" />
        <path d="M2 6h20" />
      </svg>
      <span>Buckets</span>
    </button>
  </div>
</div>

<style>
  .variant-description {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
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
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 0.875rem;
    font-family: inherit;
    transition:
      color 0.15s,
      border-color 0.15s,
      background-color 0.15s;
  }

  .variant-button:hover {
    color: var(--color-text);
    border-color: var(--color-brand);
  }

  .variant-button.active {
    color: var(--color-brand);
    border-color: var(--color-brand);
    background: var(--color-brand-soft);
  }

  @media (max-width: 480px) {
    .variant-buttons {
      flex-direction: column;
    }
  }
</style>
