<script lang="ts">
  import {
    CANDIDATES,
    copy,
    type Counts,
    finished,
    get,
    type Leash,
    panelUpdate,
    passes,
    pick,
    rowTotal,
    ruleUpdate,
    type Sentence,
    sentence,
  } from "../../lib/rewards";
  import { countsFromText } from "../../lib/adapters";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();

  // svelte-ignore state_referenced_locally
  const base = countsFromText(text);

  let mode = $state<"rule" | "panel">("rule");
  let leash = $state<Leash>("on");
  let model = $state.raw<Counts>(copy(base));
  let round = $state(1);
  let candidates = $state<Sentence[]>([]);
  let best = $state<number | null>(null);
  let worst = $state<number | null>(null);
  let history = $state<{ round: number; note: string }[]>([]);
  let check = $state<{ round: number; rate: number } | null>(null);

  function reset() {
    model = copy(base);
    round = 1;
    candidates = [];
    best = worst = null;
    history = [];
    check = null;
  }

  function generate() {
    candidates = Array.from({ length: CANDIDATES }, () => sentence(model, Math.random));
    best = worst = null;
  }

  let canUpdate = $derived(
    candidates.length > 0 &&
      (mode === "rule" || (best !== null && worst !== null && best !== worst)),
  );

  function applyUpdate() {
    if (!canUpdate) return;
    const m = copy(model);
    if (mode === "rule") {
      ruleUpdate(m, base, candidates, leash);
      history.push({ round, note: `${candidates.filter(passes).length} of ${CANDIDATES} passed` });
    } else {
      panelUpdate(m, base, candidates[best!], candidates[worst!]);
      history.push({ round, note: `best: ${show(candidates[best!])}` });
    }
    model = m;
    round++;
    candidates = [];
    best = worst = null;
  }

  function fastForward(rounds: number) {
    const m = copy(model);
    for (let i = 0; i < rounds; i++) {
      const batch = Array.from({ length: CANDIDATES }, () => sentence(m, Math.random));
      history.push({ round, note: `${batch.filter(passes).length} of ${CANDIDATES} passed` });
      ruleUpdate(m, base, batch, leash);
      round++;
    }
    model = m;
    candidates = [];
  }

  // How often the model as it stands passes the rule card, over many sentences.
  const passRate = (m: Counts, n = 400) =>
    Array.from({ length: n }, () => sentence(m, Math.random)).filter(passes).length / n;
  const startRate = passRate(base, 2000);

  function show(s: Sentence) {
    const words = s.words.join(" ");
    return finished(s) ? `${words}${s.end}` : `${words} …`;
  }

  // Rows to watch: the `.` row starts every sentence and the `the` row is where
  // `magpie` comes from.
  const WATCH = [".", "the"];
  const rowOf = (m: Counts, w: string) =>
    [...(m.get(w) ?? new Map<string, number>())]
      .filter(([, n]) => n > 0)
      .toSorted((a, b) => b[1] - a[1]);

  let lostPairs = $derived(
    [...base].reduce(
      (s, [a, row]) => s + [...row.keys()].filter((b) => get(model, a, b) === 0).length,
      0,
    ),
  );
  let storyPairs = [...base.values()].reduce((s, row) => s + row.size, 0);

  const share = (m: Counts) => get(m, "the", "magpie") / rowTotal(m, "the");
</script>

