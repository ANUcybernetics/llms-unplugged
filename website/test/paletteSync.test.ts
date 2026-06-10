import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOKEN_COLOR_COUNT, tokenColorClass, tokenColorIndex } from "../src/lib/tokenColors";

// The token colour palette lives in three places that must agree:
// src/lib/tokenColors.ts (TOKEN_COLOR_COUNT + hash), src/decks/theme.css
// (.tc-N class rules), and cli/tokenized-cutouts.typ (checked CLI-side).

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
    expect(tokenColorIndex("the")).toBe(1);
    expect(tokenColorIndex(".")).toBe(17);
    expect(tokenColorClass("the")).toBe("tc-1");
    expect(tokenColorClass(".")).toBe("tc-17");
  });
});
