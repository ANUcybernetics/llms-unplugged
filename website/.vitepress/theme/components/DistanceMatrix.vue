<script setup lang="ts">
import { computed } from "vue";

interface Props {
  vocabulary: string[];
  matrix: number[][];
  selectedPair: [string, string] | null;
}

const props = defineProps<Props>();

const maxDistance = computed(() => {
  let max = 0;
  for (const row of props.matrix) {
    for (const val of row) {
      if (val > max) max = val;
    }
  }
  return max;
});

function cellStyle(val: number): Record<string, string> {
  const max = maxDistance.value;
  const opacity = max > 0 ? 1 - val / max : 1;
  const light = opacity > 0.45;
  return {
    backgroundColor: `rgba(190, 131, 14, ${opacity})`,
    color: light ? "#000" : "#fff",
  };
}

function isHighlighted(rowWord: string, colWord: string): boolean {
  if (!props.selectedPair) return false;
  const [a, b] = props.selectedPair;
  return (rowWord === a && colWord === b) || (rowWord === b && colWord === a);
}

function isHeaderHighlighted(word: string): boolean {
  if (!props.selectedPair) return false;
  return props.selectedPair.includes(word);
}
</script>

<template>
  <div class="distance-matrix-section">
    <table class="distance-matrix">
      <thead>
        <tr>
          <th scope="col"></th>
          <th
            v-for="word in vocabulary"
            :key="word"
            scope="col"
            :class="{
              'highlight-header': isHeaderHighlighted(word),
              punctuation: word === '.' || word === ',',
            }"
          >
            <code>{{ word }}</code>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in matrix" :key="vocabulary[i]">
          <th
            scope="row"
            :class="{
              'highlight-header': isHeaderHighlighted(vocabulary[i]),
              punctuation: vocabulary[i] === '.' || vocabulary[i] === ',',
            }"
          >
            <code>{{ vocabulary[i] }}</code>
          </th>
          <td
            v-for="(val, j) in row"
            :key="vocabulary[j]"
            :style="cellStyle(val)"
            :class="{
              'highlight-cell': isHighlighted(vocabulary[i], vocabulary[j]),
            }"
          >
            {{ val }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.distance-matrix-section {
  overflow-x: auto;
}

.distance-matrix {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
  font-family: var(--vp-font-family-mono);
}

.distance-matrix th,
.distance-matrix td {
  padding: 0.5rem;
  text-align: center;
  min-width: 3rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-border);
}

.distance-matrix th {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.distance-matrix th code,
.distance-matrix td code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.distance-matrix th.punctuation code {
  font-weight: 700;
  font-size: 1rem;
  display: inline-block;
  border: 2px solid var(--vp-c-text-3);
  border-radius: 0.25rem;
  padding: 0 0.25rem;
}

.distance-matrix th.highlight-header {
  background-color: var(--lm-highlight-medium);
}

.distance-matrix td.highlight-cell {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: -3px;
  font-weight: 700;
}
</style>
