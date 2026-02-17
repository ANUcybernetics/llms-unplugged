import { describe, it, expect } from "vitest";
import { parseTokens } from "../.vitepress/theme/utils/tokens";

describe("parseTokens", () => {
  it("lowercases and strips quotes", () => {
    const tokens = parseTokens("'Hello,' she said. ''BEST''");
    expect(tokens).toEqual(["hello", ",", "she", "said", ".", "best"]);
  });

  it("preserves allowlisted pronoun casing", () => {
    const tokens = parseTokens("I think I'm fine and i've said so.");
    expect(tokens).toEqual(["I", "think", "I'm", "fine", "and", "I've", "said", "so", "."]);
  });

  it("filters numbers and roman numerals", () => {
    const tokens = parseTokens("Chapter IV is 123good and Section3 is fine.");
    expect(tokens).toEqual(["chapter", "is", "good", "and", "section", "is", "fine", "."]);
  });

  it("handles contractions and possessives", () => {
    const tokens = parseTokens("The bird's nest and the birds' nests. goin' on");
    expect(tokens).toEqual([
      "the",
      "bird's",
      "nest",
      "and",
      "the",
      "birds'",
      "nests",
      ".",
      "goin'",
      "on",
    ]);
  });

  it("only keeps configured punctuation as tokens", () => {
    const tokens = parseTokens("Hello, world. How are you?");
    expect(tokens).toEqual(["hello", ",", "world", ".", "how", "are", "you"]);
    expect(tokens).not.toContain("?");
  });

  it("normalizes curly apostrophes", () => {
    const tokens = parseTokens("don\u2019t won\u2018t");
    expect(tokens).toEqual(["don't", "won't"]);
  });
});
