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
  ruleRounds,
  ruleTable,
  slips,
  STORY_PAIRS,
  thumbsUp,
  thumbsUpCup,
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

// Did the passes fail to climb from round one to round three, summed over these tables?
function stalls(xs: number[][]) {
  const sum = (i: number) => xs.reduce((s, p) => s + p[i], 0);
  return sum(2) <= sum(0);
}

describe("Rewards module", () => {
  it("gives the widget the story from the corpus file", () => {
    const quoted = MODULE.match(/^export const MAGPIE =\s*("(?:[^"\\]|\\.)*")/m)![1];
    const story = read("../data/originals/the-magpies-nest.txt").split("---")[2].trim();
    expect(JSON.parse(quoted)).toBe(story);
  });

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

  it("ten rounds on the widget take the rule table most of the way", () => {
    const ten = rates((r) => ruleTable(r, "on", 10), 14);
    expect(ten.pass).toBeGreaterThan(0.84);
    expect(ten.pass).toBeLessThan(0.9);
    expect(ten.garbled / ten.pass).toBeGreaterThan(0.4);
    expect(ten.garbled / ten.pass).toBeLessThan(0.5);
    const r = rng(15);
    const share = mean(Array.from({ length: TRIALS }, () => magpieShare(ruleTable(r, "on", 10))));
    expect(share).toBeGreaterThan(0.85);
    expect(share).toBeLessThan(0.92);
    expect(MODULE).toContain(
      "By ten rounds about nine sentences in ten pass, `magpie` fills about nine-tenths of the `the` row, and nearly half the passes are garbled",
    );
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

  it("the rule table's `the` row ends up about two-thirds magpie, from about a third", () => {
    const r = rng(10);
    const share = mean(Array.from({ length: TRIALS }, () => magpieShare(ruleTable(r))));
    expect(magpieShare(BASE)).toBeGreaterThan(0.3);
    expect(magpieShare(BASE)).toBeLessThan(0.4);
    expect(share).toBeGreaterThan(0.6);
    expect(share).toBeLessThan(0.72);
    expect(MODULE).toContain(
      "typically `magpie` is about two-thirds of the row by now, where it started at about a third",
    );
  });

  it("the rule table's passes climb from one or two of five to two or three", () => {
    const r = rng(11);
    const logs = Array.from({ length: TRIALS }, () => ruleRounds(r).passed);
    const first = mean(logs.map((p) => p[0]));
    const third = mean(logs.map((p) => p[2]));
    expect(first).toBeGreaterThan(1.3);
    expect(first).toBeLessThan(1.9);
    expect(third).toBeGreaterThan(2.4);
    expect(third).toBeLessThan(3);
    expect(MODULE).toContain(
      "usually one or two of the five in the first round and two or three in the third",
    );
    // one table's count stalls or dips about a third of the time; three
    // tables' counts added together do so about half as often
    const alone = logs.filter((p) => stalls([p])).length / TRIALS;
    const threes = Array.from({ length: Math.floor(TRIALS / 3) }, (_, i) =>
      logs.slice(3 * i, 3 * i + 3),
    );
    const together = threes.filter(stalls).length / threes.length;
    expect(alone).toBeGreaterThan(0.25);
    expect(together).toBeLessThan(0.2);
    expect(MODULE).toContain("One table's count can stall or dip");
  });

  it("a d6 with the d20 covers every row the rule table grows", () => {
    const r = rng(12);
    let past20 = 0;
    for (let t = 0; t < TRIALS; t++) {
      const totals = Array.from(ruleTable(r).values(), (row) =>
        [...row.values()].reduce((a, b) => a + b, 0),
      );
      past20 += +(Math.max(...totals) > 20);
      expect(Math.max(...totals)).toBeLessThanOrEqual(60);
    }
    // not a rare case: a fair share of tables finish with a row past the d20
    expect(past20 / TRIALS).toBeGreaterThan(0.1);
    expect(MODULE).toContain(
      "If a row grows past 20, roll the d6 with the d20: on 1 or 2 add nothing, on 3 or 4 add 20, on 5 or 6 add 40",
    );
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
    // three votes each for a group of six, and the slips that takes
    const r = rng(13);
    const sizes = Array.from({ length: TRIALS }, () => slips(thumbsUpCup(r, 18)));
    expect(sizes.filter((n) => n <= 25).length / TRIALS).toBeGreaterThan(0.99);
    expect(MODULE).toContain("about twenty-five small slips of paper for each group of six");
    expect(MODULE).toContain("A group of six has cast eighteen votes.");
    expect(MODULE).toContain(
      "after about eighteen votes `right`, `clever` and `kind` fill about three-quarters of the cup, up from half; by about thirty-six votes they fill more than four-fifths of it",
    );
  });
});
