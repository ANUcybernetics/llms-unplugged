import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bagFor,
  entriesFromTokens,
  isPale,
  layoutCells,
  LEDGER_COLUMNS,
  LEDGER_PALETTE,
  type PaletteEntry,
  paletteFor,
  splitTokens,
} from "../src/lib/ledger";

// The palette is data: the CLI writes the room's colours into ledger.json and
// the printed sheet takes them from there. LEDGER_PALETTE is the copy the
// widgets fall back on when a slide does not pass one, so it has to be the
// CLI's default, name for name and value for value.

const cliDefault = (): PaletteEntry[] =>
  JSON.parse(readFileSync(join(process.cwd(), "../cli/ledger-palette.json"), "utf-8"));

describe("ledger palette sync", () => {
  it("matches the CLI's default palette", () => {
    expect([...LEDGER_PALETTE]).toEqual(cliDefault());
  });

  it("cycles the palette a row of colours at a time", () => {
    expect(paletteFor(0).map((c) => c.name)).toEqual(["red", "blue", "green", "yellow"]);
    expect(paletteFor(1).map((c) => c.name)).toEqual(["pink", "purple", "black", "white"]);
    expect(paletteFor(3)).toEqual(paletteFor(0));
    expect(paletteFor(0, 3).map((c) => c.name)).toEqual(["red", "blue", "green"]);
    // An eight-colour room cycles two rows, so row 2 is red again.
    const eight = LEDGER_PALETTE.slice(0, 8);
    expect(paletteFor(2, 4, eight)).toEqual(paletteFor(0));
  });

  it("calls white pale and the rest not, as the sheet does", () => {
    const pale = LEDGER_PALETTE.filter((c) => isPale(c.hex)).map((c) => c.name);
    expect(pale).toEqual(["white"]);
  });
});

describe("ledger entries", () => {
  const tokens = splitTokens("I am Sam . I am Sam . Sam I am .");

  it("counts followers in first-appearance order, prefixes likewise", () => {
    const entries = entriesFromTokens(tokens);
    expect(entries.map((e) => e.prefix)).toEqual(["I", "am", "Sam", "."]);
    expect(entries[0].followers).toEqual([{ text: "am", count: 3 }]);
    expect(entries[1].followers).toEqual([
      { text: "Sam", count: 2 },
      { text: ".", count: 1 },
    ]);
  });

  it("counts only the first upTo pairs", () => {
    const [i] = entriesFromTokens(tokens, 1);
    expect(i.followers).toEqual([{ text: "am", count: 1 }]);
    expect(entriesFromTokens(tokens, 0)).toEqual([]);
  });

  it("lays a wide prefix out over rows in the next colours", () => {
    const entry = {
      prefix: "them",
      followers: ["a", "b", "c", "d", "e"].map((text) => ({ text, count: 1 })),
    };
    const rows = layoutCells(entry);
    expect(rows).toHaveLength(2);
    expect(rows[0].map((c) => c.colour)).toEqual(paletteFor(0));
    expect(rows[1][0]).toMatchObject({ index: LEDGER_COLUMNS });
    expect(rows[1][0].colour.name).toBe("pink");
    expect(rows[1][1].follower).toBeNull();
  });

  it("loads the bag with one counter per mark in the strip's colour", () => {
    const entry = {
      prefix: "I",
      followers: [
        { text: "am", count: 2 },
        { text: "do", count: 1 },
      ],
    };
    expect(bagFor(entry).map((c) => `${c.colour.name}:${c.follower.text}`)).toEqual([
      "red:am",
      "red:am",
      "blue:do",
    ]);
  });
});
