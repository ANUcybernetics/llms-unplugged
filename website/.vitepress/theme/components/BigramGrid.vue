<script setup lang="ts">
import { tally } from "../utils/tally";

interface Props {
  vocabulary: string[];
  getCount: (from: string, to: string) => number;
  highlightedRow?: string | null;
  highlightedCol?: string | null;
  isHighlightedCol?: (word: string) => boolean;
  isCurrentCell?: (from: string, to: string) => boolean;
  clickableRows?: boolean;
  isRowClickable?: (word: string) => boolean;
  isDeadEnd?: (word: string) => boolean;
  showRowIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  highlightedRow: null,
  highlightedCol: null,
  isHighlightedCol: undefined,
  isCurrentCell: undefined,
  clickableRows: false,
  isRowClickable: () => true,
  isDeadEnd: () => false,
  showRowIndicator: false,
});

const emit = defineEmits<{
  rowClick: [word: string];
}>();

function checkHighlightedCol(word: string): boolean {
  if (props.isHighlightedCol) {
    return props.isHighlightedCol(word);
  }
  return props.highlightedCol === word;
}

function checkCurrentCell(from: string, to: string): boolean {
  if (props.isCurrentCell) {
    return props.isCurrentCell(from, to);
  }
  return props.highlightedRow === from && props.highlightedCol === to;
}

function handleRowClick(word: string) {
  if (props.clickableRows && props.isRowClickable(word)) {
    emit("rowClick", word);
  }
}
</script>

<template>
  <div class="grid-section">
    <table class="bigram-grid">
      <thead>
        <tr>
          <th scope="col"></th>
          <th
            v-for="word in vocabulary"
            :key="word"
            scope="col"
            :class="{
              'highlight-col': checkHighlightedCol(word),
              punctuation: word === '.' || word === ',',
            }"
          >
            <code>{{ word }}</code>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="rowWord in vocabulary"
          :key="rowWord"
          :class="{
            'highlight-row': highlightedRow === rowWord,
            'dead-end': isDeadEnd(rowWord),
            clickable: clickableRows && isRowClickable(rowWord),
          }"
          @click="handleRowClick(rowWord)"
        >
          <th
            class="row-header"
            scope="row"
            :class="{
              'highlight-row': highlightedRow === rowWord,
              punctuation: rowWord === '.' || rowWord === ',',
            }"
          >
            <span
              v-if="showRowIndicator && highlightedRow === rowWord"
              class="row-indicator"
            >▸</span>
            <code>{{ rowWord }}</code>
          </th>
          <td
            v-for="colWord in vocabulary"
            :key="colWord"
            class="grid-cell"
            :class="{
              'highlight-col':
                checkHighlightedCol(colWord) && highlightedRow === rowWord,
              'highlight-row': highlightedRow === rowWord,
              'current-cell': checkCurrentCell(rowWord, colWord),
              flash: checkCurrentCell(rowWord, colWord),
            }"
          >
            {{ tally(getCount(rowWord, colWord)) || "" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.grid-section {
  overflow-x: auto;
}

.bigram-grid {
  border-collapse: collapse;
  border: 1px solid var(--vp-c-border);
  font-size: 0.875rem;
}

.bigram-grid th,
.bigram-grid td {
  padding: 0.5rem;
  text-align: center;
  min-width: 3rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-border);
}

.bigram-grid th {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
}

.bigram-grid th.punctuation code,
.bigram-grid td.punctuation code {
  font-weight: 700;
  font-size: 1rem;
  display: inline-block;
  border: 2px solid var(--vp-c-text-3);
  border-radius: 0.25rem;
  padding: 0 0.25rem;
}

.bigram-grid th.highlight-col {
  background-color: var(--lm-highlight-medium);
}

.bigram-grid th code,
.bigram-grid td code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.bigram-grid tr.clickable {
  cursor: pointer;
}

.bigram-grid tr.clickable:hover .row-header {
  background-color: var(--vp-c-brand-soft);
}

.bigram-grid tr.dead-end {
  opacity: 0.4;
}

.bigram-grid tr.highlight-row {
  background-color: var(--lm-highlight-soft);
}

.row-header {
  background-color: var(--vp-c-bg-alt);
  font-weight: 600;
  position: relative;
}

.row-header.highlight-row {
  background-color: var(--vp-c-brand-soft);
}

.row-indicator {
  position: absolute;
  left: 0.25rem;
  color: var(--vp-c-brand-1);
}

.grid-cell {
  transition: background-color 0.2s;
}

.grid-cell.highlight-row {
  background-color: var(--lm-highlight-soft);
}

.grid-cell.highlight-col {
  background-color: var(--lm-highlight-medium);
}

.grid-cell.current-cell {
  background-color: var(--lm-highlight-strong);
}

.grid-cell.flash {
  animation: cell-flash 0.3s ease-out;
}

@keyframes cell-flash {
  0% {
    background-color: var(--vp-c-brand-1);
  }
  100% {
    background-color: var(--lm-highlight-strong);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grid-cell {
    transition: none;
  }

  .grid-cell.flash {
    animation: none;
  }
}
</style>
