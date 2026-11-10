import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../src/lib/tokens";
import { pick, rng } from "./utils/rewardsSim";

// The Synthetic Data module runs a replace chain and an accumulate chain from
// The magpie's nest, forty words per link, and prints typical counts for
// each. These tests run both chains many times, as the page describes them,
// and check the table and the claims around it.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const MODULE = read("src/content/modules/synthetic-data.mdx");
const STORY = parseTokens(read("../data/originals/the-magpies-nest.txt").split("---")[2]);

type Counts = Map<string, Map<string, number>>;
const WORDS_PER_LINK = 40;
const LINKS = 4;
const TRIALS = 4000;

const train = (tokens: string[]): Counts => buildBigramModel(tokens).counts;

function tallyInto(sheet: Counts, tokens: string[]) {
  for (let i = 0; i + 1 < tokens.length; i++) {
    const row = sheet.get(tokens[i]) ?? new Map<string, number>();
    row.set(tokens[i + 1], (row.get(tokens[i + 1]) ?? 0) + 1);
    sheet.set(tokens[i], row);
  }
}

// Forty words from `.`; a word with nothing after it means write `.` and carry on.
function generate(m: Counts, r: () => number): string[] {
  const out: string[] = [];
  let w = ".";
  while (out.length < WORDS_PER_LINK) {
    w = pick(m.get(w) ?? new Map(), r) ?? ".";
    out.push(w);
  }
  return out;
}

const knows = (m: Counts) =>
  [...m.values()].filter((row) => [...row.values()].some((n) => n > 0)).length;
const used = (text: string[]) => new Set(text).size;

const average = (xs: { knows: number; used: number }[]) =>
  xs.map(({ knows: k, used: u }) => [k / TRIALS, u / TRIALS]);

function chains() {
  const r = rng(21);
  const replace = Array.from({ length: LINKS }, () => ({ knows: 0, used: 0 }));
  const accumulate = Array.from({ length: LINKS }, () => ({ knows: 0, used: 0 }));
  const missingAtA = new Map<string, number>();

  for (let t = 0; t < TRIALS; t++) {
    let model = train(STORY);
    for (let link = 0; link < LINKS; link++) {
      const text = generate(model, r);
      replace[link].knows += knows(model);
      replace[link].used += used(text);
      if (link === 0) {
        for (const w of new Set(STORY)) {
          if (!text.includes(w)) missingAtA.set(w, (missingAtA.get(w) ?? 0) + 1);
        }
      }
      model = train(text);
    }

    const sheet = train(STORY);
    for (let link = 0; link < LINKS; link++) {
      const text = generate(sheet, r);
      accumulate[link].knows += knows(sheet);
      accumulate[link].used += used(text);
      tallyInto(sheet, [".", ...text]);
    }
  }

  return { replace: average(replace), accumulate: average(accumulate), missingAtA };
}

const { replace, accumulate, missingAtA } = chains();

describe("Synthetic Data module", () => {
  it("prints the typical counts the simulated chains give", () => {
    const rows = [...MODULE.matchAll(/^\| ([A-D]) +\| (\d+) +\| (\d+) +\| (\d+) +\| (\d+) +\|$/gm)];
    expect(rows.map((m) => m[1])).toEqual(["A", "B", "C", "D"]);
    rows.forEach((m, link) => {
      const [rk, ru, ak, au] = m.slice(2).map(Number);
      expect(Math.abs(rk - replace[link][0]), `replace knows at ${m[1]}`).toBeLessThan(1);
      expect(Math.abs(ru - replace[link][1]), `replace used at ${m[1]}`).toBeLessThan(1);
      expect(Math.abs(ak - accumulate[link][0]), `accumulate knows at ${m[1]}`).toBeLessThan(1);
      expect(Math.abs(au - accumulate[link][1]), `accumulate used at ${m[1]}`).toBeLessThan(1);
    });
  });

  it("the replace chain's biggest drop is the first, leaving out almost half the words", () => {
    const drops = replace.slice(1).map(([k], i) => replace[i][0] - k);
    expect(drops[0]).toBe(Math.max(...drops));
    const leftOut = 1 - replace[0][1] / new Set(STORY).size;
    expect(leftOut).toBeGreaterThan(0.4);
    expect(leftOut).toBeLessThan(0.5);
    expect(MODULE).toContain(
      "a forty-word sample of a 32-word model leaves out almost half of them",
    );
  });

  it("the accumulate chain never loses a word and barely changes the words it uses", () => {
    for (const [k] of accumulate) expect(k).toBe(new Set(STORY).size);
    expect(accumulate[0][1] - accumulate.at(-1)![1]).toBeLessThan(2);
  });

  it("the words lost first appeared once in the story", () => {
    const counts = new Map<string, number>();
    for (const w of STORY) counts.set(w, (counts.get(w) ?? 0) + 1);
    for (const w of ["worm", "sun", "warbles"]) {
      expect(counts.get(w), w).toBe(1);
      expect(missingAtA.get(w)! / TRIALS, w).toBeGreaterThan(0.5);
    }
    expect(MODULE).toContain("like `worm`, `sun` and `warbles`, appeared once in the story");
  });
});
