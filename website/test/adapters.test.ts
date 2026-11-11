import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  countsFromText,
  generateSentence,
  mergedRow,
  optionForRoll,
  rowTotal,
  type Sheet,
  stripFrontmatter,
} from "../src/lib/adapters";
import { rng } from "./utils/rewardsSim";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const magpie = countsFromText(read("../data/originals/the-magpies-nest.txt"));
const kookaburra = countsFromText(read("../data/originals/the-kookaburra-and-the-possum.txt"));

const sheets = (adapterStrength: number, baseStrength = 1): Sheet[] => [
  { counts: magpie, strength: baseStrength },
  { counts: kookaburra, strength: adapterStrength },
];

const asCounts = (row: ReturnType<typeof mergedRow>) =>
  Object.fromEntries(row.map((o) => [o.word, o.total]));

describe("adapter sheets", () => {
  it("strips a corpus file's frontmatter", () => {
    expect(stripFrontmatter("---\ntitle: x\n---\n\nThe cat.")).toBe("\nThe cat.");
    expect(stripFrontmatter("The cat.")).toBe("The cat.");
  });

  it("merges the `the` row as the page prints it, at full strength and three times", () => {
    expect(asCounts(mergedRow(sheets(1), "the"))).toEqual({
      magpie: 6,
      nest: 5,
      tree: 5,
      kookaburra: 4,
      cat: 2,
      possum: 2,
      rain: 2,
      sun: 1,
    });
    const tripled = mergedRow(sheets(3), "the");
    expect(rowTotal(tripled)).toBe(47);
    expect(asCounts(tripled)).toMatchObject({ kookaburra: 12, tree: 11, nest: 7, possum: 6 });
  });

  it("keeps each sheet's share apart, and gives the base back with the adapter off", () => {
    const tree = mergedRow(sheets(3), "the").find((o) => o.word === "tree")!;
    expect(tree.parts).toEqual([2, 9]);
    expect(mergedRow(sheets(0), "the").map((o) => o.word)).not.toContain("kookaburra");
    expect(asCounts(mergedRow(sheets(0), "the"))).toEqual(
      asCounts(mergedRow([sheets(0)[0]], "the")),
    );
  });

  it("numbers the options 1 to the row total without gaps", () => {
    const row = mergedRow(sheets(3), "the");
    for (let roll = 1; roll <= rowTotal(row); roll++) {
      expect(optionForRoll(row, roll), `roll ${roll}`).toBeDefined();
    }
    expect(optionForRoll(row, 0)).toBeUndefined();
    expect(optionForRoll(row, rowTotal(row) + 1)).toBeUndefined();
  });

  it("generates sentences from `.` that stop at a sentence end or the word cap", () => {
    const r = rng(3);
    for (let i = 0; i < 200; i++) {
      const steps = generateSentence(sheets(3), r, 20);
      expect(steps[0].from).toBe(".");
      if (steps.length < 20) expect([".", "!"]).toContain(steps.at(-1)!.next);
      for (const [j, s] of steps.entries()) {
        if (j > 0) expect(s.from).toBe(steps[j - 1].next);
        expect(s.row.find((o) => o.word === s.next)).toBeDefined();
      }
    }
  });

  it("turning the adapter up brings the new animals in more often", () => {
    const r = rng(5);
    const rate = (k: number) => {
      let hits = 0;
      for (let i = 0; i < 2000; i++) {
        const words = generateSentence(sheets(k), r).map((s) => s.next);
        hits += +words.some((w) => w === "kookaburra" || w === "possum");
      }
      return hits / 2000;
    };
    const [off, one, nine] = [0, 1, 9].map(rate);
    expect(off).toBe(0);
    expect(one).toBeGreaterThan(0);
    expect(nine).toBeGreaterThan(one);
  });
});
