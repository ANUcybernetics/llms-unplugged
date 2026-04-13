import { describe, it, expect } from "vitest";
import { partitionDice, createDiceMapping, findWordForRoll } from "../src/lib/diceMapping";

describe("partitionDice", () => {
  it("divides evenly when possible", () => {
    expect(partitionDice(10, 2)).toEqual([5, 5]);
    expect(partitionDice(6, 3)).toEqual([2, 2, 2]);
  });

  it("distributes remainder to earlier groups", () => {
    expect(partitionDice(10, 3)).toEqual([4, 3, 3]);
    expect(partitionDice(7, 3)).toEqual([3, 2, 2]);
  });

  it("returns empty for zero groups", () => {
    expect(partitionDice(10, 0)).toEqual([]);
  });

  it("handles more groups than sides", () => {
    const result = partitionDice(3, 5);
    expect(result).toEqual([1, 1, 1, 0, 0]);
  });
});

describe("createDiceMapping", () => {
  it("maps options to dice ranges covering all sides", () => {
    const options = [
      { word: "cat", count: 2 },
      { word: "sat", count: 1 },
    ];
    const mappings = createDiceMapping(options, 6);

    expect(mappings).toHaveLength(2);
    expect(mappings[0].diceRange[0]).toBe(1);
    expect(mappings[mappings.length - 1].diceRange[1]).toBe(6);
  });

  it("returns empty for zero total count", () => {
    const options = [{ word: "cat", count: 0 }];
    expect(createDiceMapping(options, 6)).toEqual([]);
  });

  it("assigns proportional ranges", () => {
    const options = [
      { word: "a", count: 3 },
      { word: "b", count: 1 },
    ];
    const mappings = createDiceMapping(options, 4);

    const aSize = mappings[0].diceRange[1] - mappings[0].diceRange[0] + 1;
    expect(aSize).toBeGreaterThanOrEqual(2);
  });

  it("filters out zero-count options", () => {
    const options = [
      { word: "a", count: 2 },
      { word: "b", count: 0 },
      { word: "c", count: 1 },
    ];
    const mappings = createDiceMapping(options, 6);
    const words = mappings.map((m) => m.word);
    expect(words).not.toContain("b");
  });
});

describe("findWordForRoll", () => {
  const mappings = [
    { word: "cat", count: 2, diceRange: [1, 4] as [number, number] },
    { word: "sat", count: 1, diceRange: [5, 6] as [number, number] },
  ];

  it("finds the word for a roll within range", () => {
    expect(findWordForRoll(mappings, 1)).toBe("cat");
    expect(findWordForRoll(mappings, 4)).toBe("cat");
    expect(findWordForRoll(mappings, 5)).toBe("sat");
    expect(findWordForRoll(mappings, 6)).toBe("sat");
  });

  it("returns null for out-of-range rolls", () => {
    expect(findWordForRoll(mappings, 0)).toBeNull();
    expect(findWordForRoll(mappings, 7)).toBeNull();
  });
});
