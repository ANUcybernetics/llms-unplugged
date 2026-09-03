<script lang="ts">
  interface Group {
    /** What the room calls the group. */
    name: string;
    /** The group's ball colour: a ledger palette name (red, blue, ...). */
    colour: string;
    /** How many marks the group's row for the prefix carries: balls it throws in. */
    count: number;
  }

  interface Props {
    /** The prefix the class is on. */
    prefix: string;
    groups: Group[];
    /** Index of the group whose ball came out; omit before the draw. */
    drawn?: number;
    /** Show the bucket before anyone has thrown. */
    empty?: boolean;
    id?: string;
  }

  let { prefix, groups, drawn, empty = false, id = "bucket" }: Props = $props();

  // Every group's balls, in group order, packed into rows from the bottom
  // of the bucket up. The drawn ball is the first of its group's.
  const balls = $derived(
    groups.flatMap((g, gi) =>
      Array.from({ length: g.count }, (_, k) => ({ group: gi, colour: g.colour, k })),
    ),
  );
  const drawnIndex = $derived(drawn === undefined ? -1 : balls.findIndex((b) => b.group === drawn));
  const PER_ROW = 9;
  const R = 11;
  const pile = $derived(
    balls
      .map((b, i) => ({ ...b, i }))
      .filter((b) => b.i !== drawnIndex)
      .map((b, k) => {
        const row = Math.floor(k / PER_ROW);
        const col = k % PER_ROW;
        const total = balls.length - (drawnIndex >= 0 ? 1 : 0);
        const inRow = Math.min(PER_ROW, total - row * PER_ROW);
        return { ...b, x: 210 + (col - (inRow - 1) / 2) * 25, y: 214 - row * 24 };
      }),
  );
</script>

<div class="bucket" data-id={id}>
  <ul class="groups" aria-label="what each group throws in for {prefix}">
    {#each groups as g, gi (gi)}
      <li class:drawn={drawn === gi} data-id="{id}-g{gi}">
        <span class="ledger-counter" style="--c: var(--ledger-{g.colour})"></span>
        <span class="gname">{g.name}</span>
        <span class="gcount">{g.count === 0 ? "no row" : `× ${g.count}`}</span>
      </li>
    {/each}
  </ul>
  <svg viewBox="0 0 420 250" role="img" aria-label="the class bucket">
    <path class="pail" d="M 80 78 L 108 236 Q 210 250 312 236 L 340 78 Z" />
    <ellipse class="rim" cx="210" cy="78" rx="130" ry="14" />
    {#if !empty}
      {#each pile as b (b.i)}
        <circle
          cx={b.x}
          cy={b.y}
          r={R}
          class="ball"
          style="--c: var(--ledger-{b.colour})"
          data-id="{id}-b{b.i}"
        />
      {/each}
    {/if}
    {#if drawnIndex >= 0}
      <circle
        cx="210"
        cy="30"
        r={R + 4}
        class="ball drawn"
        style="--c: var(--ledger-{balls[drawnIndex].colour})"
        data-id="{id}-b{drawnIndex}"
      />
    {/if}
  </svg>
  <p class="verdict" data-id="{id}-verdict">
    {#if drawn !== undefined}
      <strong>{groups[drawn].name}</strong> draws from their own bag
    {:else if empty}
      the word is <strong class="ledger-token">{prefix}</strong>: who has a row for it?
    {:else}
      {balls.length} balls in, one comes out
    {/if}
  </p>
</div>

<style>
  .bucket {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3em;
    font-size: 1.3rem;
  }

  .groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4em 1.4em;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.9em;
  }

  .groups li {
    display: flex;
    align-items: center;
    gap: 0.35em;
    padding: 0.1em 0.5em;
    border-radius: 999px;
    border: 2px solid transparent;
  }

  .groups li.drawn {
    border-color: var(--anu-gold);
  }

  .gcount {
    color: var(--color-text-muted);
  }

  svg {
    inline-size: 20em;
    block-size: 12em;
  }

  .pail {
    fill: #e9dfc9;
    stroke: #3a3020;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .rim {
    fill: #d6c9ad;
    stroke: #3a3020;
    stroke-width: 2;
  }

  .ball {
    fill: var(--c);
    stroke: rgb(0 0 0 / 60%);
    stroke-width: 1;
  }

  .ball.drawn {
    stroke: var(--anu-gold);
    stroke-width: 3;
  }

  .verdict {
    margin: 0;
    font-size: 0.95em;
    color: var(--color-text-secondary);
  }

  .verdict .ledger-token {
    color: var(--anu-gold);
  }
</style>
