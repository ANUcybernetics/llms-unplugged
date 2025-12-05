<script setup lang="ts">
import { computed } from "vue";

interface Props {
  headers: string[];
  data: (string | number)[][];
}

const props = defineProps<Props>();

/**
 * Convert a number to tally marks
 */
function tally(n: number): string {
  if (n === 0 || n == null) return "";
  const groups = Math.floor(n / 5);
  const remainder = n % 5;
  let marks = "";
  for (let i = 0; i < groups; i++) {
    marks += "卌 ";
  }
  if (remainder > 0) {
    marks += "|".repeat(remainder);
  }
  return marks.trim();
}

/**
 * Process a cell value - convert numbers to tally marks
 */
function processCell(cell: string | number): string {
  if (typeof cell === "number") {
    return tally(cell);
  }
  return cell ?? "";
}

const processedData = computed(() => {
  return props.data.map((row) => row.map((cell) => processCell(cell)));
});
</script>

<template>
  <div class="lm-table">
    <table>
      <thead>
        <tr>
          <th v-for="(header, i) in headers" :key="i">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIdx) in processedData" :key="rowIdx">
          <!-- eslint-disable vue/no-v-html -- trusted tally marks, not user input -->
          <td
            v-for="(cell, cellIdx) in row"
            :key="cellIdx"
            v-html="cell || '&nbsp;'"
          ></td>
          <!-- eslint-enable vue/no-v-html -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lm-table {
  overflow-x: auto;
  margin: 1.5rem 0;
}

.lm-table table {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
}

.lm-table th,
.lm-table td {
  padding: 0.5rem 0.75rem;
  text-align: center;
  border: 1px solid var(--vp-c-border);
}

.lm-table th {
  background-color: var(--vp-c-brand-soft);
  font-weight: 600;
}

.lm-table td:first-child {
  text-align: left;
  font-family: var(--vp-font-family-mono);
}
</style>
