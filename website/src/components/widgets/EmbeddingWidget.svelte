<script lang="ts">
  import { getTrainingText, setTrainingText } from "../../lib/stores/trainingText.svelte";
  import { buildBigramModel, getVocabulary, parseTokens } from "../../lib/tokens";
  import { buildDistanceMatrix, manhattanDistance } from "../../lib/distance";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import BigramGrid from "../BigramGrid.svelte";
  import VectorComparison from "../VectorComparison.svelte";
  import DistanceMatrix from "../DistanceMatrix.svelte";

  let inputText = $derived(getTrainingText());

  let tokens = $derived(parseTokens(inputText));
  let vocabulary = $derived(getVocabulary(tokens));
  let model = $derived(buildBigramModel(tokens));
  let matrix = $derived(buildDistanceMatrix(model, vocabulary));

  let selectedRows = $state<string[]>([]);

  // Selections that no longer exist in the vocabulary (after the training
  // text changes) simply drop out — no reset effect needed, and selections
  // of words common to both texts survive.
  let validSelected = $derived(selectedRows.filter((w) => vocabulary.includes(w)));

  let numericRows = $derived(new Set(validSelected));

  let selectedPair = $derived<[string, string] | null>(
    validSelected.length === 2 ? [validSelected[0], validSelected[1]] : null,
  );

  let distance = $derived.by(() => {
    if (!selectedPair) return null;
    const [a, b] = selectedPair;
    return manhattanDistance(model, vocabulary, a, b);
  });

  function handleRowClick(word: string) {
    const current = validSelected;
    if (current.includes(word)) {
      selectedRows = current.filter((w) => w !== word);
    } else if (current.length < 2) {
      selectedRows = [...current, word];
    } else {
      selectedRows = [current[1], word];
    }
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget embedding-widget">
    <div class="widget-view">
      <div class="widget-section">
        <div class="section-header">Training text</div>
        <textarea
          id="embedding-input"
          class="text-input"
          rows="2"
          placeholder="Enter text to train on..."
          value={inputText}
          oninput={(e) => setTrainingText(e.currentTarget.value)}
        ></textarea>
      </div>

      <div class="widget-section">
        <div class="section-header">
          Bigram grid
          <span class="section-hint">click a row to see its embedding vector</span>
        </div>
        <BigramGrid
          {vocabulary}
          getCount={model.getCount}
          clickableRows={true}
          {numericRows}
          onrowclick={handleRowClick}
        />
      </div>

      <div class="widget-section">
        <div class="section-header">Output</div>
        {#if validSelected.length > 0}
          <VectorComparison {vocabulary} {model} selectedRows={validSelected} {distance} />
        {/if}
        <DistanceMatrix {vocabulary} {matrix} {selectedPair} />
      </div>
    </div>
  </div>
</FullscreenWrapper>

<style>
  .section-hint {
    font-weight: 400;
    font-style: italic;
    color: var(--at-text-muted);
    margin-left: 0.5rem;
  }
</style>
