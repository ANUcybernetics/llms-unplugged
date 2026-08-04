<script lang="ts">
  import { isPunctuation, splitTokens } from "../lib/tokens";

  interface Context {
    /** Words the model can see before the row token, space-separated. */
    before: string;
    /** Next-token weight per vocabulary entry, in grid column order. Any scale
        will do --- the bars are normalised against the largest weight. */
    weights: number[];
  }

  interface Props {
    /** Column labels in grid order. */
    vocabulary: string;
    /** The token whose row is being re-weighted. */
    token: string;
    /** The same row as it would look under each preceding context. */
    contexts: Context[];
  }

  let { vocabulary, token, contexts }: Props = $props();

  const vocab = $derived(splitTokens(vocabulary));
  const peak = $derived(Math.max(1, ...contexts.flatMap((c) => c.weights)));
</script>

<div class="attention-row">
  <table>
    <thead>
      <tr>
        <th scope="col"><span class="sr-only">Context</span></th>
        {#each vocab as col}
          <th scope="col"><code class:punctuation={isPunctuation(col)}>{col}</code></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each contexts as context}
        <tr>
          <th scope="row">
            <span class="before">
              {#each splitTokens(context.before) as word}
                <code class="dim" class:punctuation={isPunctuation(word)}>{word}</code>
              {/each}
              <code class="row-token">{token}</code>
            </span>
          </th>
          {#each vocab as _, i}
            {@const weight = context.weights[i] ?? 0}
            <td>
              <span class="bar" style="--fill: {Math.round((weight / peak) * 100)}%"></span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* Deck-only component, tuned for the 1280x720 canvas. Deliberately shaped
     like BigramCountsTable --- same borders, same column order --- because the
     whole point is that this IS the grid row, redrawn once per context. */

  .attention-row table {
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: 1.5rem;
  }

  .attention-row th,
  .attention-row td {
    padding: 0.4rem;
    border: 1px solid var(--color-divider);
    text-align: center;
  }

  .attention-row tbody tr:last-child th,
  .attention-row tbody tr:last-child td {
    border-bottom: 1px solid var(--color-divider);
  }

  .attention-row tbody th {
    text-align: end;
    white-space: nowrap;
  }

  .before {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
  }

  .before code.dim {
    opacity: 0.45;
  }

  .before code.row-token {
    outline: 2px solid var(--anu-gold);
    outline-offset: 2px;
  }

  /* Bars run bottom-up inside a fixed-height cell so the two rows stay aligned
     and the shape difference between contexts is the only thing that moves. A
     zero-weight column keeps its empty track rather than going blank, so it
     reads as "no chance" rather than as a cell that failed to render. */
  .bar {
    display: block;
    width: 100%;
    height: 3.2rem;
    background: linear-gradient(
      to top,
      var(--anu-gold) 0 var(--fill),
      var(--lm-highlight-soft) var(--fill) 100%
    );
    border-radius: 2px;
  }
</style>
