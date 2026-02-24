import { describe, it, expect } from "vitest";
import { buildBigramModel, getVocabulary, parseTokens } from "../.vitepress/theme/utils/tokens";
import { manhattanDistance, buildDistanceMatrix } from "../.vitepress/theme/utils/distance";

function modelFrom(text: string) {
  const tokens = parseTokens(text);
  const vocabulary = getVocabulary(tokens);
  const model = buildBigramModel(tokens);
  return { tokens, vocabulary, model };
}

describe("manhattanDistance", () => {
  it("returns 0 for a word compared with itself", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    for (const word of vocabulary) {
      expect(manhattanDistance(model, vocabulary, word, word)).toBe(0);
    }
  });

  it("is symmetric", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    for (const a of vocabulary) {
      for (const b of vocabulary) {
        expect(manhattanDistance(model, vocabulary, a, b)).toBe(
          manhattanDistance(model, vocabulary, b, a),
        );
      }
    }
  });

  it("computes correct value for a known pair", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    const d = manhattanDistance(model, vocabulary, "cat", "mat");
    expect(d).toBe(2);
  });
});

describe("buildDistanceMatrix", () => {
  it("has zero diagonal", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    const matrix = buildDistanceMatrix(model, vocabulary);
    for (let i = 0; i < vocabulary.length; i++) {
      expect(matrix[i][i]).toBe(0);
    }
  });

  it("is symmetric", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    const matrix = buildDistanceMatrix(model, vocabulary);
    for (let i = 0; i < vocabulary.length; i++) {
      for (let j = 0; j < vocabulary.length; j++) {
        expect(matrix[i][j]).toBe(matrix[j][i]);
      }
    }
  });

  it("matches individual manhattanDistance calls", () => {
    const { vocabulary, model } = modelFrom("The cat sat on the mat.");
    const matrix = buildDistanceMatrix(model, vocabulary);
    for (let i = 0; i < vocabulary.length; i++) {
      for (let j = 0; j < vocabulary.length; j++) {
        expect(matrix[i][j]).toBe(
          manhattanDistance(model, vocabulary, vocabulary[i], vocabulary[j]),
        );
      }
    }
  });
});
