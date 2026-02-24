<script setup lang="ts">
import { computed } from "vue";
import type { BigramModel } from "../utils/tokens";

interface Props {
  vocabulary: string[];
  model: BigramModel;
  selectedRows: string[];
  distance: number | null;
}

const props = defineProps<Props>();

const vectors = computed(() =>
  props.selectedRows.map((word) => ({
    word,
    values: props.vocabulary.map((col) => props.model.getCount(word, col)),
  })),
);

const diffs = computed(() => {
  if (vectors.value.length < 2) return null;
  const [a, b] = vectors.value;
  return a.values.map((v, i) => Math.abs(v - b.values[i]));
});
</script>

<template>
  <div class="vector-comparison">
    <table class="comparison-table">
      <thead>
        <tr>
          <th scope="col"></th>
          <th
            v-for="word in vocabulary"
            :key="word"
            scope="col"
            :class="{ punctuation: word === '.' || word === ',' }"
          >
            <code>{{ word }}</code>
          </th>
          <th v-if="diffs" scope="col"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vec in vectors" :key="vec.word" class="vector-row">
          <th
            scope="row"
            :class="{ punctuation: vec.word === '.' || vec.word === ',' }"
          >
            <code>{{ vec.word }}</code>
          </th>
          <td v-for="(val, i) in vec.values" :key="i">{{ val }}</td>
          <td v-if="diffs" class="spacer"></td>
        </tr>
        <tr v-if="diffs" class="diff-row">
          <th scope="row"><code>|d|</code></th>
          <td v-for="(val, i) in diffs" :key="i" :class="{ nonzero: val > 0 }">
            {{ val }}
          </td>
          <td class="distance-sum">= {{ distance }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.vector-comparison {
  overflow-x: auto;
}

.comparison-table {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
  font-family: var(--vp-font-family-mono);
}

.comparison-table th,
.comparison-table td {
  padding: 0.5rem;
  text-align: center;
  min-width: 3rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-border);
}

.comparison-table th {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.comparison-table th code,
.comparison-table td code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.comparison-table th.punctuation code {
  font-weight: 700;
  font-size: 1rem;
  display: inline-block;
  border: 2px solid var(--vp-c-text-3);
  border-radius: 0.25rem;
  padding: 0 0.25rem;
}

.vector-row {
  background-color: var(--lm-highlight-soft);
}

.diff-row {
  border-top: 2px solid var(--vp-c-brand-1);
}

.diff-row td.nonzero {
  background-color: var(--lm-highlight-medium);
  font-weight: 600;
}

.spacer {
  border: none;
  background: none;
}

.distance-sum {
  font-weight: 700;
  white-space: nowrap;
  border: none;
  background: none;
}
</style>
