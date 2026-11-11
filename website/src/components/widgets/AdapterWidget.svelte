<script lang="ts">
  import {
    countsFromText,
    generateSentence,
    rowTotal,
    SENTENCE_END,
    type Sheet,
    step,
    type Step,
  } from "../../lib/adapters";
  import { isPunctuation } from "../../lib/tokens";
  import FullscreenWrapper from "../FullscreenWrapper.svelte";

  interface SheetProp {
    name: string;
    text: string;
    strength?: number;
  }

  interface Props {
    base: SheetProp;
    adapters: SheetProp[];
    /** strengths offered for each adapter; the base offers 1, 2 and 3 */
    levels?: number[];
  }

  let { base, adapters, levels = [0, 1, 2, 3, 9] }: Props = $props();

  // Sheet 0 is the base; the rest are adapters. Texts are editable so a class
  // can swap in its own base or adapter text.
  // svelte-ignore state_referenced_locally
  let sheets = $state(
    [base, ...adapters].map((s, i) => ({
      name: s.name,
      text: s.text,
      strength: s.strength ?? (i === 0 ? 1 : 0),
    })),
  );

  let counts = $derived(sheets.map((s) => countsFromText(s.text)));
  let model: Sheet[] = $derived(
    counts.map((c, i) => ({ counts: c, strength: sheets[i].strength })),
  );

  function vocabOf(c: Map<string, Map<string, number>>): Set<string> {
    const words = new Set(c.keys());
    for (const row of c.values()) for (const w of row.keys()) words.add(w);
    return words;
  }
  let vocabs = $derived(counts.map(vocabOf));

  /** the sheet a word comes from: 0 if the base has it, else the first adapter that does */
  function sourceOf(word: string): number {
    const i = vocabs.findIndex((v) => v.has(word));
    return Math.max(0, i);
  }

  function settingLabel(): string {
    const [baseSheet, ...rest] = sheets;
    const on = rest.filter((s) => s.strength > 0).map((s) => `${s.name} ×${s.strength}`);
    const label = on.join(" + ") || "no adapter";
    return baseSheet.strength === 1 ? label : `${label}, ${baseSheet.name} ×${baseSheet.strength}`;
  }

  // The sentence being built word by word, and the finished ones.
  let current = $state<Step[]>([]);
  let deadEnd = $state(false);
  let log = $state<{ setting: string; words: string[] }[]>([]);

  let lastStep = $derived(current.at(-1));
  let sentenceDone = $derived(
    deadEnd || (lastStep !== undefined && SENTENCE_END.has(lastStep.next)),
  );

  function finish(steps: Step[]) {
    log.unshift({ setting: settingLabel(), words: steps.map((s) => s.next) });
  }

  function nextWord() {
    if (sentenceDone) {
      current = [];
      deadEnd = false;
    }
    const from = current.at(-1)?.next ?? ".";
    const s = step(model, from, Math.random);
    if (!s) {
      deadEnd = true;
      if (current.length > 0) finish(current);
      return;
    }
    current = [...current, s];
    if (SENTENCE_END.has(s.next) || current.length >= 20) finish(current);
  }

  function wholeSentence() {
    const from = sentenceDone || current.length === 0 ? [] : current;
    let steps = [...from];
    const startWord = steps.at(-1)?.next;
    // carry on from where the class got to, or start a fresh sentence from `.`
    if (startWord) {
      while (steps.length < 20) {
        const s = step(model, steps.at(-1)!.next, Math.random);
        if (!s) break;
        steps.push(s);
        if (SENTENCE_END.has(s.next)) break;
      }
    } else {
      steps = generateSentence(model, Math.random);
    }
    current = steps;
    deadEnd = !SENTENCE_END.has(steps.at(-1)?.next ?? "");
    if (steps.length > 0) finish(steps);
  }

  function tenSentences() {
    for (let i = 0; i < 10; i++) {
      const steps = generateSentence(model, Math.random);
      if (steps.length > 0) finish(steps);
      current = steps;
    }
    deadEnd = false;
  }

  function clearAll() {
    current = [];
    deadEnd = false;
    log = [];
  }

  // The table shows the row the latest word was rolled on.
  let shownStep = $derived(lastStep);
  let shownRow = $derived(shownStep?.row ?? []);
  let activeSheets = $derived(sheets.map((s, i) => ({ ...s, i })).filter((s) => s.strength > 0));

  const contributing = (option: { parts: number[] }) =>
    activeSheets.filter((s) => option.parts[s.i] > 0);

  const usesAdapter = (words: string[]) => words.some((w) => sourceOf(w) > 0);

  let summary = $derived.by(() => {
    const bySetting = new Map<string, { sentences: number; adapted: number }>();
    for (const { setting, words } of log.toReversed()) {
      const entry = bySetting.get(setting) ?? { sentences: 0, adapted: 0 };
      entry.sentences++;
      entry.adapted += +usesAdapter(words);
      bySetting.set(setting, entry);
    }
    return [...bySetting];
  });

  function sentenceText(words: string[]) {
    return words.filter((w, i) => !(i === words.length - 1 && SENTENCE_END.has(w)));
  }
