import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Every deck carries the ANU feedback survey slide (shown only under ?anu),
// either directly or through the denouement partial.

const decksDir = join(import.meta.dirname, "../src/decks");
const decks = readdirSync(decksDir).filter((f) => f.endsWith(".deck.mdx"));

describe("ANU feedback survey slide", () => {
  it("finds the decks", () => {
    expect(decks.length).toBeGreaterThan(0);
  });

  it.each(decks)("%s includes the qualtrics partial", (deck) => {
    const source = readFileSync(join(decksDir, deck), "utf8");
    expect(source).toMatch(/@include \.\/partials\/(qualtrics|denouement)\.mdx/);
  });
});
