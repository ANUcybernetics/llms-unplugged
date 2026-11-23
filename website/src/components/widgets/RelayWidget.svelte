<script lang="ts">
  import { countsFromText, stripFrontmatter } from "../../lib/adapters";
  import { type Counts, differentWords, nextModel, slip, START, writable } from "../../lib/relay";
  import { copy } from "../../lib/rewards";
  import { parseTokens } from "../../lib/tokens";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();

  // svelte-ignore state_referenced_locally
  const base = countsFromText(text);
  // in the order the story first uses them
  // svelte-ignore state_referenced_locally
  const storyWords = [...new Set(parseTokens(stripFrontmatter(text)))];
  const tallies = (m: Counts) =>
    [...m.values()].reduce((s, row) => s + [...row.values()].reduce((a, b) => a + b, 0), 0);
  const storyTallies = tallies(base);

  let keep = $state(false);
  // the model the next round generates from
  let model = $state.raw<Counts>(copy(base));
  let rounds = $state<{ text: string[]; count: number }[]>([]);

  function reset() {
    model = copy(base);
    rounds = [];
  }

  function run(n: number) {
    let m = model;
    for (let i = 0; i < n; i++) {
      const words = slip(m, Math.random);
      rounds.push({ text: words, count: differentWords(words) });
      m = nextModel(m, words, keep);
    }
    model = m;
  }

  let latest = $derived(rounds.at(-1));
  let onSlip = $derived(new Set(latest?.text));
  // every slip starts with `.`, whether or not a row leads to it
  let can = $derived(new Set([START, ...writable(model)]));
</script>

<FullscreenWrapper>
  <div class="lm-widget relay-widget">
    <div class="widget-view">
      <div class="controls">
        <div class="mode" role="group" aria-label="What the next round trains on">
          <button
            type="button"
            aria-pressed={!keep}
            onclick={() => {
              keep = false;
              reset();
            }}>Pass on the slip only</button
          >
          <button
            type="button"
            aria-pressed={keep}
            onclick={() => {
              keep = true;
              reset();
            }}>Keep the story</button
          >
        </div>
        <button type="button" onclick={reset} disabled={rounds.length === 0}>Start again</button>
      </div>

      <p class="rule">
        {#if keep}
          <strong>Keep the story:</strong> each slip is tallied onto the same sheet as the story, and
          the next round generates from all of it.
        {:else}
          <strong>Pass on the slip only:</strong> each round trains a fresh model on the last slip and
          nothing else.
        {/if}
      </p>

      <div class="widget-section">
        <div class="section-header">
          {latest ? `Round ${rounds.length}` : "The relay"}
        </div>
        {#if latest}
          <p class="slip">{latest.text.join(" ")}</p>
          <p class="readout">
            <strong>{latest.count}</strong> different {latest.count === 1 ? "word" : "words"} on this
            slip.
          </p>
        {:else}
          <p class="readout">
            Round 1 writes a twenty-word slip from the story's model, which can write {storyWords.length}
            different words.
          </p>
        {/if}
        <div class="actions">
          <button type="button" onclick={() => run(1)}>Next round</button>
          <button type="button" onclick={() => run(10)}>Run ten rounds</button>
        </div>
      </div>

      <div class="widget-section">
        <div class="section-header">The story's words</div>
        <ul class="words">
          {#each storyWords as w}
            <li class:on-slip={onSlip.has(w)}>
              {#if can.has(w)}{w}{:else}<s>{w}</s>{/if}
            </li>
          {/each}
        </ul>
        <p class="readout">
          {#if rounds.length === 0}
            Every word is still in play.
          {:else if keep}
            The next round's model can still write all {can.size} words; the highlighted ones are on the
            latest slip. The story is {Math.round((100 * storyTallies) / tallies(model))}% of the
            sheet's tallies.
          {:else}
            The next round's model can write {can.size} of the story's {storyWords.length} words: the
            highlighted ones. The crossed-out words are gone from this chain for good.
          {/if}
        </p>
      </div>

      {#if rounds.length > 0}
        <div class="widget-section">
          <div class="section-header">Rounds so far</div>
          <ol class="history">
            {#each rounds as round, i}
              <li>
                <span class="round-no">{i + 1}</span>
                <span class="bar" aria-hidden="true">
                  <span style:width="{(100 * round.count) / storyWords.length}%"></span>
                </span>
                <span class="count"
                  >{round.count}<span class="sr-only"> different words:</span></span
                >
                <span class="text">{round.text.join(" ")}</span>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </div>
  </div>
</FullscreenWrapper>

<style>
  .controls {
    /* clear of FullscreenWrapper's button in the top corner */
    padding-right: 2.75rem;
  }

  .controls,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .mode {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  button {
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-bg-alt);
    color: var(--color-text);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    touch-action: manipulation;
  }

  @media (pointer: coarse) {
    button {
      min-width: 2.75rem;
      min-height: 2.75rem;
    }
  }

  button:hover:not(:disabled) {
    border-color: var(--color-brand);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  button[aria-pressed="true"] {
    background: var(--color-brand);
    border-color: var(--color-brand);
    color: #000;
    font-weight: 600;
  }

  .rule,
  .readout {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .slip {
    margin: 0.25rem 0;
    font-family: var(--font-mono);
    font-size: 1.125rem;
    line-height: 1.5;
  }

  .actions {
    margin-top: 0.5rem;
  }

  .words {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0.25rem 0;
    padding: 0;
    list-style: none;
  }

  .words li {
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .words li.on-slip {
    background: var(--color-brand);
    border-color: var(--color-brand);
    color: #000;
    font-weight: 600;
  }

  .words s {
    color: var(--color-text-muted);
  }

  .words li:has(s) {
    border-style: dashed;
  }

  .history {
    display: grid;
    grid-template-columns: auto 6rem auto minmax(0, 1fr);
    gap: 0.2rem 0.5rem;
    align-items: center;
    margin: 0.25rem 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8125rem;
  }

  .history li {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: center;
  }

  .round-no,
  .count {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .round-no {
    color: var(--color-text-muted);
  }

  .count {
    font-weight: 600;
  }

  .bar {
    height: 0.8rem;
    border-radius: 0.15rem;
    background: var(--color-bg-alt);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--color-brand);
  }

  .text {
    overflow: hidden;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
