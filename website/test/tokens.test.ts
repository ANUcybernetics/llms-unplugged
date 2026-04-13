import { describe, it, expect } from "vitest";
import { parseTokens, getVocabulary, getBigrams, buildBigramModel } from "../src/lib/tokens";

describe("parseTokens", () => {
  it("splits words on whitespace", () => {
    expect(parseTokens("the cat sat")).toEqual(["the", "cat", "sat"]);
  });

  it("lowercases words", () => {
    expect(parseTokens("The Cat")).toEqual(["the", "cat"]);
  });

  it("preserves I and its contractions", () => {
    expect(parseTokens("I think I'm fine")).toEqual(["I", "think", "I'm", "fine"]);
  });

  it("keeps punctuation as separate tokens", () => {
    expect(parseTokens("the cat sat.")).toEqual(["the", "cat", "sat", "."]);
    expect(parseTokens("hello, world.")).toEqual(["hello", ",", "world", "."]);
  });

  it("handles multiple sentences", () => {
    expect(parseTokens("I sat. the cat sat.")).toEqual(["I", "sat", ".", "the", "cat", "sat", "."]);
  });

  it("returns empty array for empty input", () => {
    expect(parseTokens("")).toEqual([]);
  });

  it("filters out numeric tokens", () => {
    expect(parseTokens("chapter 1 the")).toEqual(["chapter", "the"]);
  });

  it("normalises curly apostrophes", () => {
    expect(parseTokens("I\u2019m")).toEqual(["I'm"]);
  });

  it("strips leading apostrophes from words", () => {
    expect(parseTokens("'hello")).toEqual(["hello"]);
  });

  it("preserves contractions", () => {
    expect(parseTokens("don't can't")).toEqual(["don't", "can't"]);
  });

  it("throws for excessively long text", () => {
    const longText = "a ".repeat(600_000);
    expect(() => parseTokens(longText)).toThrow("Text too long");
  });
});

describe("getVocabulary", () => {
  it("returns unique tokens preserving insertion order", () => {
    const tokens = ["the", "cat", "sat", "the", "cat"];
    expect(getVocabulary(tokens)).toEqual(["the", "cat", "sat"]);
  });

  it("returns empty array for empty input", () => {
    expect(getVocabulary([])).toEqual([]);
  });
});

describe("getBigrams", () => {
  it("returns consecutive token pairs", () => {
    expect(getBigrams(["the", "cat", "sat"])).toEqual([
      ["the", "cat"],
      ["cat", "sat"],
    ]);
  });

  it("returns empty array for single token", () => {
    expect(getBigrams(["the"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(getBigrams([])).toEqual([]);
  });

  it("includes punctuation in bigrams", () => {
    expect(getBigrams(["cat", ".", "the"])).toEqual([
      ["cat", "."],
      [".", "the"],
    ]);
  });
});

describe("buildBigramModel", () => {
  it("counts bigram occurrences", () => {
    const tokens = parseTokens("the cat sat. the cat mat.");
    const model = buildBigramModel(tokens);

    expect(model.getCount("the", "cat")).toBe(2);
    expect(model.getCount("cat", "sat")).toBe(1);
    expect(model.getCount("cat", "mat")).toBe(1);
    expect(model.getCount("the", "sat")).toBe(0);
  });

  it("reports successors correctly", () => {
    const tokens = parseTokens("the cat sat.");
    const model = buildBigramModel(tokens);

    expect(model.hasSuccessors("the")).toBe(true);
    expect(model.hasSuccessors("cat")).toBe(true);
    expect(model.hasSuccessors(".")).toBe(false);
  });

  it("handles empty tokens", () => {
    const model = buildBigramModel([]);
    expect(model.getCount("a", "b")).toBe(0);
    expect(model.hasSuccessors("a")).toBe(false);
  });
});
