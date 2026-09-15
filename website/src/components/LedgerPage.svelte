<script lang="ts">
  // The story so far, as a group writes it down during generation: the
  // tokens in a line, the last one gold when it has just been drawn. Plain
  // slide text, not paper: the story is what the group writes, not a part
  // of the ledger, and it should not look like one.
  interface Props {
    /** Space-separated tokens written so far. */
    text: string;
    /** Light the last token: it is the word just drawn. */
    fresh?: boolean;
    /** What to call the line. */
    label?: string;
    id?: string;
  }

  let { text, fresh = false, label = "your story", id = "ledger-page" }: Props = $props();
  const tokens = $derived(text.trim().split(/\s+/).filter(Boolean));
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
</script>

<div class="page" data-id={id}>
  <span class="label" data-id="{id}-label">{label}</span>
  <span class="words">
    {#each tokens as t, i (i)}
      <span
        class="tok"
        class:fresh={fresh && i === tokens.length - 1}
        class:last={i === tokens.length - 1}
        data-id="{id}-{i}"
        >{#if PUNCT.has(t)}<span class="ledger-punct">{t}</span>{:else}{t}{/if}</span
      >
    {/each}
    {#if tokens.length === 0}
      <span class="tok" aria-hidden="true">&#8203;</span>
    {/if}
  </span>
</div>

<style>
  /* The full slide width, not a box that grows with the story: a
     content-sized line re-centres every time a word is added, which slides
     every word already written and reads as the new word landing in the
     middle rather than at the end. */
  .page {
    display: flex;
    align-items: baseline;
    gap: 0.8em;
    inline-size: 100%;
    min-block-size: 1.5em;
    font-size: 1.5rem;
  }

  .label {
    font-size: 0.65em;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .words {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em 0.5em;
    font-style: italic;
  }

  .tok {
    white-space: nowrap;
  }

  .last {
    outline: 2px solid var(--anu-gold);
    outline-offset: 3px;
    border-radius: 3px;
  }

  .fresh {
    color: var(--anu-gold);
  }
</style>
