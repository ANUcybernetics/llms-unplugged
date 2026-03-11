<script lang="ts">
  import {
    getTrainingText,
    setTrainingText,
  } from "../lib/stores/trainingText.svelte";
  import { parseTokens, getVocabulary, buildBigramModel } from "../lib/tokens";
  import { manhattanDistance, buildDistanceMatrix } from "../lib/distance";
  import FullscreenWrapper from "./FullscreenWrapper.svelte";
  import BigramGrid from "./BigramGrid.svelte";
  import VectorComparison from "./VectorComparison.svelte";
  import DistanceMatrix from "./DistanceMatrix.svelte";

  let inputText = $state(getTrainingText());

  $effect(() => {
    setTrainingText(inputText);
  });

  let tokens = $derived(parseTokens(inputText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));
  let matrix = $derived(buildDistanceMatrix(model, vocabulary));

  let selectedRows = $state<string[]>([]);

  $effect(() => {
    vocabulary;
    selectedRows = [];
  });

  let numericRows = $derived(new Set(selectedRows));

  let selectedPair = $derived<[string, string] | null>(
    selectedRows.length === 2 ? [selectedRows[0], selectedRows[1]] : null,
  );

  let distance = $derived.by(() => {
    if (!selectedPair) return null;
    const [a, b] = selectedPair;
    return manhattanDistance(model, vocabulary, a, b);
  });

  function handleRowClick(word: string) {
    const idx = selectedRows.indexOf(word);
    if (idx !== -1) {
      selectedRows = selectedRows.filter((w) => w !== word);
    } else if (selectedRows.length < 2) {
      selectedRows = [...selectedRows, word];
    } else {
      selectedRows = [selectedRows[1], word];
    }
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget embedding-widget">
    <div class="embedding-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <div class="section-content">
          <textarea
            id="embedding-input"
            class="text-input"
            rows="2"
            placeholder="Enter text to train on..."
            bind:value={inputText}
          ></textarea>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">
          Bigram grid
          <span class="section-hint"
            >click a row to see its embedding vector</span
          >
        </div>
        <div class="section-content">
          <BigramGrid
            {vocabulary}
            getCount={model.getCount}
            clickableRows={true}
            {numericRows}
            onrowclick={handleRowClick}
          />
        </div>
      </div>

      {#if selectedRows.length > 0}
        <div class="widget-section">
          <div class="section-header">Vector comparison</div>
          <div class="section-content">
            <VectorComparison {vocabulary} {model} {selectedRows} {distance} />
          </div>
        </div>
      {/if}

      <div class="widget-section">
        <div class="section-header">Distance matrix</div>
        <div class="section-content">
          <DistanceMatrix {vocabulary} {matrix} {selectedPair} />
        </div>
      </div>
    </div>
  </div>
</FullscreenWrapper>

<style>
  .embedding-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-hint {
    font-weight: 400;
    font-style: italic;
    color: var(--color-text-muted);
    margin-left: 0.5rem;
  }
</style>
