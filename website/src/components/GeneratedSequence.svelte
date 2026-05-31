<script lang="ts">
  interface Props {
    /** Tokens generated so far; the final one is ringed as the latest pick. */
    generated: string[];
    /** Proposed next token, shown ghosted with a dashed ring. */
    next?: string | null;
    /** Match the surrounding deck typography (pretrained view uses serif). */
    font?: "mono" | "serif";
  }

  let { generated, next = null, font = "mono" }: Props = $props();
</script>

<div class="generation-output" class:serif={font === "serif"}>
  {#each generated as token, i}
    <code class:latest={i === generated.length - 1}>{token}</code>
  {/each}
  {#if next}
    <code class="next">{next}</code>
  {/if}
</div>

<style>
  /* Deck-only component, tuned for the 1280×720 / 16px-root reveal canvas. */

  .generation-output {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    margin: 0.5rem 0 1.5rem;
    font-size: 1.6rem;
  }

  .generation-output.serif {
    font-family: var(--font-libertinus-serif), serif;
  }

  .generation-output.serif code {
    font-family: inherit;
  }

  .generation-output code.latest {
    outline: 2px solid var(--anu-gold);
    outline-offset: 2px;
  }

  .generation-output code.next {
    outline: 2px dashed var(--anu-gold);
    outline-offset: 2px;
    opacity: 0.6;
  }
</style>
