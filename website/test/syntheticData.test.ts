import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Counts, differentWords, nextModel, slip, START, writable } from "../src/lib/relay";
import { copy } from "../src/lib/rewards";
import { BASE, rng, STORY } from "./utils/rewardsSim";

// The Synthetic Data module runs a relay from The magpie's nest, a twenty-word
// slip per round, by hand for a few rounds and then on RelayWidget, which can
// also keep the story in. These tests run both kinds of chain many times, as the
// page describes them, and check the numbers and claims it prints.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const MODULE = read("src/content/modules/synthetic-data.mdx");

const ROUNDS = 20;
const TRIALS = 4000;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const rowTotal = (m: Counts, w: string) => [...m.get(w)!.values()].reduce((a, b) => a + b, 0);

// Each chain's slips, round by round.
function chains(keep: boolean, seed: number) {
  const r = rng(seed);
  const slips = Array.from({ length: TRIALS }, () => {
    let model = copy(BASE);
    return Array.from({ length: ROUNDS }, () => {
      const text = slip(model, r);
      model = nextModel(model, text, keep);
      return text;
    });
  });
  // the average count of different words on the slips of round n + 1
  const at = (n: number) => mean(slips.map((chain) => differentWords(chain[n])));
  return { slips, at };
}

const relay = chains(false, 21);
const kept = chains(true, 22);

describe("Synthetic Data module", () => {
  it("prints the typical counts the simulated chains give", () => {
    expect(writable(BASE).size).toBe(32);
    expect(MODULE).toMatch(/^\| the story's model \| 32 +\|$/m);
    const rows = [...MODULE.matchAll(/^\| ([1-4]) +\| (\d+) +\|$/gm)];
    expect(rows.map((m) => m[1])).toEqual(["1", "2", "3", "4"]);
    rows.forEach((m, n) => {
      expect(Math.abs(Number(m[2]) - relay.at(n)), `different words in round ${m[1]}`).toBeLessThan(
        1,
      );
    });
  });

  it("the biggest drop is the first, leaving out almost two-thirds of the words", () => {
    const steps = [32, ...Array.from({ length: 4 }, (_, n) => relay.at(n))];
    const drops = steps.slice(1).map((n, i) => steps[i] - n);
    expect(drops[0]).toBe(Math.max(...drops));
    const leftOut = 1 - relay.at(0) / 32;
    expect(leftOut).toBeGreaterThan(0.6);
    expect(leftOut).toBeLessThan(0.67);
    expect(MODULE).toContain(
      "a twenty-word slip from a 32-word model leaves out almost two-thirds of them",
    );
  });

  it("a word missing from one slip can't turn up on a later one", () => {
    for (const chain of relay.slips) {
      for (let n = 1; n < ROUNDS; n++) {
        const before = new Set(chain[n - 1]);
        for (const w of chain[n]) expect(before.has(w), `${w} in round ${n + 1}`).toBe(true);
      }
    }
    expect(MODULE).toContain("a word missing from one slip can't turn up on a later one");
  });

  it("the words lost first appeared once in the story", () => {
    const counts = new Map<string, number>();
    for (const w of STORY) counts.set(w, (counts.get(w) ?? 0) + 1);
    for (const w of ["worm", "sun", "warbles"]) {
      expect(counts.get(w), w).toBe(1);
      const missing = relay.slips.filter((chain) => !chain[0].includes(w)).length;
      expect(missing / TRIALS, w).toBeGreaterThan(0.5);
    }
    expect(MODULE).toContain("like `worm`, `sun` and `warbles`, appeared once in the story");
  });

  it("after ten rounds on the widget a chain is down to five or six different words", () => {
    expect(relay.at(9)).toBeGreaterThan(5);
    expect(relay.at(9)).toBeLessThan(6.2);
    expect(MODULE).toContain(
      "After ten rounds a chain is typically down to five or six different words",
    );
  });

  it("keeping the story holds a slip at eleven or twelve different words and loses none", () => {
    for (const n of [0, 9, ROUNDS - 1]) {
      expect(kept.at(n)).toBeGreaterThan(11);
      expect(kept.at(n)).toBeLessThan(12);
    }
    const r = rng(23);
    let model = copy(BASE);
    for (let n = 0; n < ROUNDS; n++) model = nextModel(model, slip(model, r), true);
    expect(writable(model).size).toBe(32);
    expect(MODULE).toContain(
      "a slip still has eleven or twelve different words on it, and every one of the story's 32 stays on the sheet",
    );
  });

  it("a fresh grid's rows fit a d20, and the kept sheet's big rows pass 20 but fit a d20 and a d6", () => {
    const r = rng(24);
    let pastAfterTwo = 0;
    const sheets = 500;
    for (let t = 0; t < sheets; t++) {
      let fresh = copy(BASE);
      let sheet = copy(BASE);
      for (let n = 0; n < 4; n++) {
        fresh = nextModel(fresh, slip(fresh, r), false);
        for (const w of fresh.keys()) expect(rowTotal(fresh, w), w).toBeLessThanOrEqual(20);
        sheet = nextModel(sheet, slip(sheet, r), true);
        if (n === 1) pastAfterTwo += +[START, "the"].every((w) => rowTotal(sheet, w) > 20);
      }
      for (const w of sheet.keys()) expect(rowTotal(sheet, w), w).toBeLessThanOrEqual(60);
    }
    expect(pastAfterTwo / sheets).toBeGreaterThan(0.9);
    expect(MODULE).toContain("The sheet's `.` and `the` rows pass 20 after a round or two");
    expect(MODULE).toContain("on 1 or 2 add nothing, on 3 or 4 add 20, on 5 or 6 add 40");
  });
});
