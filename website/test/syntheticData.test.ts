import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Counts, differentWords, nextModel, slip, START, writable } from "../src/lib/relay";
import { copy } from "../src/lib/rewards";
import { BASE, rng, STORY } from "./utils/rewardsSim";

// The Synthetic Data module runs a relay from The magpie's nest, twenty words
// per link, by hand for a few links and then on RelayWidget, which can also
// keep the story in. These tests run both kinds of chain many times, as the
// page describes them, and check the numbers and claims it prints.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const MODULE = read("src/content/modules/synthetic-data.mdx");

const LINKS = 20;
const TRIALS = 4000;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const rowTotal = (m: Counts, w: string) => [...m.get(w)!.values()].reduce((a, b) => a + b, 0);

// Each chain's count of different words at every link.
function chains(keep: boolean, seed: number) {
  const r = rng(seed);
  const missingAtA = new Map<string, number>();
  const counts = Array.from({ length: TRIALS }, () => {
    let model = copy(BASE);
    return Array.from({ length: LINKS }, (_, link) => {
      const text = slip(model, r);
      if (link === 0) {
        for (const w of new Set(STORY)) {
          if (!text.includes(w)) missingAtA.set(w, (missingAtA.get(w) ?? 0) + 1);
        }
      }
      model = nextModel(model, text, keep);
      return differentWords(text);
    });
  });
  return { counts, at: (link: number) => mean(counts.map((c) => c[link])), missingAtA };
}

const relay = chains(false, 21);
const kept = chains(true, 22);

describe("Synthetic Data module", () => {
  it("prints the typical counts the simulated chains give", () => {
    expect(writable(BASE).size).toBe(32);
    expect(MODULE).toMatch(/^\| the story's model \| 32 +\|$/m);
    const rows = [...MODULE.matchAll(/^\| ([A-D]) +\| (\d+) +\|$/gm)];
    expect(rows.map((m) => m[1])).toEqual(["A", "B", "C", "D"]);
    rows.forEach((m, link) => {
      expect(Math.abs(Number(m[2]) - relay.at(link)), `different words at ${m[1]}`).toBeLessThan(1);
    });
  });

  it("the biggest drop is the first, leaving out almost two-thirds of the words", () => {
    const steps = [32, ...Array.from({ length: 4 }, (_, link) => relay.at(link))];
    const drops = steps.slice(1).map((n, i) => steps[i] - n);
    expect(drops[0]).toBe(Math.max(...drops));
    const leftOut = 1 - relay.at(0) / 32;
    expect(leftOut).toBeGreaterThan(0.6);
    expect(leftOut).toBeLessThan(0.67);
    expect(MODULE).toContain(
      "a twenty-word slip from a 32-word model leaves out almost two-thirds of them",
    );
  });

  it("a chain's count stalls but doesn't climb back", () => {
    let rises = 0;
    let stalls = 0;
    for (const c of relay.counts) {
      for (let link = 1; link < 4; link++) {
        rises += +(c[link] > c[link - 1]);
        stalls += +(c[link] === c[link - 1]);
      }
    }
    // the one way up: a slip with no `.` on it, then a dead end that writes one
    expect(rises / (TRIALS * 3)).toBeLessThan(0.005);
    expect(stalls / (TRIALS * 3)).toBeGreaterThan(0.1);
    expect(MODULE).toContain("a chain's count can stall, but it doesn't climb back");
  });

  it("the words lost first appeared once in the story", () => {
    const counts = new Map<string, number>();
    for (const w of STORY) counts.set(w, (counts.get(w) ?? 0) + 1);
    for (const w of ["worm", "sun", "warbles"]) {
      expect(counts.get(w), w).toBe(1);
      expect(relay.missingAtA.get(w)! / TRIALS, w).toBeGreaterThan(0.5);
    }
    expect(MODULE).toContain("like `worm`, `sun` and `warbles`, appeared once in the story");
  });

  it("after ten links on the widget a chain is down to five or six different words", () => {
    expect(relay.at(9)).toBeGreaterThan(5);
    expect(relay.at(9)).toBeLessThan(6.2);
    expect(MODULE).toContain(
      "After ten links a chain is typically down to five or six different words",
    );
  });

  it("keeping the story holds a slip at about twelve different words and loses none", () => {
    for (const link of [0, 9, LINKS - 1]) {
      expect(kept.at(link)).toBeGreaterThan(11);
      expect(kept.at(link)).toBeLessThan(12.5);
    }
    const r = rng(23);
    let model = copy(BASE);
    for (let link = 0; link < LINKS; link++) model = nextModel(model, slip(model, r), true);
    expect(writable(model).size).toBe(32);
    expect(MODULE).toContain(
      "a slip has about twelve different words on it, and every one of the story's 32 stays on the sheet",
    );
  });

  it("a fresh grid's rows fit a d20, and the kept sheet's big rows pass 20 but fit a d20 and a d6", () => {
    const r = rng(24);
    let pastAfterB = 0;
    const sheets = 500;
    for (let t = 0; t < sheets; t++) {
      let fresh = copy(BASE);
      let sheet = copy(BASE);
      for (let link = 0; link < 4; link++) {
        fresh = nextModel(fresh, slip(fresh, r), false);
        for (const w of fresh.keys()) expect(rowTotal(fresh, w), w).toBeLessThanOrEqual(20);
        sheet = nextModel(sheet, slip(sheet, r), true);
        if (link === 1) pastAfterB += +[START, "the"].every((w) => rowTotal(sheet, w) > 20);
      }
      for (const w of sheet.keys()) expect(rowTotal(sheet, w), w).toBeLessThanOrEqual(60);
    }
    expect(pastAfterB / sheets).toBeGreaterThan(0.9);
    expect(MODULE).toContain("The sheet's `.` and `the` rows pass 20 after a link or two");
    expect(MODULE).toContain("on 1 or 2 add nothing, on 3 or 4 add 20, on 5 or 6 add 40");
  });
});
