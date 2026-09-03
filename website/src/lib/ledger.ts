// The ledger activity's shapes, for the deck widgets that draw a printed
// sheet, its bag of counters and the shared bucket. Mirrors cli/src/ledger.rs
// and cli/ledger-common.typ: the printed sheet is the ground truth, so the
// palettes here are the same twelve names in the same order (checked by
// test/ledgerPaletteSync.test.ts) and colour is by column, cycling through
// the three palettes down the physical rows.

export interface Follower {
  text: string;
  count: number;
}

export interface LedgerEntry {
  prefix: string;
  followers: Follower[];
}

/** The three row palettes, each `LEDGER_COLUMNS` colour names. */
export const LEDGER_PALETTES: readonly (readonly string[])[] = [
  ["red", "blue", "green", "yellow"],
  ["pink", "purple", "black", "white"],
  ["orange", "brown", "grey", "teal"],
];

export const LEDGER_COLUMNS = 4;

/**
 * Colour names for physical row `row` of a sheet (0-based). `palettes` is
 * how many of the three the sheet cycles through: a room with counters in
 * eight colours prints with two (the CLI's --palettes), so a widget showing
 * that room's sheet must cycle the same two.
 */
export function paletteFor(
  row: number,
  columns = LEDGER_COLUMNS,
  palettes = LEDGER_PALETTES.length,
): readonly string[] {
  return LEDGER_PALETTES[row % palettes].slice(0, columns);
}

/** The CSS custom property carrying a palette colour's full value. */
export function ledgerColour(name: string): string {
  return `var(--ledger-${name})`;
}

/** Physical rows an entry takes: one per `columns` followers, at least one. */
export function physicalRows(entry: LedgerEntry, columns = LEDGER_COLUMNS): number {
  return Math.max(1, Math.ceil(entry.followers.length / columns));
}

/**
 * The follower cells of an entry laid out row by row, each with the colour
 * name its strip prints in. `firstRow` is the physical row the entry starts
 * on, which decides which palette its first row takes.
 */
export interface Cell {
  index: number;
  follower: Follower | null;
  colour: string;
  row: number;
  column: number;
}

export function layoutCells(
  entry: LedgerEntry,
  columns = LEDGER_COLUMNS,
  firstRow = 0,
  palettes = LEDGER_PALETTES.length,
): Cell[][] {
  const rows: Cell[][] = [];
  for (let r = 0; r < physicalRows(entry, columns); r++) {
    const palette = paletteFor(firstRow + r, columns, palettes);
    rows.push(
      palette.map((colour, c) => {
        const index = r * columns + c;
        return { index, follower: entry.followers[index] ?? null, colour, row: r, column: c };
      }),
    );
  }
  return rows;
}

/**
 * Count a token stream into entries the way the CLI does: one per prefix in
 * first-appearance order of its followers, prefixes in the order they first
 * appear (the CLI sorts them alphabetically for the deal; a widget showing
 * one row does not care). `upTo` counts only the first `upTo` pairs, so a
 * training walkthrough can show the marks as they accumulate.
 */
export function entriesFromTokens(tokens: string[], upTo = Infinity): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const byPrefix = new Map<string, LedgerEntry>();
  const pairs = Math.min(upTo, Math.max(0, tokens.length - 1));
  for (let i = 0; i < pairs; i++) {
    const prefix = tokens[i];
    const next = tokens[i + 1];
    let entry = byPrefix.get(prefix);
    if (!entry) {
      entry = { prefix, followers: [] };
      byPrefix.set(prefix, entry);
      entries.push(entry);
    }
    const follower = entry.followers.find((f) => f.text === next);
    if (follower) follower.count += 1;
    else entry.followers.push({ text: next, count: 1 });
  }
  return entries;
}

/** The bag for an entry: one counter per tally mark, in its strip's colour. */
export interface Counter {
  colour: string;
  follower: Follower;
  index: number;
}

export function bagFor(
  entry: LedgerEntry,
  columns = LEDGER_COLUMNS,
  firstRow = 0,
  palettes = LEDGER_PALETTES.length,
): Counter[] {
  const counters: Counter[] = [];
  for (const row of layoutCells(entry, columns, firstRow, palettes)) {
    for (const cell of row) {
      if (!cell.follower) continue;
      for (let k = 0; k < cell.follower.count; k++) {
        counters.push({ colour: cell.colour, follower: cell.follower, index: cell.index });
      }
    }
  }
  return counters;
}

/** Split a space-separated, already-tokenised string into tokens. */
export function splitTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}
