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
        <span class="variant-icon">📊</span>
        <span class="variant-label">Grid</span>
      </button>
      <button
        class="variant-button"
        :class="{ active: !isGrid }"
        @click="setVariant('bucket')"
      >
        <span class="variant-icon">🪣</span>
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
  font-size: 1.125rem;
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
