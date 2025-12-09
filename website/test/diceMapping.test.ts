import { describe, it, expect } from "vitest";
import {
  partitionDice,
  createDiceMapping,
  findWordForRoll,
} from "../.vitepress/theme/utils/diceMapping";

describe("partitionDice", () => {
  it("returns empty array for 0 groups", () => {
    expect(partitionDice(10, 0)).toEqual([]);
  });

  it("distributes evenly when divisible", () => {
    expect(partitionDice(10, 2)).toEqual([5, 5]);
    expect(partitionDice(10, 5)).toEqual([2, 2, 2, 2, 2]);
    expect(partitionDice(12, 3)).toEqual([4, 4, 4]);
  });

  it("distributes with remainder going to first groups", () => {
    expect(partitionDice(10, 3)).toEqual([4, 3, 3]);
    expect(partitionDice(7, 3)).toEqual([3, 2, 2]);
    expect(partitionDice(11, 4)).toEqual([3, 3, 3, 2]);
  });

  it("handles more groups than dice sides", () => {
    expect(partitionDice(3, 5)).toEqual([1, 1, 1, 0, 0]);
  });

  it("handles single group", () => {
    expect(partitionDice(10, 1)).toEqual([10]);
  });
});

describe("createDiceMapping", () => {
  it("returns empty array for empty options", () => {
    expect(createDiceMapping([], 10)).toEqual([]);
  });

  it("returns empty array when all counts are 0", () => {
    expect(
      createDiceMapping(
        [
          { word: "a", count: 0 },
          { word: "b", count: 0 },
        ],
        10,
      ),
    ).toEqual([]);
  });

  it("creates mapping for single option", () => {
    const result = createDiceMapping([{ word: "cat", count: 5 }], 10);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("cat");
    expect(result[0].diceRange).toEqual([1, 10]);
  });

  it("creates mapping for equal counts", () => {
    const result = createDiceMapping(
      [
        { word: "cat", count: 1 },
        { word: "dog", count: 1 },
      ],
      10,
    );
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe("cat");
    expect(result[1].word).toBe("dog");
    expect(result[0].diceRange[0]).toBe(1);
    expect(result[1].diceRange[1]).toBe(10);
  });

  it("skips options with count 0", () => {
    const result = createDiceMapping(
      [
        { word: "cat", count: 1 },
        { word: "dog", count: 0 },
        { word: "bird", count: 1 },
      ],
      10,
    );
    expect(result).toHaveLength(2);
    expect(result.find((m) => m.word === "dog")).toBeUndefined();
  });
});

describe("findWordForRoll", () => {
  const mappings = [
    { word: "cat", count: 2, diceRange: [1, 5] as [number, number] },
    { word: "dog", count: 1, diceRange: [6, 10] as [number, number] },
  ];

  it("finds word for roll in first range", () => {
    expect(findWordForRoll(mappings, 1)).toBe("cat");
    expect(findWordForRoll(mappings, 3)).toBe("cat");
    expect(findWordForRoll(mappings, 5)).toBe("cat");
  });

  it("finds word for roll in second range", () => {
    expect(findWordForRoll(mappings, 6)).toBe("dog");
    expect(findWordForRoll(mappings, 8)).toBe("dog");
    expect(findWordForRoll(mappings, 10)).toBe("dog");
  });

  it("returns null for roll outside all ranges", () => {
    expect(findWordForRoll(mappings, 0)).toBeNull();
    expect(findWordForRoll(mappings, 11)).toBeNull();
  });

  it("returns null for empty mappings", () => {
    expect(findWordForRoll([], 5)).toBeNull();
  });
});
