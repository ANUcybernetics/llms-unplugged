<script lang="ts">
  import {
    entriesFromTokens,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type PaletteEntry,
    splitTokens,
  } from "../lib/ledger";
  import LedgerSheet from "./LedgerSheet.svelte";

  interface Props {
    /** The training text, space-separated and already tokenised. */
    tokens: string;
    /**
     * The same text as the book writes it. Given, the line shows this
     * instead of the tokens, over an empty sheet: the frame before the
     * tokeniser reads it. Each word carries its first token's data-id, so the
     * next frame's tokens grow out of the words they came from.
     */
    source?: string;
    /**
     * Which pair is being tallied: the tokens at `step` and `step + 1`. The
     * sheet below shows the marks the text has produced up to and including
     * this pair, with the new one in gold. -1 shows the text over a blank
     * sheet.
     */
    step?: number;
    columns?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    /**
     * Rows printed on the sheet. Defaults to the rows the whole text ends
     * up needing, so the sheet is the same size at every step and rows fill
     * in from the top rather than the sheet growing.
     */
    rows?: number;
    id?: string;
  }

  let {
    tokens: tokenString,
    source,
    step = -1,
    columns = LEDGER_COLUMNS,
    palette = LEDGER_PALETTE,
    rows,
    id = "tally",
  }: Props = $props();

  const tokens = $derived(splitTokens(tokenString));
  const prefix = $derived(step >= 0 ? tokens[step] : undefined);
  const follower = $derived(step >= 0 ? tokens[step + 1] : undefined);
  const entries = $derived(entriesFromTokens(tokens, step + 1));
  const entry = $derived(entries.find((e) => e.prefix === prefix));
  const fresh = $derived(entry?.followers.findIndex((f) => f.text === follower));
  const sheetRows = $derived(rows ?? entriesFromTokens(tokens).length);
  // Auto-animate scales a matched element from its old box to its new one,
  // which stretches everything inside it. A sheet that grows a row between
  // steps is a different sheet as far as the matching goes (the row count is
  // in its id), so it swaps rather than stretches; same-sized steps still
  // match. The root has no data-id for the same reason.
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
  // A written word makes one token, plus one per punctuation mark trailing
  // it ("spring." is "spring" and "."); its data-id is the first of them.
  const written = $derived.by(() => {
    let next = 0;
    return (source ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const at = next;
        let trailing = 0;
        while (trailing < word.length - 1 && PUNCT.has(word[word.length - 1 - trailing])) {
          trailing++;
        }
        next += 1 + trailing;
        return { word, at };
      });
  });
</script>

<div class="training" data-training={id}>
  <div class="reading">
    <div class="text" data-id="{id}-text">
      {#if source !== undefined}
        {#each written as w (w.at)}
          <span class="tok ledger-token" data-id="{id}-t{w.at}">{w.word}</span>
        {/each}
      {:else}
        {#each tokens as t, i (i)}
          <span
            class="tok ledger-token"
            class:is-prefix={i === step}
            class:is-follower={step >= 0 && i === step + 1}
            class:is-ahead={step >= 0 && i > step + 1}
            data-id="{id}-t{i}"
            >{#if PUNCT.has(t)}<span class="ledger-punct">{t}</span>{:else}{t}{/if}</span
          >
        {/each}
      {/if}
    </div>
  </div>
  <LedgerSheet
    {entries}
    {columns}
    {palette}
    range={null}
    rows={sheetRows}
    focus={prefix}
    {fresh}
    id="{id}-sheet-{sheetRows}"
  />
</div>

<style>
  /* The text page beside the sheet, not above it: a sheet with a row for
     every word of the text is the tall thing here, and it gets the slide's
     whole height. */
  .training {
    display: grid;
    grid-template-columns: 18rem auto;
    justify-content: center;
    align-items: start;
    gap: 1rem;
    font-size: 1.25rem;

    /* A sheet filling in wants compact cells (no count here passes two, and
       no word is long) and a gentle fade, since the rows already filled are
       part of the point. */
    --sheet-size: 1.3rem;
    --row-height: 2.2em;
    --stub: 5em;
    --cell: 4.6em;
    --strip: 3.4em;
    --sheet-dim: 0.45;
  }

  .reading {
    display: flex;
    flex-direction: column;
    gap: 0.6em;
  }

  /* The text being read is slide text, not paper: it is the book, and the
     sheet is the thing being made from it. */
  .text {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35em 0.4em;
    font-size: 1em;
    color: var(--color-text);
  }

  /* In the slide's ink, not .ledger-token's paper ink. */
  .tok {
    color: var(--color-text);
    padding: 0.05em 0.25em;
    border: 2px solid transparent;
    transition:
      color 0.3s,
      border-color 0.3s,
      background-color 0.3s;
  }

  .tok.is-ahead {
    color: var(--color-text-muted);
  }

  .is-prefix {
    border-color: var(--anu-gold);
  }

  .is-follower {
    background: var(--anu-gold);
    color: #000;
  }

  @media (prefers-reduced-motion: reduce) {
    .tok {
      transition: none;
    }
  }
</style>
