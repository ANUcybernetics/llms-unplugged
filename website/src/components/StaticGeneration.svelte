<script lang="ts">
  import { getBigrams, getVocabulary, splitTokens } from "../lib/tokens";
  import BigramCountsTable from "./BigramCountsTable.svelte";
  import GeneratedSequence from "./GeneratedSequence.svelte";

  interface Props {
    tokens: string;
    vocabulary?: string;
    sequence: string;
    step: number;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    sequence: sequenceString,
    step,
  }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(
    vocabString ? splitTokens(vocabString) : getVocabulary(tokenList),
  );
  const bigrams = $derived(getBigrams(tokenList));
  const sequenceTokens = $derived(splitTokens(sequenceString));

  const currentWord = $derived(
    step < sequenceTokens.length ? sequenceTokens[step] : null,
  );
  const chosenNext = $derived(
    step + 1 < sequenceTokens.length ? sequenceTokens[step + 1] : null,
  );
  const generatedSoFar = $derived(sequenceTokens.slice(0, step + 1));
</script>

<GeneratedSequence generated={generatedSoFar} next={chosenNext} />

<BigramCountsTable
  {vocab}
  {bigrams}
  activeRow={currentWord}
  currentCell={currentWord && chosenNext ? [currentWord, chosenNext] : null}
/>