<FullscreenWrapper>
  <div class="lm-widget rewards-widget">
    <div class="widget-view">
      <div class="controls">
        <div class="mode" role="group" aria-label="Judge">
          <button
            type="button"
            aria-pressed={mode === "rule"}
            onclick={() => {
              mode = "rule";
              reset();
            }}>Rule card</button
          >
          <button
            type="button"
            aria-pressed={mode === "panel"}
            onclick={() => {
              mode = "panel";
              leash = "on";
              reset();
            }}>Panel</button
          >
        </div>
        {#if mode === "rule"}
          <label class="leash">
            <input
              type="checkbox"
              checked={leash === "on"}
              onchange={(e) => {
                leash = e.currentTarget.checked ? "on" : "off";
                reset();
              }}
            />
            leash
          </label>
        {/if}
        <button type="button" onclick={reset} disabled={history.length === 0}>Start again</button>
      </div>

      <p class="judge">
        {#if mode === "rule"}
          <strong>Rule card:</strong> a sentence passes if it ends with <code>.</code> or
          <code>!</code> and has <code>magpie</code> in it. Passes add 1 to each of their pairs, failures
          take 1 off.
        {:else}
          <strong>Panel:</strong> read the five sentences, then pick the best and the worst. The best
          adds 1 to each of its pairs, the worst takes 1 off.
        {/if}
      </p>

      <div class="widget-section">
        <div class="section-header">Round {round}</div>
        {#if candidates.length === 0}
          <div class="actions">
            <button type="button" onclick={generate}>Generate five sentences</button>
            {#if mode === "rule"}
              <button type="button" onclick={() => fastForward(5)}>Run five rounds</button>
            {/if}
          </div>
        {:else}
          <ol class="candidates">
            {#each candidates as s, i}
              <li>
                <span class="sentence" class:unfinished={!finished(s)}>{show(s)}</span>
                {#if mode === "rule"}
                  <span class="verdict" class:pass={passes(s)}>{passes(s) ? "pass" : "fail"}</span>
                {:else}
                  <span class="rank" role="group" aria-label="Rank sentence {i + 1}">
                    <button type="button" aria-pressed={best === i} onclick={() => (best = i)}
                      >best</button
                    >
                    <button type="button" aria-pressed={worst === i} onclick={() => (worst = i)}
                      >worst</button
                    >
                  </span>
                {/if}
              </li>
            {/each}
          </ol>
          <div class="actions">
            <button type="button" onclick={applyUpdate} disabled={!canUpdate}
              >Update the counts</button
            >
          </div>
        {/if}
      </div>

      <div class="widget-section">
        <div class="section-header">Rows to watch</div>
        {#each WATCH as w}
          <div class="watch-row">
            <code class="row-word">{w}</code>
            <div class="row-bar" aria-hidden="true">
              {#each rowOf(model, w) as [next, n]}
                <span class="seg" class:magpie={next === "magpie"} style:flex-grow={n}
                  >{next} {n}</span
                >
              {/each}
            </div>
            <p class="row-text">
              {#each rowOf(model, w) as [next, n]}<span class:magpie-text={next === "magpie"}
                  >{next}&nbsp;{n}</span
                >{/each}
            </p>
          </div>
        {/each}
        <p class="readout">
          <code>magpie</code> is {Math.round(100 * share(model))}% of the <code>the</code> row (it
          started at {Math.round(100 * share(base))}%).
          {#if leash === "off"}
            {lostPairs} of the story's {storyPairs} pairs are gone.
          {/if}
        </p>
      </div>

      <div class="widget-section">
        <div class="section-header">Check the model</div>
        <div class="actions">
          <button type="button" onclick={() => (check = { round, rate: passRate(model) })}
            >Test 400 sentences against the rule card</button
          >
        </div>
        <p class="readout">
          The story's model passes about {Math.round(100 * startRate)}% of the time.
          {#if check}
            After {check.round - 1}
            {check.round === 2 ? "round" : "rounds"}, this one passes {Math.round(
              100 * check.rate,
            )}%.
          {/if}
        </p>
      </div>

      {#if history.length > 0}
        <div class="widget-section">
          <div class="section-header">Rounds</div>
          <ol class="history">
            {#each history as h}
              <li value={h.round}>{h.note}</li>
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

    .leash {
      min-height: 2.75rem;
    }

    .leash input {
      inline-size: 1.25rem;
      block-size: 1.25rem;
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

  .leash {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.875rem;
  }

  .judge,
  .readout {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .candidates,
  .history {
    margin: 0.25rem 0 0.5rem;
    padding-left: 2rem;
  }

  .candidates {
    padding-left: 0;
    list-style: none;
  }

  .candidates li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
  }

  .sentence {
    font-family: var(--font-mono);
  }

  .sentence.unfinished {
    color: var(--color-text-muted);
  }

  .verdict {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .verdict.pass {
    color: var(--color-brand);
  }

  .rank {
    display: flex;
    gap: 0.25rem;
  }

  .rank button {
    padding: 0.1rem 0.5rem;
    font-size: 0.75rem;
  }

  .history {
    font-size: 0.875rem;
    max-height: 12rem;
    overflow-y: auto;
  }

  .watch-row {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1fr);
    align-items: center;
    gap: 0.2rem 0.5rem;
    margin-bottom: 0.6rem;
  }

  .row-word {
    text-align: right;
  }

  .row-text {
    grid-column: 2;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .row-text span + span::before {
    content: ", ";
    color: var(--color-text-muted);
    font-weight: 400;
  }

  .magpie-text {
    color: var(--color-brand);
    font-weight: 600;
  }

  .row-bar {
    display: flex;
    min-width: 0;
    height: 1.6rem;
    border-radius: 0.2rem;
    overflow: hidden;
    gap: 1px;
  }

  .seg {
    flex-basis: 0;
    min-width: 0;
    overflow: hidden;
    padding: 0 0.25rem;
    background: var(--color-bg-alt);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    line-height: 1.6rem;
    white-space: nowrap;
    text-overflow: clip;
  }

  .seg.magpie {
    background: var(--color-brand);
    color: #000;
    font-weight: 600;
  }
</style>
