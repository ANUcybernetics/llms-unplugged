import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASE,
  type Counts,
  get,
  mean,
  panelTable,
  rates,
  rng,
  ruleTable,
  STORY_PAIRS,
  thumbsUp,
  TRIALS,
} from "./utils/rewardsSim";

// The Rewards module trains copies of The magpie's nest with a rule card and
// a human panel, and makes claims about how fast each table drifts, what the
// leash prevents and what the thumbs-up round does. These tests replay the
// rounds as the page describes them, many times over with a seeded RNG, and
// check each claim against the averages.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const MODULE = read("src/content/modules/rewards.mdx");

function printedRow(word: string, total: number) {
  const line = MODULE.split("\n").find((l) => l.startsWith(`| \`${word}\``));
  expect(line, `table row for ${word}`).toBeDefined();
  expect(line).toContain(`| ${total} `);
  return Object.fromEntries(
    Array.from(line!.matchAll(/`(\S+)` (\d+)/g), ([, w, n]) => [w, Number(n)]),
  );
}

// A `the` row: what share of it goes to `magpie`.
function magpieShare(m: Counts) {
  const row = m.get("the")!;
  return get(m, "the", "magpie") / [...row.values()].reduce((a, b) => a + b, 0);
}

// The pleasing answers' share of the cup after this many votes, averaged.
function cupShare(votes: number, seed: number) {
  const r = rng(seed);
  return mean(Array.from({ length: TRIALS }, () => thumbsUp(r, votes, 1)));
}

describe("Rewards module", () => {
  it("prints The magpie's nest model as the story gives it", () => {
    for (const [word, row] of BASE) {
      if (row.size === 0) continue;
      const total = [...row.values()].reduce((a, b) => a + b, 0);
      expect(printedRow(word, total)).toEqual(Object.fromEntries(row));
    }
    expect(MODULE).toContain(`${STORY_PAIRS} pairs`);
  });

  it("the base model passes the rule card about a third of the time", () => {
    const { pass, garbled } = rates(() => BASE, 1);
    expect(pass).toBeGreaterThan(0.28);
    expect(pass).toBeLessThan(0.36);
    expect(MODULE).toContain("The base model gets about a third of its sentences past the check");
    // one in seven sentences is a garbled pass, like "It sits in the magpie sings."
    expect(garbled).toBeGreaterThan(1 / 8);
    expect(garbled).toBeLessThan(1 / 6);
  });

  it("three rounds on the rule card nearly double the pass rate, and the garbled passes with it", () => {
    const rule = rates((r) => ruleTable(r), 2);
    expect(rule.pass).toBeGreaterThan(0.58);
    expect(rule.pass).toBeLessThan(0.68);
    expect(MODULE).toContain("rule table's model gets nearly two-thirds of them past");
    expect(rule.garbled).toBeGreaterThan(0.25);
    expect(rule.garbled).toBeLessThan(0.33);
    expect(MODULE).toContain("from about one sentence in seven to more than one in four");
  });

  it("the panel table barely moves on the same three rounds", () => {
    const panel = rates((r) => panelTable(r), 3);
    expect(panel.pass).toBeLessThan(0.42);
    expect(panel.garbled).toBeLessThan(0.17);
    expect(MODULE).toContain("The panel table's model moves much less in the same three rounds");
  });

  it("the rule table's `the` row leans further toward magpie than the panel's", () => {
    const r = rng(4);
    const ruleShare: number[] = [];
    const panelShare: number[] = [];
    let ruleAhead = 0;
    for (let t = 0; t < TRIALS; t++) {
      const a = magpieShare(ruleTable(r));
      const b = magpieShare(panelTable(r));
      ruleShare.push(a);
      panelShare.push(b);
      ruleAhead += +(a > b);
    }
    expect(mean(ruleShare)).toBeGreaterThan(mean(panelShare));
    // usually, not always: the dice can still go the other way
    expect(ruleAhead / TRIALS).toBeGreaterThan(0.7);
  });

  it("without the leash, three rounds rub out about a quarter of the story's pairs", () => {
    const r = rng(5);
    const gone = Array.from({ length: TRIALS }, () => {
      const m = ruleTable(r, "off");
      return [...BASE].reduce(
        (s, [a, row]) => s + [...row.keys()].filter((b) => get(m, a, b) === 0).length,
        0,
      );
    });
    expect(STORY_PAIRS).toBe(49);
    expect(mean(gone) / STORY_PAIRS).toBeGreaterThan(0.18);
    expect(mean(gone) / STORY_PAIRS).toBeLessThan(0.3);
    expect(MODULE).toContain(
      "After three rounds about a quarter of the story's 49 pairs are typically gone",
    );

    const r2 = rng(6);
    for (let t = 0; t < 200; t++) {
      const m = ruleTable(r2, "on");
      for (const [a, row] of BASE)
        for (const b of row.keys()) expect(get(m, a, b)).toBeGreaterThan(0);
    }
  });

  it("the thumbs-up round fills the cup with pleasing answers, given voters who like them", () => {
    expect(cupShare(0, 7)).toBe(0.5);
    const eighteen = cupShare(18, 8);
    expect(eighteen).toBeGreaterThan(0.7);
    expect(eighteen).toBeLessThan(0.8);
    expect(cupShare(36, 9)).toBeGreaterThan(0.8);
    expect(MODULE).toContain(
      "after about eighteen votes `right`, `clever` and `kind` fill about three-quarters of the cup, up from half; by about thirty-six votes they fill more than four-fifths of it",
    );
  });
});
