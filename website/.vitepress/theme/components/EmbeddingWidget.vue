<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useTrainingText } from "../composables/useTrainingText";
import {
  parseTokens,
  getVocabulary,
  buildBigramModel,
} from "../utils/tokens";
import { manhattanDistance, buildDistanceMatrix } from "../utils/distance";
import FullscreenWrapper from "./FullscreenWrapper.vue";
import BigramGrid from "./BigramGrid.vue";
import VectorComparison from "./VectorComparison.vue";
import DistanceMatrix from "./DistanceMatrix.vue";

const inputText = useTrainingText();

const tokens = computed(() => parseTokens(inputText.value));
const vocabulary = computed(() => getVocabulary(tokens.value));
const model = computed(() => buildBigramModel(tokens.value));
const matrix = computed(() =>
  buildDistanceMatrix(model.value, vocabulary.value),
);

const selectedRows = ref<string[]>([]);

watch(vocabulary, () => {
  selectedRows.value = [];
});

const numericRows = computed(() => new Set(selectedRows.value));

const selectedPair = computed<[string, string] | null>(() =>
  selectedRows.value.length === 2
    ? [selectedRows.value[0], selectedRows.value[1]]
    : null,
);

const distance = computed(() => {
  if (!selectedPair.value) return null;
  const [a, b] = selectedPair.value;
  return manhattanDistance(model.value, vocabulary.value, a, b);
});

function handleRowClick(word: string) {
  const idx = selectedRows.value.indexOf(word);
  if (idx !== -1) {
    selectedRows.value = selectedRows.value.filter((w) => w !== word);
  } else if (selectedRows.value.length < 2) {
    selectedRows.value = [...selectedRows.value, word];
  } else {
    selectedRows.value = [selectedRows.value[1], word];
  }
}
</script>

<template>
  <FullscreenWrapper>
    <div class="lm-widget embedding-widget">
      <div class="embedding-view">
        <div class="widget-section">
          <div class="section-header">Training text</div>
          <div class="section-content">
            <textarea
              id="embedding-input"
              v-model="inputText"
              class="text-input"
              rows="2"
              placeholder="Enter text to train on..."
            ></textarea>
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">
            Bigram grid
            <span class="section-hint">click a row to see its embedding vector</span>
          </div>
          <div class="section-content">
            <BigramGrid
              :vocabulary="vocabulary"
              :get-count="model.getCount"
              :clickable-rows="true"
              :numeric-rows="numericRows"
              @row-click="handleRowClick"
            />
          </div>
        </div>

        <div v-if="selectedRows.length > 0" class="widget-section">
          <div class="section-header">Vector comparison</div>
          <div class="section-content">
            <VectorComparison
              :vocabulary="vocabulary"
              :model="model"
              :selected-rows="selectedRows"
              :distance="distance"
            />
          </div>
        </div>

        <div class="widget-section">
          <div class="section-header">Distance matrix</div>
          <div class="section-content">
            <DistanceMatrix
              :vocabulary="vocabulary"
              :matrix="matrix"
              :selected-pair="selectedPair"
            />
          </div>
        </div>
      </div>
    </div>
  </FullscreenWrapper>
</template>

<style scoped>
@import "../styles/widget-base.css";

.embedding-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-hint {
  font-weight: 400;
  font-style: italic;
  color: var(--vp-c-text-3);
  margin-left: 0.5rem;
}
</style>
