<script lang="ts">
  import {
    entriesFromTokens,
    LEDGER_COLUMNS,
    LEDGER_PALETTE,
    type PaletteEntry,
    splitTokens,
  } from "../lib/ledger";
  import LedgerRow from "./LedgerRow.svelte";

  interface Props {
    /** The training text, space-separated and already tokenised. */
    tokens: string;
    /**
     * Which pair is being tallied: the tokens at `step` and `step + 1`. The
     * row below shows the marks the text has produced up to and including
     * this pair, with the new one in gold. -1 shows the text alone.
     */
    step?: number;
    columns?: number;
    /** The room's counter colours (the CLI's --palette). */
    palette?: readonly PaletteEntry[];
    id?: string;
  }

  let {
    tokens: tokenString,
    step = -1,
    columns = LEDGER_COLUMNS,
    palette = LEDGER_PALETTE,
    id = "tally",
  }: Props = $props();

  const tokens = $derived(splitTokens(tokenString));
  const prefix = $derived(step >= 0 ? tokens[step] : undefined);
  const follower = $derived(step >= 0 ? tokens[step + 1] : undefined);
  const entry = $derived(
    prefix === undefined
      ? undefined
      : entriesFromTokens(tokens, step + 1).find((e) => e.prefix === prefix),
  );
  const fresh = $derived(entry?.followers.findIndex((f) => f.text === follower));
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
</script>

<div class="training">
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
  {#if entry && prefix !== undefined && follower !== undefined}
    <p class="pair" data-id="{id}-pair">
      <span class="ledger-token is-prefix">{prefix}</span>
      <span class="then">then</span>
      <span class="ledger-token is-follower">{follower}</span>
      <span class="so"
        >one mark beside <strong>{follower}</strong> in the row for <strong>{prefix}</strong></span
      >
    </p>
    <LedgerRow {entry} {columns} {palette} {fresh} id="{id}-row" />
  {/if}
</div>

<style>
  .training {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8em;
    font-size: 1.25rem;
  }

  .text {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45em 0.5em;
    justify-content: center;
    padding: 0.6em 0.8em;
    font-size: 1.1em;
    max-inline-size: 100%;
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

  .so {
    margin-inline-start: 0.6em;
  }
</style>
