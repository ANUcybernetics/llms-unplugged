import { describe, it, expect } from "vitest";
import {
  tally,
  lmTable,
  lmGrid,
  lmGridAuto,
  parseTokens,
} from "../src/_utils/lm-utils.js";

describe("tally", () => {
  it("returns empty string for zero", () => {
    expect(tally(0)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(tally(null)).toBe("");
  });

  it("returns single marks for numbers less than 5", () => {
    expect(tally(1)).toBe("|");
    expect(tally(2)).toBe("||");
    expect(tally(3)).toBe("|||");
    expect(tally(4)).toBe("||||");
  });

  it("returns 卌 for 5", () => {
    expect(tally(5)).toBe("卌");
  });

  it("combines groups and remainder", () => {
    expect(tally(6)).toBe("卌 |");
    expect(tally(7)).toBe("卌 ||");
    expect(tally(10)).toBe("卌 卌");
    expect(tally(12)).toBe("卌 卌 ||");
  });
});

describe("parseTokens", () => {
  it("splits space-separated tokens", () => {
    expect(parseTokens("see spot run")).toEqual(["see", "spot", "run"]);
  });

  it("handles multiple spaces", () => {
    expect(parseTokens("see  spot   run")).toEqual(["see", "spot", "run"]);
  });

  it("trims whitespace", () => {
    expect(parseTokens("  see spot run  ")).toEqual(["see", "spot", "run"]);
  });

  it("handles punctuation as tokens", () => {
    expect(parseTokens("see spot . run ,")).toEqual([
      "see",
      "spot",
      ".",
      "run",
      ",",
    ]);
  });
});

describe("lmTable", () => {
  it("generates table HTML with headers", () => {
    const html = lmTable(["word 1", "word 2", "count"], [["see", "spot", 1]]);
    expect(html).toContain("<table");
    expect(html).toContain("word 1");
    expect(html).toContain("word 2");
    expect(html).toContain("count");
  });

  it("converts numeric values to tally marks", () => {
    const html = lmTable(["word 1", "word 2", "count"], [["see", "spot", 3]]);
    expect(html).toContain("|||");
  });

  it("preserves string values", () => {
    const html = lmTable(["from", "to"], [["see", "spot"]]);
    expect(html).toContain("see");
    expect(html).toContain("spot");
  });

  it("escapes HTML in values", () => {
    const html = lmTable(["header"], [["<script>"]]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("lmGrid", () => {
  it("generates grid HTML with code-formatted headers", () => {
    const html = lmGrid(
      ["", "see", "spot"],
      [
        ["see", 0, 1],
        ["spot", 1, 0],
      ],
    );
    expect(html).toContain("<table");
    expect(html).toContain("<code>see</code>");
    expect(html).toContain("<code>spot</code>");
  });

  it("converts numeric values to tally marks", () => {
    const html = lmGrid(["", "see"], [["see", 5]]);
    expect(html).toContain("卌");
  });

  it("leaves zero cells with nbsp for consistent height", () => {
    const html = lmGrid(["", "see"], [["see", 0]]);
    expect(html).toContain(
      '<td class="px-2 py-2 h-10 text-center font-mono">&nbsp;</td>',
    );
  });
});

describe("lmGridAuto", () => {
  it("generates bigram grid from token sequence", () => {
    const tokens = ["see", "spot", "run"];
    const html = lmGridAuto(tokens);
    expect(html).toContain("<table");
    expect(html).toContain("<code>see</code>");
    expect(html).toContain("<code>spot</code>");
    expect(html).toContain("<code>run</code>");
  });

  it("counts bigram occurrences correctly", () => {
    const tokens = ["see", "spot", "see", "spot"];
    const html = lmGridAuto(tokens);
    expect(html).toContain("||");
  });

  it("respects nrows option", () => {
    const tokens = ["a", "b", "c"];
    const html = lmGridAuto(tokens, { nrows: 2 });
    const rowMatches = html.match(/<tr class="border-b/g);
    expect(rowMatches.length).toBe(3);
  });

  it("respects ncols option", () => {
    const tokens = ["a", "b", "c", "d"];
    const html = lmGridAuto(tokens, { ncols: 3 });
    // ncols=3 means 3 columns total: 1 empty header + 2 token columns
    // Check that we have exactly 2 code tags in header row (first header is empty)
    const codeInHeaders = html.match(/<thead[^>]*>.*?<\/thead>/s)[0];
    const codeTags = codeInHeaders.match(/<code>/g) || [];
    expect(codeTags.length).toBe(2);
    // Should only have tokens a and b in headers, not c
    expect(codeInHeaders).toContain("<code>a</code>");
    expect(codeInHeaders).toContain("<code>b</code>");
    expect(codeInHeaders).not.toContain("<code>c</code>");
  });

  it("handles the basic training example correctly", () => {
    const tokens = [
      "see",
      "spot",
      "run",
      ".",
      "see",
      "spot",
      "jump",
      ".",
      "run",
      ",",
      "spot",
      ",",
      "run",
      ".",
      "jump",
      ",",
      "spot",
      ",",
      "jump",
      ".",
    ];
    const html = lmGridAuto(tokens);
    expect(html).toContain("<code>see</code>");
    expect(html).toContain("<code>spot</code>");
    expect(html).toContain("<code>run</code>");
    expect(html).toContain("<code>.</code>");
    expect(html).toContain("<code>jump</code>");
    expect(html).toContain("<code>,</code>");
  });
});
