<script lang="ts">
  import { tokenColorClass } from "../lib/tokenColors";

  interface Props {
    tokens: string;
    step: number;
  }

  let { tokens: tokenString, step }: Props = $props();

  const tokenList = $derived(tokenString.trim().split(/\s+/).filter(Boolean));
  const bigramCount = $derived(Math.max(0, tokenList.length - 1));

  // step 0          — show all tokens, no highlight
  // step 1..N       — highlight pair (step-1, step); dim tokens after step
  // step N+1        — cutouts in text order (ungrouped)
  // step N+2 onward — cutouts grouped by previous word
  const currentPairIndex = $derived(step - 1);
  const hasCurrentPair = $derived(
    currentPairIndex >= 0 && currentPairIndex < bigramCount,
  );
  const showOrdered = $derived(step === bigramCount + 1);
  const showGrouped = $derived(step >= bigramCount + 2);

  interface Bigram {
    prev: string;
    next: string;
    idx: number;
  }

  const bigrams = $derived.by<Bigram[]>(() => {
    const out: Bigram[] = [];
    for (let i = 0; i < bigramCount; i++) {
      out.push({ prev: tokenList[i], next: tokenList[i + 1], idx: i });
    }
    return out;
  });

  const spreadGroups = $derived.by<{ prev: string; cutouts: Bigram[] }[]>(
    () => {
      const groups = new Map<string, Bigram[]>();
      const order: string[] = [];
      for (const bg of bigrams) {
        if (!groups.has(bg.prev)) {
          groups.set(bg.prev, []);
          order.push(bg.prev);
        }
        groups.get(bg.prev)!.push(bg);
      }
      return order.map((prev) => ({ prev, cutouts: groups.get(prev)! }));
    },
  );
</script>

{#if showGrouped}
  <div class="cutout-spread">
    {#each spreadGroups as group (group.prev)}
      <div class="cutout-row">
        {#each group.cutouts as bg (bg.idx)}
          <span class="cutout-paper" data-id="bigram-{bg.idx}">
            <span class="cutout-paper-prev">
              <span
                class="cutout-previous-word {tokenColorClass(bg.prev)}"
                data-id="tok-{bg.idx}">{bg.prev}</span
              >
            </span>
            <span class="cutout-paper-next">
              <span
                class="cutout-next-word {tokenColorClass(bg.next)}"
                data-id="next-{bg.idx}">{bg.next}</span
              >
            </span>
          </span>
        {/each}
      </div>
    {/each}
  </div>
{:else if showOrdered}
  <div class="cutout-flow">
    {#each bigrams as bg (bg.idx)}
      <span class="cutout-paper" data-id="bigram-{bg.idx}">
        <span class="cutout-paper-prev">
          <span
            class="cutout-previous-word {tokenColorClass(bg.prev)}"
            data-id="tok-{bg.idx}">{bg.prev}</span
          >
        </span>
        <span class="cutout-paper-next">
          <span
            class="cutout-next-word {tokenColorClass(bg.next)}"
            data-id="next-{bg.idx}"
            data-auto-animate-delay="0.4">{bg.next}</span
          >
        </span>
      </span>
    {/each}
  </div>
{:else}
  <div class="overview-tokens">
    {#each tokenList as token, i (i)}
      {#if hasCurrentPair && i === currentPairIndex}
        <span class="window-indicator" data-id="window-indicator">
          <span
            class="cutout-next-word {tokenColorClass(token)}"
            data-id="tok-{i}">{token}</span
          >
          <span
            class="cutout-next-word {tokenColorClass(tokenList[i + 1])}"
            data-id="tok-{i + 1}">{tokenList[i + 1]}</span
          >
        </span>
      {:else if hasCurrentPair && i === currentPairIndex + 1}
        {""}
      {:else}
        <span
          class="cutout-next-word {tokenColorClass(token)}"
          class:dimmed={hasCurrentPair && i > currentPairIndex + 1}
          data-id="tok-{i}">{token}</span
        >
      {/if}
    {/each}
  </div>
{/if}

<style>
  .overview-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em 0.45em;
    align-items: center;
    justify-content: flex-start;
    margin: 1.5rem 0;
    font-size: 1.1em;
  }

  .overview-tokens > span {
    transition: opacity 0.2s;
  }

  .overview-tokens > span.dimmed {
    opacity: 0.25;
  }

  /* Sliding window indicator — wraps the current pair so it animates as a
     single element across slides via reveal.js auto-animate (data-id match).
     Uses outline (not border) so the highlight box doesn't perturb the
     surrounding flex layout when tokens enter/leave it. */
  .window-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.4em 0.45em;
    outline: 2px solid var(--anu-gold);
    outline-offset: 3px;
    border-radius: 4px;
  }

  .cutout-flow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em 0.5em;
    align-items: center;
    margin: 0.5rem 0;
    font-size: 0.85em;
  }
</style>
