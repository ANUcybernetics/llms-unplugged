import { describe, expect, it } from "vitest";
import { computeDiceBands } from "../src/lib/diceBands";
import { buildModelEntries, findWordForThresholdRoll } from "../src/lib/modelEntries";
import { buildBigramModel, getVocabulary, parseTokens } from "../src/lib/tokens";

// The expected thresholds in these tests are pinned against real output of
// the Rust CLI's format_entries (cli/src/model.rs), which prints the booklets'
// dice ranges: cumulative counts are rescaled onto the 10^k faces and THEN
// rounded, each band ending one face below the next one's start. Two
// alternatives that look right and aren't: rescaling by (10^k - 1)/total,
// which gives the last option one face too few, and rounding each option's
// share separately, which disagrees at rounding boundaries.
describe("computeDiceBands", () => {
  it("splits two equal counts down the middle", () => {
    // CLI: ["a",9,["b",4],["c",9]] --- five faces each, not 6/4.
    expect(
      computeDiceBands([
        { word: "b", count: 1 },
        { word: "c", count: 1 },
      ]),
    ).toEqual([
      { word: "b", count: 1, from: 0, to: 4 },
      { word: "c", count: 1, from: 5, to: 9 },
    ]);
  });

  it("matches the booklet apportionment for three equal counts", () => {
    // CLI: ["a",9,["b",2],["c",6],["d",9]] --- ten faces can't split three
    // ways, so the spare face lands on "c".
    expect(
      computeDiceBands([
        { word: "b", count: 1 },
        { word: "c", count: 1 },
        { word: "d", count: 1 },
      ]),
    ).toEqual([
      { word: "b", count: 1, from: 0, to: 2 },
      { word: "c", count: 1, from: 3, to: 6 },
      { word: "d", count: 1, from: 7, to: 9 },
    ]);
  });

  it("matches the booklet apportionment at a .5 rounding boundary", () => {
    // CLI: [".",9,["p",4],["q",7],["r",9]] --- the "q" threshold is
    // round(3 * 10/4) - 1 = round(7.5) - 1 = 7.
    expect(
      computeDiceBands([
        { word: "p", count: 2 },
        { word: "q", count: 1 },
        { word: "r", count: 1 },
      ]),
    ).toEqual([
      { word: "p", count: 2, from: 0, to: 4 },
      { word: "q", count: 1, from: 5, to: 7 },
      { word: "r", count: 1, from: 8, to: 9 },
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
    expect(entry?.nextWords.map((w) => w.threshold)).toEqual([2, 6, 9]);
  });

  it("resolves rolls against the thresholds", () => {
    const tokens = parseTokens("a b. a c. a d.");
    const model = buildBigramModel(tokens);
    const entries = buildModelEntries(getVocabulary(tokens), model);
    const entry = entries.find((e) => e.previousWord === "a")!;

    expect(findWordForThresholdRoll(entry, 0)).toBe("b");
    expect(findWordForThresholdRoll(entry, 2)).toBe("b");
    expect(findWordForThresholdRoll(entry, 3)).toBe("c");
    expect(findWordForThresholdRoll(entry, 9)).toBe("d");
  });
});
