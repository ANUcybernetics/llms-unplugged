import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bagFor,
  entriesFromTokens,
  layoutCells,
  LEDGER_COLUMNS,
  LEDGER_PALETTES,
  paletteFor,
  splitTokens,
} from "../src/lib/ledger";

// The ledger palette lives in three places that must agree: the typst
// palettes in cli/ledger-common.typ (the printed sheet, the ground truth),
// LEDGER_PALETTES in src/lib/ledger.ts (which colour a widget gives each
// column) and the --ledger-<name> tokens in src/styles/common.css (what that
// colour looks like on a slide).

const typstNames = (): string[][] => {
  const typ = readFileSync(join(process.cwd(), "../cli/ledger-common.typ"), "utf-8");
  const block = typ.match(/#let palettes = \(([\s\S]*?)\n\)/)?.[1] ?? "";
  return block
    .split(/\n  \(\n/)
    .filter((chunk) => chunk.includes("name:"))
    .map((chunk) => Array.from(chunk.matchAll(/name: "([a-z]+)"/g), (m) => m[1]));
};

describe("ledger palette sync", () => {
  it("matches the typst palettes name for name, in order", () => {
    expect(typstNames()).toEqual(LEDGER_PALETTES.map((p) => [...p]));
  });

  it("common.css defines a --ledger-<name> token for every colour", () => {
    const css = readFileSync(join(process.cwd(), "src/styles/common.css"), "utf-8");
    for (const name of LEDGER_PALETTES.flat()) {
      expect(css, `common.css is missing --ledger-${name}`).toMatch(
        new RegExp(`--ledger-${name}:`),
      );
    }
  });

  it("cycles the palettes down the rows", () => {
    expect(paletteFor(0)).toEqual(["red", "blue", "green", "yellow"]);
    expect(paletteFor(1)).toEqual(["pink", "purple", "black", "white"]);
    expect(paletteFor(3)).toEqual(paletteFor(0));
    expect(paletteFor(0, 3)).toEqual(["red", "blue", "green"]);
    // An eight-colour room cycles two palettes, so row 2 is red again.
    expect(paletteFor(2, 4, 2)).toEqual(paletteFor(0));
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

  it("lays a wide prefix out over rows in the next palette", () => {
    const entry = {
      prefix: "them",
      followers: ["a", "b", "c", "d", "e"].map((text) => ({ text, count: 1 })),
    };
    const rows = layoutCells(entry);
    expect(rows).toHaveLength(2);
    expect(rows[0].map((c) => c.colour)).toEqual(paletteFor(0));
    expect(rows[1][0]).toMatchObject({ index: LEDGER_COLUMNS, colour: "pink" });
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
    expect(bagFor(entry).map((c) => `${c.colour}:${c.follower.text}`)).toEqual([
      "red:am",
      "red:am",
      "blue:do",
    ]);
  });
});