</script>

<FullscreenWrapper>
  <div class="lm-widget adapter-widget">
    <div class="widget-view">
      <div class="sheets">
        {#each sheets as sheet, i}
          <div class="sheet sheet-{i}">
            <div class="sheet-head">
              <span class="sheet-name">{sheet.name}</span>
              <span class="sheet-role">{i === 0 ? "base grid" : "adapter sheet"}</span>
            </div>
            <div class="strengths" role="group" aria-label="{sheet.name} strength">
              {#each i === 0 ? [1, 2, 3] : levels as level}
                <button
                  type="button"
                  aria-pressed={sheet.strength === level}
                  onclick={() => (sheet.strength = level)}
                  >{level === 0 ? "off" : `×${level}`}</button
                >
              {/each}
            </div>
            <details>
              <summary>Text</summary>
              <textarea
                class="text-input"
                rows="4"
                aria-label="{sheet.name} text"
                bind:value={sheet.text}></textarea>
            </details>
          </div>
        {/each}
      </div>

      <div class="widget-section">
        <div class="section-header">Merged row</div>
        {#if shownStep}
          <p class="row-caption">
            <code>{shownStep.from}</code> is followed by {rowTotal(shownRow)}
            {rowTotal(shownRow) === 1 ? "tally" : "tallies"} in all. Rolled {shownStep.roll}:
            <code>{shownStep.next}</code>.
          </p>
        {/if}
        {#if shownStep}
          <div class="row-scroll">
            <table class="merged-row">
              <thead>
                <tr>
                  <th scope="col">next word</th>
                  {#each activeSheets as s}
                    <th scope="col" class="num wide sheet-{s.i}"
                      >{s.name}{#if s.strength !== 1}&nbsp;×{s.strength}{/if}</th
                    >
                  {/each}
                  <th scope="col" class="num wide">total</th>
                  <th scope="col" class="num narrow">tallies</th>
                  <th scope="col" class="num">rolls</th>
                  <th scope="col" class="bar-cell"><span class="sr-only">share</span></th>
                </tr>
              </thead>
              <tbody>
                {#each shownRow as option}
                  <tr class:picked={option.word === shownStep.next}>
                    <th scope="row" class="sheet-{sourceOf(option.word)}"
                      ><code>{option.word}</code></th
                    >
                    {#each activeSheets as s}
                      <td class="num wide">{option.parts[s.i] || ""}</td>
                    {/each}
                    <td class="num wide">{option.total}</td>
                    <td class="num narrow"
                      >{#if contributing(option).length > 1}{contributing(option)
                          .map((s) => option.parts[s.i])
                          .join(" + ")} ={" "}{/if}{option.total}</td
                    >
                    <td class="num range"
                      >{option.range[0] === option.range[1]
                        ? option.range[0]
                        : `${option.range[0]}–${option.range[1]}`}</td
                    >
                    <td class="bar-cell">
                      <span class="bar" style:width="{(100 * option.total) / rowTotal(shownRow)}%"
                      ></span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="hint">
            Set each sheet's strength, then press Next word. Each step adds the sheets' rows for the
            current word, multiplied by their strengths, and rolls on the total.
          </p>
        {/if}
      </div>

      <div class="widget-section">
        <div class="section-header">Sentence</div>
        <div class="output-content" aria-live="polite">
          {#each current as s, i}
            {#if i > 0 && !isPunctuation(s.next)}{" "}{/if}<span
              class="output-word sheet-{sourceOf(s.next)}"
              class:latest={i === current.length - 1}>{s.next}</span
            >
          {/each}
          {#if deadEnd}<span class="hint"> (no row for that word, so the sentence stops)</span>{/if}
        </div>
      </div>

      <div class="controls-strip actions">
        <button type="button" onclick={nextWord}>Next word</button>
        <button type="button" onclick={wholeSentence}>Whole sentence</button>
        <button type="button" onclick={tenSentences}>Ten sentences</button>
        <button type="button" onclick={clearAll} disabled={log.length === 0 && current.length === 0}
          >Clear</button
        >
      </div>

      {#if log.length > 0}
        <div class="widget-section">
          <div class="section-header">Sentences so far</div>
          <table class="summary">
            <thead>
              <tr>
                <th scope="col">adapters on</th>
                <th scope="col" class="num">sentences</th>
                <th scope="col" class="num">with an adapter's new words</th>
              </tr>
            </thead>
            <tbody>
              {#each summary as [setting, { sentences, adapted }]}
                <tr>
                  <td>{setting}</td>
                  <td class="num">{sentences}</td>
                  <td class="num">{adapted}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          <ol class="log" reversed>
            {#each log as entry}
              <li>
                {#each sentenceText(entry.words) as w, j}
                  {#if j > 0 && !isPunctuation(w)}{" "}{/if}<span class="sheet-{sourceOf(w)}"
                    >{w}</span
                  >
                {/each}
                <span class="setting">{entry.setting}</span>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </div>
  </div>
</FullscreenWrapper>

<style>
  .adapter-widget {
    --sheet-0: var(--color-text);
    --sheet-1: var(--corpus-seuss, #7cc0e8);
    --sheet-2: var(--corpus-poe, #e8907c);

    /* room for FullscreenWrapper's button, which sits over the top corner */
    padding-top: 2.75rem;
  }

  .sheets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.75rem;
  }

  .sheet {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--sheet-colour);
    border-radius: 0.375rem;
    background: var(--color-bg);
  }

  .sheet-0 {
    --sheet-colour: var(--sheet-0);
  }

  .sheet-1 {
    --sheet-colour: var(--sheet-1);
  }

  .sheet-2 {
    --sheet-colour: var(--sheet-2);
  }

  .sheet-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  .sheet-name {
    font-weight: 600;
  }

  .sheet-role {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .strengths {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .strengths button,
  .actions button {
    padding: 0.25rem 0.6rem;
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
    .strengths button,
    .actions button {
      min-width: 2.75rem;
      min-height: 2.75rem;
    }

    details summary {
      padding-block: 0.5rem;
      font-size: 0.875rem;
    }
  }

  .strengths button[aria-pressed="true"] {
    background: var(--sheet-colour);
    border-color: var(--sheet-colour);
    color: #000;
    font-weight: 600;
  }

  .actions {
    flex-wrap: wrap;
  }

  .actions button:hover:not(:disabled),
  .strengths button:hover {
    border-color: var(--color-brand);
  }

  .actions button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  details summary {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  details textarea {
    margin-top: 0.25rem;
  }

  .row-scroll {
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .merged-row,
  .summary {
    width: 100%;
  }

  .summary thead th {
    white-space: normal;
  }

  .merged-row .narrow {
    display: none;
  }

  /* On a phone there is no room for a column per sheet: show each option's tallies as one sum instead, and drop the share bars, which the rolls column duplicates. */
  @container (width < 30rem) {
    .bar-cell {
      display: none;
    }

    th,
    td {
      padding-inline: 0.25rem;
    }

    .merged-row {
      font-size: 0.8rem;
    }

    .merged-row .wide {
      display: none;
    }

    .merged-row .narrow {
      display: table-cell;
    }
  }

  th,
  td {
    padding: 0.2rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--color-divider);
  }

  thead th {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  thead th.sheet-1,
  thead th.sheet-2,
  tbody th.sheet-1,
  tbody th.sheet-2,
  .output-word.sheet-1,
  .output-word.sheet-2,
  .log span.sheet-1,
  .log span.sheet-2 {
    color: var(--sheet-colour);
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .range {
    color: var(--color-text-muted);
  }

  tr.picked {
    background: var(--grid-cell-band);
  }

  tr.picked th {
    outline: 2px solid var(--color-brand);
    outline-offset: -2px;
  }

  .bar-cell {
    width: 30%;
    min-width: 4rem;
  }

  .bar {
    display: block;
    height: 0.6rem;
    border-radius: 0.15rem;
    background: var(--color-brand);
  }

  .row-caption {
    margin: 0;
    font-size: 0.875rem;
  }

  .hint {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .log {
    margin: 0.5rem 0 0;
    padding-left: 2.5rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    max-height: 14rem;
    overflow-y: auto;
  }

  .setting {
    margin-left: 0.5rem;
    font-family: var(--font-body, inherit);
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>
