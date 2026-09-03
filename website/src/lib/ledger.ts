// The ledger activity's shapes, for the deck widgets that draw a printed
// sheet, its bag of counters and the shared bucket. Mirrors cli/src/ledger.rs:
// the printed sheet is the ground truth, so a widget colours a strip the way
// ledger.typ does --- by column, cycling through a flat palette a row at a
// time --- and takes its colours from the same list the CLI writes into
// ledger.json. LEDGER_PALETTE below is the CLI's default palette, checked
// against cli/ledger-palette.json by test/ledgerPaletteSync.test.ts; a set
// printed for a room with fewer colours passes its own list to the widgets.

export interface Follower {
  text: string;
  count: number;
}

export interface LedgerEntry {
  prefix: string;
  followers: Follower[];
}

/** One counter colour: the name the room calls it and the value it prints in. */
export interface PaletteEntry {
  name: string;
  hex: string;
}

/** The CLI's default palette (cli/ledger-palette.json). */
export const LEDGER_PALETTE: readonly PaletteEntry[] = [
  { name: "red", hex: "#e50002" },
  { name: "blue", hex: "#0043df" },
  { name: "green", hex: "#129f01" },
  { name: "yellow", hex: "#eab308" },
  { name: "pink", hex: "#f5519f" },
  { name: "purple", hex: "#7d1e9c" },
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#ffffff" },
  { name: "orange", hex: "#fb923c" },
  { name: "brown", hex: "#653700" },
  { name: "grey", hex: "#868a86" },
  { name: "teal", hex: "#0891b2" },
];

export const LEDGER_COLUMNS = 4;

/**
 * Whole palettes of `columns` colours the list holds: the rows cycle through
 * it a palette at a time, so a prefix can run this many rows before its
 * strips repeat a colour.
 */
export function paletteCycles(
  palette: readonly PaletteEntry[] = LEDGER_PALETTE,
  columns = LEDGER_COLUMNS,
): number {
  return Math.max(1, Math.floor(palette.length / columns));
}

/**
 * The colours of physical row `row` of a sheet (0-based). Pass the room's
 * palette to show the sheet it has: eight colours cycle two rows, the default
 * twelve cycle three.
 */
export function paletteFor(
  row: number,
  columns = LEDGER_COLUMNS,
  palette: readonly PaletteEntry[] = LEDGER_PALETTE,
): readonly PaletteEntry[] {
  const k = row % paletteCycles(palette, columns);
  return palette.slice(k * columns, (k + 1) * columns);
}

/** A palette colour by name, for a widget whose data names one (a group's balls). */
export function colourNamed(
  name: string,
  palette: readonly PaletteEntry[] = LEDGER_PALETTE,
): PaletteEntry {
  return palette.find((c) => c.name === name) ?? { name, hex: "#888888" };
}

/**
 * A colour's OKLab lightness (0-1), the one property the sheet reads off a
 * colour: ledger-common.typ gives anything above 0.9 --- white, and anything
 * near it --- a dashed outline instead of a bar, since a white rule on paper
 * is nothing.
 */
export function lightness(hex: string): number {
  const digits =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(1, 7);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(digits.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.629978687 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

export function isPale(hex: string): boolean {
  return lightness(hex) > 0.9;
}

/** Physical rows an entry takes: one per `columns` followers, at least one. */
export function physicalRows(entry: LedgerEntry, columns = LEDGER_COLUMNS): number {
  return Math.max(1, Math.ceil(entry.followers.length / columns));
}

/**
 * The follower cells of an entry laid out row by row, each with the colour
 * its strip prints in. `firstRow` is the physical row the entry starts on,
 * which decides which of the palette's rows its first row takes.
 */
export interface Cell {
  index: number;
  follower: Follower | null;
  colour: PaletteEntry;
  row: number;
  column: number;
}

export function layoutCells(
  entry: LedgerEntry,
  columns = LEDGER_COLUMNS,
  firstRow = 0,
  palette: readonly PaletteEntry[] = LEDGER_PALETTE,
): Cell[][] {
  const rows: Cell[][] = [];
  for (let r = 0; r < physicalRows(entry, columns); r++) {
    rows.push(
      paletteFor(firstRow + r, columns, palette).map((colour, c) => {
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
  colour: PaletteEntry;
  follower: Follower;
  index: number;
}

export function bagFor(
  entry: LedgerEntry,
  columns = LEDGER_COLUMNS,
  firstRow = 0,
  palette: readonly PaletteEntry[] = LEDGER_PALETTE,
): Counter[] {
  const counters: Counter[] = [];
  for (const row of layoutCells(entry, columns, firstRow, palette)) {
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
