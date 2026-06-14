<script lang="ts">
  import { buildBigramModel, getVocabulary, splitTokens } from "../lib/tokens";
  import { buildModelEntries } from "../lib/modelEntries";

  interface Props {
    tokens: string;
    vocabulary?: string;
    /** The current previous-word whose row we're rolling on. */
    currentWord: string;
    /** A specific d10 face (0-9) to highlight as the result; null = show the
        mapping with no roll yet. */
    rolled?: number | null;
  }

  let {
    tokens: tokenString,
    vocabulary: vocabString,
    currentWord,
    rolled = null,
  }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(vocabString ? splitTokens(vocabString) : getVocabulary(tokenList));
  const model = $derived(buildBigramModel(tokenList));
  const entries = $derived(buildModelEntries(vocab, model));
  const entry = $derived(entries.find((e) => e.previousWord === currentWord) ?? null);

  // Faces run 0..ceiling (a single d10 → 0-9). buildModelEntries spreads the
  // options proportionally across these faces (same mapping as the booklet and
  // the pre-trained deck), with the last option absorbing any rounding.
  const ceiling = $derived(entry ? Math.pow(10, entry.numDice) - 1 : 9);

  interface Band {
    word: string;
    count: number;
    from: number;
    to: number;
    faces: number[];
  }

  const bands = $derived.by<Band[]>(() => {
    if (!entry) return [];
    let lower = 0;
    return entry.nextWords.map((nw) => {
      const from = lower;
      const to = nw.threshold;
      lower = to + 1;
      const faces = Array.from({ length: to - from + 1 }, (_, i) => from + i);
      return { word: nw.word, count: nw.count, from, to, faces };
    });
  });

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
    margin: 1.5rem 0;
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
