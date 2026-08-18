import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOKEN_COLOR_COUNT, tokenColorClass, tokenColorIndex } from "../src/lib/tokenColors";

// The token colour palette lives in three places that must agree:
// src/lib/tokenColors.ts (TOKEN_COLOR_COUNT + hash), src/decks/theme.css
// (.tc-N class rules), and cli/cutout-common.typ (checked CLI-side).

describe("token colour palette sync", () => {
  it("theme.css defines a .tc-N rule for every palette index", () => {
    const css = readFileSync(join(process.cwd(), "src/decks/theme.css"), "utf-8");
    const classes = new Set(css.match(/\.tc-\d+(?=\s*\{)/g) ?? []);
    expect(classes.size).toBe(TOKEN_COLOR_COUNT);
    for (let i = 0; i < TOKEN_COLOR_COUNT; i++) {
      expect(classes.has(`.tc-${i}`), `theme.css is missing .tc-${i}`).toBe(true);
    }
  });

  // Pinned literals: if these change, slides no longer match the printed
  // cutouts (the typst `entry-for` hash is the ground truth).
  it("hashes fixture words to stable palette indices", () => {
    // Verified against a rendered cutouts PDF: "the" purple, "." red,
    // "and" green, "to" magenta.
    expect(tokenColorIndex("the")).toBe(6);
    expect(tokenColorIndex(".")).toBe(2);
    expect(tokenColorIndex("and")).toBe(4);
    expect(tokenColorIndex("to")).toBe(7);
    expect(tokenColorClass("the")).toBe("tc-6");
    expect(tokenColorClass(".")).toBe("tc-2");
  });

  // The four punctuation marks land in distinct buckets — the hash salt is
  // tuned for it, because a room telling "." from "," by colour is the whole
  // point of the palette.
  it("keeps the four punctuation marks on distinct colours", () => {
    const marks = [".", ",", "?", "!"].map(tokenColorIndex);
    expect(new Set(marks).size).toBe(4);
  });
});
