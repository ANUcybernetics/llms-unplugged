<script lang="ts">
  import {
    applyVariantToDocument,
    getVariant,
    setVariant,
    type Variant,
  } from "../lib/stores/variant.svelte";

  interface Props {
    /** The variants this page has content for, in toggle order. */
    options?: Variant[];
  }

  let { options = ["grid", "cutouts"] }: Props = $props();

  const LABELS: Record<Variant, { name: string; article: string; gloss: string }> = {
    grid: { name: "Grid", article: "a ", gloss: "paper and dice" },
    ledger: { name: "Ledger", article: "a ", gloss: "tally sheets and a cup of counters" },
    cutouts: { name: "Cutouts", article: "", gloss: "printed tokens" },
  };

  // The stored choice is site-wide, so a page without content for it shows
  // its first option instead, without overwriting the visitor's choice.
  let current = $derived(options.includes(getVariant()) ? getVariant() : options[0]);

  $effect(() => {
    applyVariantToDocument(current);
  });

  const separator = (i: number): string =>
    i === 0 ? "" : i === options.length - 1 ? " or " : ", ";
</script>

<div class="lm-widget">
  <p class="variant-description">
    <strong>Choose your method:</strong> this module works with
    {#each options as v, i (v)}{separator(i)}{LABELS[v].article}<em
        >{LABELS[v].name.toLowerCase()}</em
      >
      ({LABELS[v].gloss}){/each}. Choose whichever suits your materials.
  </p>
  <div class="variant-buttons">
    {#each options as v (v)}
      <button
        class="variant-button"
        class:active={current === v}
        onclick={() => setVariant(v)}
        aria-pressed={current === v}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          {#if v === "grid"}
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.15" />
            <rect x="3" y="9" width="6" height="15" rx="0" fill="currentColor" opacity="0.08" />
            <rect x="9" y="3" width="12" height="6" rx="0" fill="currentColor" opacity="0.08" />
          {:else if v === "ledger"}
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <rect x="10" y="4.5" width="3" height="3" fill="currentColor" opacity="0.35" />
            <rect x="15" y="4.5" width="3" height="3" fill="currentColor" opacity="0.15" />
            <rect x="10" y="10.5" width="3" height="3" fill="currentColor" opacity="0.15" />
            <rect x="15" y="16.5" width="3" height="3" fill="currentColor" opacity="0.35" />
          {:else}
            <rect x="3" y="6" width="10" height="12" rx="1" />
            <rect x="7" y="3" width="10" height="12" rx="1" fill="currentColor" opacity="0.15" />
            <rect x="11" y="9" width="10" height="12" rx="1" />
          {/if}
        </svg>
        <span>{LABELS[v].name}</span>
      </button>
    {/each}
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
    border-radius: var(--at-border-radius);
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

  @container (width <= 480px) {
    .variant-buttons {
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .variant-button {
      transition: none;
    }
  }
</style>
