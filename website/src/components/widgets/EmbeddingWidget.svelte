<script lang="ts">
  import { getTrainingText, setTrainingText } from "../../lib/stores/trainingText.svelte";
  import { getCjkMode, setCjkMode } from "../../lib/stores/cjkMode.svelte";
  import { buildBigramModel, containsCJK, getVocabulary, parseTokens } from "../../lib/tokens";
  import { tokenizeWords } from "../../lib/cjkTokenize";
  import { buildDistanceMatrix, manhattanDistance } from "../../lib/distance";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";
  import BigramGrid from "../BigramGrid.svelte";
  import VectorComparison from "../VectorComparison.svelte";
  import DistanceMatrix from "../DistanceMatrix.svelte";

  let inputText = $derived(getTrainingText());
  let cjkMode = $derived(getCjkMode());
  let showCjkToggle = $derived(containsCJK(inputText));

  // Word-level Chinese loads the jieba wasm on demand, so tokens are $state set
  // by an effect; English (and char mode) stays synchronous. Effects don't run
  // during SSR, so the server render only ever uses the synchronous path.
  let tokens = $state<string[]>(parseTokens(getTrainingText()));
  $effect(() => {
    const text = inputText;
    if (cjkMode === "word" && containsCJK(text)) {
      let cancelled = false;
      tokenizeWords(text).then((result) => {
        if (!cancelled) tokens = result;
      });
      return () => {
        cancelled = true;
      };
    }
    tokens = parseTokens(text);
  });

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
        <div class="section-header">
          Training text
          {#if showCjkToggle}
            <span class="cjk-toggle" role="group" aria-label="Chinese segmentation">
              <button
                type="button"
                class:active={cjkMode === "word"}
                onclick={() => setCjkMode("word")}>words</button>
              <button
                type="button"
                class:active={cjkMode === "char"}
                onclick={() => setCjkMode("char")}>characters</button>
            </span>
          {/if}
        </div>
        <textarea
          id="embedding-input"
          class="text-input"
          rows="2"
          aria-label="Training text"
          placeholder="Enter text to train on..."
          value={inputText}
          oninput={(e) => setTrainingText(e.currentTarget.value)}></textarea>
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
