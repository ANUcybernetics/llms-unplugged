import { describe, expect, it } from "vitest";
import { computeDiceBands } from "../src/lib/diceBands";
import { buildModelEntries, findWordForThresholdRoll } from "../src/lib/modelEntries";
import { buildBigramModel, getVocabulary, parseTokens } from "../src/lib/tokens";

// The expected thresholds in these tests are pinned against real output of
// the Rust CLI's format_entries (cli/src/lib.rs), which prints the booklets'
// dice ranges: cumulative counts are rescaled by ceiling/total and THEN
// rounded. Per-option rounding --- the obvious alternative, and the bug this
// test guards against --- disagrees at rounding boundaries.
describe("computeDiceBands", () => {
  it("matches the booklet apportionment for three equal counts", () => {
    // CLI: ["a",9,["b",3],["c",6],["d",9]]
    expect(
      computeDiceBands([
        { word: "b", count: 1 },
        { word: "c", count: 1 },
        { word: "d", count: 1 },
      ]),
    ).toEqual([
      { word: "b", count: 1, from: 0, to: 3 },
      { word: "c", count: 1, from: 4, to: 6 },
      { word: "d", count: 1, from: 7, to: 9 },
    ]);
  });

  it("matches the booklet apportionment at a .5 rounding boundary", () => {
    // CLI: [".",9,["p",3],["q",6],["r",8],["s",9]] --- the "r" threshold is
    // round(5 * 9/6) = round(7.5) = 8.
    expect(
      computeDiceBands([
        { word: "p", count: 2 },
        { word: "q", count: 2 },
        { word: "r", count: 1 },
        { word: "s", count: 1 },
      ]),
    ).toEqual([
      { word: "p", count: 2, from: 0, to: 3 },
      { word: "q", count: 2, from: 4, to: 6 },
      { word: "r", count: 1, from: 7, to: 8 },
      { word: "s", count: 1, from: 9, to: 9 },
    ]);
  });

  it("gives a single option the full range", () => {
    expect(computeDiceBands([{ word: "only", count: 5 }])).toEqual([
      { word: "only", count: 5, from: 0, to: 9 },
    ]);
  });

  it("uses two dice once the total reaches double digits", () => {
    expect(
      computeDiceBands([
        { word: "a", count: 7 },
        { word: "b", count: 3 },
      ]),
    ).toEqual([
      { word: "a", count: 7, from: 0, to: 69 },
      { word: "b", count: 3, from: 70, to: 99 },
    ]);
  });

  it("returns empty for no options or all-zero counts", () => {
    expect(computeDiceBands([])).toEqual([]);
    expect(computeDiceBands([{ word: "a", count: 0 }])).toEqual([]);
  });
});

describe("buildModelEntries", () => {
  it("uses the shared apportionment for its thresholds", () => {
    const tokens = parseTokens("a b. a c. a d.");
    const model = buildBigramModel(tokens);
    const entries = buildModelEntries(getVocabulary(tokens), model);
    const entry = entries.find((e) => e.previousWord === "a");

    expect(entry?.numDice).toBe(1);
    expect(entry?.nextWords.map((w) => w.threshold)).toEqual([3, 6, 9]);
  });

  it("resolves rolls against the thresholds", () => {
    const tokens = parseTokens("a b. a c. a d.");
    const model = buildBigramModel(tokens);
    const entries = buildModelEntries(getVocabulary(tokens), model);
    const entry = entries.find((e) => e.previousWord === "a")!;

    expect(findWordForThresholdRoll(entry, 0)).toBe("b");
    expect(findWordForThresholdRoll(entry, 3)).toBe("b");
    expect(findWordForThresholdRoll(entry, 4)).toBe("c");
    expect(findWordForThresholdRoll(entry, 9)).toBe("d");
  });
});
