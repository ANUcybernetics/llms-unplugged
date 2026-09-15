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
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
</script>

<div class="training">
  <div class="reading">
    <div class="text paper-ground" data-id="{id}-text">
      {#each tokens as t, i (i)}
        <span
          class="tok ledger-token"
          class:is-prefix={i === step}
          class:is-follower={i === step + 1}
          class:is-ahead={i > step + 1}
          data-id="{id}-t{i}"
          >{#if PUNCT.has(t)}<span class="ledger-punct">{t}</span>{:else}{t}{/if}</span
        >
      {/each}
    </div>
    {#if prefix !== undefined && follower !== undefined}
      <p class="pair" data-id="{id}-pair">
        <span class="ledger-token is-prefix">{prefix}</span>
        <span class="then">then</span>
        <span class="ledger-token is-follower">{follower}</span>
      </p>
      <p class="so">
        one mark beside <strong>{follower}</strong> in the row for <strong>{prefix}</strong>
      </p>
    {/if}
  </div>
  <LedgerSheet
    {entries}
    {columns}
    {palette}
    range={null}
    rows={sheetRows}
    focus={prefix}
    {fresh}
    id="{id}-sheet"
  />
</div>

<style>
  /* The text page beside the sheet, not above it: a sheet with a row for
     every word of the text is the tall thing here, and it gets the slide's
     whole height. */
  .training {
    display: grid;
    grid-template-columns: 21rem auto;
    justify-content: center;
    align-items: start;
    gap: 1rem;
    font-size: 1.25rem;

    /* A sheet filling in wants compact rows (no count here passes five) and
       a gentle fade, since the rows already filled are part of the point. */
    --sheet-size: 1rem;
    --row-height: 2em;
    --sheet-dim: 0.45;
  }

  .reading {
    display: flex;
    flex-direction: column;
    gap: 0.6em;
  }

  .text {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35em 0.4em;
    padding: 0.6em 0.8em;
    font-size: 1em;
  }

  .tok {
    padding: 0.05em 0.25em;
    border-radius: 4px;
    border: 2px solid transparent;
    transition: all 0.3s;
  }

  .tok.is-ahead {
    color: rgb(0 0 0 / 35%);
  }

  .is-prefix {
    border-color: var(--anu-gold);
  }

  .is-follower {
    background: var(--anu-gold);
    color: #fff;
  }

  .pair {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    font-size: 0.95em;
  }

  .so {
    margin: 0;
    font-size: 0.85em;
    line-height: 1.3;
  }

  .pair .ledger-token {
    padding: 0.05em 0.35em;
    border-radius: 4px;
    border: 2px solid transparent;
    background: var(--paper-ground);
  }

  .pair .is-follower {
    background: var(--anu-gold);
    color: #fff;
  }

  .then,
  .so {
    color: var(--color-text-secondary);
  }
</style>
