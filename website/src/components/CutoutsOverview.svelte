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
              <span class="cutout-previous-word {tokenColorClass(bg.prev)}"
                >{bg.prev}</span
              >
            </span>
            <span class="cutout-paper-next">
              <span class="cutout-next-word {tokenColorClass(bg.next)}"
                >{bg.next}</span
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
          <span class="cutout-previous-word {tokenColorClass(bg.prev)}"
            >{bg.prev}</span
          >
        </span>
        <span class="cutout-paper-next">
          <span class="cutout-next-word {tokenColorClass(bg.next)}"
            >{bg.next}</span
          >
        </span>
      </span>
    {/each}
  </div>
{:else}
  <div class="overview-tokens">
    {#each tokenList as token, i (i)}
      <span
        class="cutout-previous-word {tokenColorClass(token)}"
        class:highlight={hasCurrentPair &&
          (i === currentPairIndex || i === currentPairIndex + 1)}
        class:dimmed={hasCurrentPair && i > currentPairIndex + 1}>{token}</span
      >
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

  .overview-tokens > span.highlight {
    outline: 2px solid var(--anu-gold);
    outline-offset: 3px;
  }

  .overview-tokens > span.dimmed {
    opacity: 0.25;
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
