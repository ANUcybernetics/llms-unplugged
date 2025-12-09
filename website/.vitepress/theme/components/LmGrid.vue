<script setup lang="ts">
import { computed } from "vue";
import { getVocabulary, getBigrams } from "../utils/tokens";
import { tally } from "../utils/tally";

interface Props {
  tokens: string;
}

const props = defineProps<Props>();

const grid = computed(() => {
  const tokenList = props.tokens.trim().split(/\s+/).filter(Boolean);
  const vocabulary = getVocabulary(tokenList);
  const bigrams = getBigrams(tokenList);

  const counts = new Map<string, number>();
  for (const [from, to] of bigrams) {
    const key = `${from}->${to}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const rows = vocabulary.map((from) => ({
    label: from,
    cells: vocabulary.map((to) => {
      const count = counts.get(`${from}->${to}`) || 0;
      return count > 0 ? tally(count) : "";
    }),
  }));

  return { headers: ["", ...vocabulary], rows };
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
