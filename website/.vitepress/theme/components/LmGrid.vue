<script setup lang="ts">
import { computed } from "vue";
import { tally } from "../utils/tally";

interface Props {
  tokens: string;
  nrows?: number;
  ncols?: number;
}

const props = withDefaults(defineProps<Props>(), {
  nrows: undefined,
  ncols: undefined,
});

/**
 * Parse the space-separated token string into an array
 */
function parseTokens(tokenString: string): string[] {
  return tokenString.trim().split(/\s+/).filter(Boolean);
}

const grid = computed(() => {
  const tokens = parseTokens(props.tokens);

  // Get unique tokens in order of first appearance
  const unique = [...new Set(tokens)];

  // Count bigram occurrences
  const counts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = `${tokens[i]}->${tokens[i + 1]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Determine dimensions
  const nrows = props.nrows ?? unique.length;
  const ncols = props.ncols ?? unique.length + 1;

  // Build headers (first empty, then tokens up to ncols limit)
  const headers: string[] = [""];
  for (let i = 0; i < ncols - 1; i++) {
    headers.push(i < unique.length ? unique[i] : "");
  }

  // Build rows with counts
  const rows: { label: string; cells: string[] }[] = [];
  for (let rowIdx = 0; rowIdx < nrows; rowIdx++) {
    const cells: string[] = [];
    let label = "";

    if (rowIdx < unique.length) {
      const from = unique[rowIdx];
      label = from;
      for (let colIdx = 0; colIdx < ncols - 1; colIdx++) {
        if (colIdx < unique.length) {
          const to = unique[colIdx];
          const key = `${from}->${to}`;
          const count = counts.get(key) || 0;
          cells.push(count > 0 ? tally(count) : "");
        } else {
          cells.push("");
        }
      }
    } else {
      for (let i = 0; i < ncols - 1; i++) {
        cells.push("");
      }
    }
    rows.push({ label, cells });
  }

  return { headers, rows };
});
</script>

<template>
  <div class="lm-grid">
    <table>
      <thead>
        <tr>
          <th v-for="(header, i) in grid.headers" :key="i">
            <code v-if="header">{{ header }}</code>
            <span v-else>&nbsp;</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIdx) in grid.rows" :key="rowIdx">
          <td>
            <code v-if="row.label">{{ row.label }}</code>
            <span v-else>&nbsp;</span>
          </td>
          <td v-for="(cell, cellIdx) in row.cells" :key="cellIdx">
            {{ cell || "&nbsp;" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
