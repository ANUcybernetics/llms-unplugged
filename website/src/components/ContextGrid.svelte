<script lang="ts">
  import { splitTokens } from "../lib/tokens";

  interface Props {
    /** Already-tokenised training text (space-separated), as the deck data uses. */
    tokens: string;
    /** Column/row-suffix labels in display order; defaults to first-seen order. */
    vocabulary?: string;
    /** How many words of context a row stands for. 1 reproduces the bigram grid. */
    order?: number;
    /** Pipe-separated contexts to band-highlight, each written as the row's
        tokens joined by spaces --- e.g. "run , |spot ,". */
    highlight?: string;
  }

  let { tokens: tokenString, vocabulary: vocabString, order = 2, highlight }: Props = $props();

  const tokenList = $derived(splitTokens(tokenString));
  const vocab = $derived(vocabString ? splitTokens(vocabString) : [...new Set(tokenList)]);

  /** Every possible context of `order` tokens, in odometer order over the
      vocabulary --- not just the ones the training text happens to contain. The
      unused rows are the point: a context-window grid has to reserve a row for
      each of them. */
  const contexts = $derived.by(() => {
    let rows: string[][] = [[]];
    for (let i = 0; i < order; i++) {
      rows = rows.flatMap((prefix) => vocab.map((token) => [...prefix, token]));
    }
    return rows;
  });

  /** counts[context key][next token] --- tallied over sliding windows of the text. */
  const counts = $derived.by(() => {
    const m = new Map<string, Map<string, number>>();
    for (let i = 0; i + order < tokenList.length; i++) {
      const key = tokenList.slice(i, i + order).join(" ");
      const next = tokenList[i + order];
      const row = m.get(key) ?? new Map<string, number>();
      row.set(next, (row.get(next) ?? 0) + 1);
      m.set(key, row);
    }
    return m;
  });

  const highlighted = $derived(
    new Set(
      (highlight ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  const tally = (n: number) => "|".repeat(n);
</script>

<table class="context-grid">
  <thead>
    <tr>
      <th scope="col" colspan={order}><span class="sr-only">Context</span></th>
      {#each vocab as col}
        <th scope="col"><code>{col}</code></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each contexts as context}
      {@const key = context.join(" ")}
      <tr class:active-row={highlighted.has(key)}>
        {#each context as token}
          <th scope="row"><code>{token}</code></th>
        {/each}
        {#each vocab as col}
          {@const count = counts.get(key)?.get(col) ?? 0}
          <td class="grid-cell">{count > 0 ? tally(count) : " "}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* Deck-only component. An order-2 grid over a 5-token vocabulary is 25 rows,
     so the row height is what sets the type size. Its slide runs headingless to
     buy back the h2's ~110px, which is what affords these rows; the pill
     styling still comes off the body-row headings, because the theme's `code`
     padding alone costs ~150px over 26 rows. It is meant to feel like too much
     grid; that is the slide's argument. */

  table.context-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
    line-height: 1.15;
  }

  table.context-grid th,
  table.context-grid td {
    padding: 0.06rem 0.25rem;
    border: 1px solid var(--color-divider);
    text-align: center;
  }

  /* Reveal strips the last row's bottom border; put it back so the grid closes. */
  table.context-grid tbody tr:last-child th,
  table.context-grid tbody tr:last-child td {
    border-bottom: 1px solid var(--color-divider);
  }

  table.context-grid td.grid-cell {
    width: 12%;
    font-weight: 700;
    color: var(--anu-gold);
  }

  /* The context columns carry the row heading, so they read as headings rather
     than data --- muted until the row is one we are pointing at. */
  table.context-grid tbody th {
    width: 5%;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  /* Pull the two context words together so a row heading reads as one pair
     rather than as two columns with a gap down the middle. */
  table.context-grid tbody th:first-child {
    text-align: end;
  }

  table.context-grid tbody th:nth-child(2) {
    text-align: start;
  }

  /* Column headings keep the theme's `code` pill (they match the bigram grid
     the audience already knows); the 25 body rows cannot afford it. */
  table.context-grid tbody th code {
    padding: 0;
    /* The theme's `code` pill is dark-on-cream; dropping the background means
       the colour has to come back with it or the text vanishes. The border goes
       too: at this row height the boxes sit ~0.3px apart, so a column of them
       fuses into one unbroken rule down the context columns. */
    background: none;
    border: none;
    color: inherit;
    font-size: 1.1em;
  }

  /* Clear of the theme's header tint, which the context columns now carry on
     every row (both axes of a matrix are headers, so both get it). At the 15%
     this used to be, the row we are pointing at was a shade off the 25 we are
     not. */
  tr.active-row td,
  tr.active-row th {
    background: color-mix(in srgb, var(--anu-gold) 32%, transparent);
  }

  tr.active-row th {
    color: var(--color-text);
  }
</style>
