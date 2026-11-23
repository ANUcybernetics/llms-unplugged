import { copy, type Counts, pick } from "./rewards";

/**
 * The Synthetic Data relay: each link generates a slip of twenty words from
 * its model, and the next link's model is trained on that slip. Shared by
 * RelayWidget and the tests that check the page's numbers
 * (test/syntheticData.test.ts).
 */

export type { Counts } from "./rewards";

export const WORDS_PER_LINK = 20;
export const START = ".";

/** Tally a text's pairs into a sheet: a fresh one unless one is given. */
export function tally(tokens: string[], sheet: Counts = new Map()): Counts {
  for (let i = 0; i + 1 < tokens.length; i++) {
    const row = sheet.get(tokens[i]) ?? new Map<string, number>();
    row.set(tokens[i + 1], (row.get(tokens[i + 1]) ?? 0) + 1);
    sheet.set(tokens[i], row);
  }
  return sheet;
}

/** A slip: twenty words rolled from `.`. A word with nothing after it means write `.` and carry on. */
export function slip(model: Counts, r: () => number, words = WORDS_PER_LINK): string[] {
  const out: string[] = [];
  let w = START;
  while (out.length < words) {
    w = pick(model.get(w) ?? new Map(), r) ?? START;
    out.push(w);
  }
  return out;
}

export const differentWords = (text: string[]) => new Set(text).size;

/** The words a model can still write: the ones some row leads to. */
export function writable(model: Counts): Set<string> {
  const words = new Set<string>();
  for (const row of model.values()) {
    for (const [w, n] of row) if (n > 0) words.add(w);
  }
  return words;
}

/**
 * The model the next link generates from. The slip is tallied with the `.` it
 * began from, onto a fresh sheet, or onto a copy of the sheet it was rolled
 * from when the chain keeps its data.
 */
export function nextModel(model: Counts, text: string[], keep: boolean): Counts {
  return tally([START, ...text], keep ? copy(model) : new Map());
}
