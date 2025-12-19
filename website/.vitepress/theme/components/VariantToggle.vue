<script setup lang="ts">
import { computed } from "vue";
import { useVariant } from "../composables/useVariant";

const { variant, setVariant } = useVariant();

const isGrid = computed(() => variant.value === "grid");
</script>

<template>
  <div class="variant-toggle-box">
    <div class="variant-info">
      <strong>Choose your method:</strong>
      This lesson can be done with either a <em>grid</em> (paper and dice) or
      <em>buckets</em> (physical tokens). Pick whichever suits your group best;
      both teach the same concepts.
    </div>
    <div class="variant-switcher">
      <button
        class="variant-button"
        :class="{ active: isGrid }"
        @click="setVariant('grid')"
      >
        <svg
          class="variant-icon"
          viewBox="-1 -1 23 23"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <!-- Header row and column (subtle fill) -->
          <rect x="0" y="0" width="21" height="7" opacity="0.3" fill="currentColor" stroke="none" />
          <rect x="0" y="0" width="7" height="21" opacity="0.3" fill="currentColor" stroke="none" />
          <!-- Horizontal lines -->
          <line x1="0" y1="0" x2="21" y2="0" />
          <line x1="0" y1="7" x2="21" y2="7" />
          <line x1="0" y1="14" x2="21" y2="14" />
          <line x1="0" y1="21" x2="21" y2="21" />
          <!-- Vertical lines -->
          <line x1="0" y1="0" x2="0" y2="21" />
          <line x1="7" y1="0" x2="7" y2="21" />
          <line x1="14" y1="0" x2="14" y2="21" />
          <line x1="21" y1="0" x2="21" y2="21" />
        </svg>
        <span class="variant-label">Grid</span>
      </button>
      <button
        class="variant-button"
        :class="{ active: !isGrid }"
        @click="setVariant('bucket')"
      >
        <svg
          class="variant-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 6h14l-1.5 14H6.5L5 6z" />
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
        </svg>
        <span class="variant-label">Bucket</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.variant-toggle-box {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
}

.variant-info {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.variant-switcher {
  display: flex;
  gap: 0.5rem;
}

.variant-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 2px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.variant-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.variant-button.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.variant-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.variant-label {
  text-transform: capitalize;
}

@media (max-width: 480px) {
  .variant-switcher {
    flex-direction: column;
  }
}
</style>
