import { buildBigramModel, parseTokens } from "./tokens";

/**
 * Base grid plus adapter sheets, as on the Fine-tuning and LoRA page: each
 * sheet is a bigram grid with a strength, and the model used for generation is
 * the sum of every sheet's counts times its strength.
 */

export type Counts = Map<string, Map<string, number>>;

export interface Sheet {
  counts: Counts;
  strength: number;
}

export interface MergedOption {
  word: string;
  /** each sheet's contribution, already multiplied by its strength */
  parts: number[];
  total: number;
  /** the numbers a roll of 1 to the row total picks this word with */
  range: [number, number];
}

export function countsFromText(text: string): Counts {
  return buildBigramModel(parseTokens(stripFrontmatter(text))).counts;
}

export function stripFrontmatter(text: string): string {
  const match = text.match(/^---\n[\s\S]*?\n---\n/);
  return match ? text.slice(match[0].length) : text;
}

/**
 * The merged row for `word`, ordered as the hand method orders it: the base
 * row's words first, then each adapter's new ones, in the order each sheet
 * first saw them. Options whose total is zero are dropped.
 */
export function mergedRow(sheets: Sheet[], word: string): MergedOption[] {
  const order: string[] = [];
  for (const { counts } of sheets) {
    for (const next of counts.get(word)?.keys() ?? []) {
      if (!order.includes(next)) order.push(next);
    }
  }

  const options: MergedOption[] = [];
  let upTo = 0;
  for (const next of order) {
    const parts = sheets.map((s) => (s.counts.get(word)?.get(next) ?? 0) * s.strength);
    const total = parts.reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    options.push({ word: next, parts, total, range: [upTo + 1, upTo + total] });
    upTo += total;
  }
  return options;
}

export const rowTotal = (row: MergedOption[]) => row.at(-1)?.range[1] ?? 0;

/** The option a roll from 1 to the row total lands on. */
export function optionForRoll(row: MergedOption[], roll: number): MergedOption | undefined {
  return row.find((o) => roll >= o.range[0] && roll <= o.range[1]);
}

export interface Step {
  from: string;
  row: MergedOption[];
  roll: number;
  next: string;
}

export const SENTENCE_END = new Set([".", "!", "?"]);

/**
 * One generation step from `from`, or null at a dead end (no sheet has a row
 * for the word at its current strength).
 */
export function step(sheets: Sheet[], from: string, rng: () => number): Step | null {
  const row = mergedRow(sheets, from);
  const total = rowTotal(row);
  if (total === 0) return null;
  const roll = 1 + Math.floor(rng() * total);
  return { from, row, roll, next: optionForRoll(row, roll)!.word };
}

/**
 * A sentence started from `.` and stopped at the next sentence end, a dead end
 * or `maxWords`, as the page's dose board runs it.
 */
export function generateSentence(sheets: Sheet[], rng: () => number, maxWords = 20): Step[] {
  const steps: Step[] = [];
  let from = ".";
  while (steps.length < maxWords) {
    const s = step(sheets, from, rng);
    if (!s) break;
    steps.push(s);
    if (SENTENCE_END.has(s.next)) break;
    from = s.next;
  }
  return steps;
}
