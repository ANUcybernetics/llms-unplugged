<script lang="ts">
  import { buildBigramModel, getVocabulary, splitTokens } from "../lib/tokens";
  import { computeDiceBands, getRowOptionsInVocabOrder } from "../lib/diceBands";

  interface Props {
    tokens: string;
    vocabulary?: string;
    /** The generation walk (same value as StaticGeneration's `sequence`). */
    sequence: string;
    /** Space-separated d10 roll per step, "-" for no-roll steps (same value
        as StaticGeneration's `rolls`). */
    rolls: string;
    /** The walk step whose row we're rolling on; the roll for this step comes
        from `rolls`, so the strip can never contradict the walk. */
    step: number;
    /** false = show the face mapping with no roll yet; true = highlight the
        rolled face and reveal the result. */
    showRoll?: boolean;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    sequence: sequenceString,
    rolls: rollsString,
    step,
    showRoll = false,
  }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(vocabString ? splitTokens(vocabString) : getVocabulary(tokenList));
  const model = $derived(buildBigramModel(tokenList));

  const currentWord = $derived(splitTokens(sequenceString)[step]);
  const rollToken = $derived(splitTokens(rollsString)[step]);
  const rolled = $derived(showRoll && rollToken !== "-" ? Number(rollToken) : null);

  // Bands in grid (vocab) column order: the strip explains the grid row the
  // audience has just seen, so the leftmost band must belong to the row's
  // leftmost non-empty cell. (buildModelEntries sorts by count for the
  // booklet-style widgets --- that ordering reads as jumbled here.)
  const bands = $derived(
    computeDiceBands(getRowOptionsInVocabOrder(vocab, model.getCount, currentWord)).map((b) => ({
      ...b,
      faces: Array.from({ length: b.to - b.from + 1 }, (_, i) => b.from + i),
    })),
  );

  // Tallies equal → equal share of faces; tallies differ → weighted.
  const weighted = $derived(new Set(bands.map((b) => b.count)).size > 1);
</script>

<div class="dice-strip" aria-label={`d10 mapping for the row after ${currentWord}`}>
  <p class="strip-caption"><code>{currentWord}</code> → ? &nbsp;<span>roll a d10</span></p>
  <div class="bands">
    {#each bands as band, i}
      <div class="band" data-band-index={i % 2}>
        <div class="band-faces">
          {#each band.faces as face}
            <span class="face" class:rolled={rolled === face}>{face}</span>
          {/each}
        </div>
        <div class="band-label">
          <code>{band.word}</code>
          <span class="band-count">{band.count} {band.count === 1 ? "tally" : "tallies"}</span>
        </div>
      </div>
    {/each}
  </div>
  {#if bands.length > 0}
    <p class="strip-hint">
      {weighted ? "more tallies → more faces → more likely" : "equal tallies → equal chances"}
    </p>
  {/if}
  {#if rolled !== null && bands.length > 0}
    {@const winner = bands.find((b) => rolled >= b.from && rolled <= b.to)}
    <p class="strip-result">rolled <strong>{rolled}</strong> → <code>{winner?.word}</code></p>
  {/if}
</div>

<style>
  /* Deck-only component, tuned for the 1280×720 / 16px-root reveal canvas. */

  .dice-strip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .strip-caption {
    margin: 0;
    font-size: 1.6rem;
  }

  .strip-caption span {
    color: var(--at-text-secondary);
    font-size: 1.1rem;
  }

  .bands {
    display: flex;
    gap: 0.6rem;
  }

  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .band-faces {
    display: flex;
  }

  /* Two gold-family tints so the bands read as distinct blocks; the relative
     widths (number of faces) carry the "more likely" message. */
  .band[data-band-index="0"] .face {
    background: color-mix(in srgb, var(--anu-gold) 30%, transparent);
  }

  .band[data-band-index="1"] .face {
    background: color-mix(in srgb, var(--anu-gold) 13%, transparent);
  }

  .face {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border: 1px solid var(--color-divider);
    font-size: 1.4rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* Scoped under `.band` so this beats the band-tint background rules, which
     are otherwise equally specific. */
  .band .face.rolled {
    background: var(--anu-gold);
    color: #000;
    outline: 3px solid var(--anu-gold);
    outline-offset: 2px;
  }

  .band-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    font-size: 1.4rem;
  }

  .band-count {
    font-size: 1rem;
    color: var(--at-text-secondary);
  }

  .strip-result {
    margin: 0;
    font-size: 1.5rem;
  }

  .strip-result strong {
    color: var(--anu-gold);
  }

  .strip-result code {
    padding: 0 0.2em;
  }

  .strip-hint {
    color: var(--at-text-secondary);
    font-size: 1.3rem;
  }
</style>
