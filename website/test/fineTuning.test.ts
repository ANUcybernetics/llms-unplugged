import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../src/lib/tokens";

// The Fine-tuning and LoRA module fine-tunes the model of The magpie's nest on
// The owl and the moon, and makes claims about the combined rows, the scaled
// adapter, the strip pairs and the sentences each version can write. These
// tests rebuild both models with the CLI-matching tokeniser and check every
// one of those claims against the page.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const storyTokens = (path: string) => parseTokens(read(path).split("---")[2]);

const MODULE = read("src/content/modules/fine-tuning.mdx");
const baseTokens = storyTokens("../data/originals/the-magpies-nest.txt");
const owlTokens = storyTokens("../data/originals/the-owl-and-the-moon.txt");

type Counts = Map<string, Map<string, number>>;
type Strips = { when: Record<string, number>; what: Record<string, number> };

const toCounts = (tokens: string[]): Counts => buildBigramModel(tokens).counts;
const base = toCounts(baseTokens);
const adapter = toCounts(owlTokens);

function get(counts: Counts, from: string, to: string): number {
  return counts.get(from)?.get(to) ?? 0;
}

function addInto(target: Counts, from: string, to: string, n: number) {
  if (n === 0) return;
  const row = target.get(from) ?? new Map<string, number>();
  row.set(to, (row.get(to) ?? 0) + n);
  target.set(from, row);
}

function combine(...layers: [Counts, number][]): Counts {
  const out: Counts = new Map();
  for (const [counts, scale] of layers) {
    for (const [from, row] of counts) {
      for (const [to, n] of row) addInto(out, from, to, n * scale);
    }
  }
  return out;
}

function fromStrips(pairs: Strips[]): Counts {
  const out: Counts = new Map();
  for (const { when, what } of pairs) {
    for (const [from, w] of Object.entries(when)) {
      for (const [to, v] of Object.entries(what)) addInto(out, from, to, w * v);
    }
  }
  return out;
}

const rowOf = (counts: Counts, word: string): Record<string, number> =>
  Object.fromEntries([...(counts.get(word) ?? new Map())].filter(([, n]) => n > 0));

// "The owl sits in the nest." -> the owl sits in the nest . (the sentence-start
// "The" is the same token as "the", as in Training).
const sentence = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.!]/g, " $&")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w === "it" ? "It" : w));

const canWrite = (counts: Counts, words: string[]) =>
  words.slice(1).every((w, i) => get(counts, words[i], w) > 0);

const contains = (tokens: string[], words: string[]) =>
  ` ${tokens.join(" ")} `.includes(` ${words.join(" ")} `);

function printedRow(word: string, total: number) {
  const line = MODULE.split("\n").find((l) => l.startsWith(`| \`${word}\` | ${total} `));
  expect(line, `table row for ${word} with total ${total}`).toBeDefined();
  return Object.fromEntries(
    Array.from(line!.matchAll(/`(\S+)` (\d+)/g), ([, w, n]) => [w, Number(n)]),
  );
}

const pairA: Strips = { when: { the: 1 }, what: { owl: 4, moon: 2 } };
const pairB: Strips = {
  when: { owl: 1, moon: 1 },
  what: { flies: 1, sits: 1, sings: 1, sleeps: 1, sets: 1 },
};

describe("Fine-tuning and LoRA module", () => {
  it("prints the base model's `the` row", () => {
    expect(printedRow("the", 17)).toEqual(rowOf(base, "the"));
  });

  it("fine-tuning in place gives the printed `the`, `owl` and `moon` rows", () => {
    const tuned = combine([base, 1], [adapter, 1]);
    expect(printedRow("the", 25)).toEqual(rowOf(tuned, "the"));
    expect(rowOf(tuned, "owl")).toEqual({ flies: 1, sits: 1, sings: 1, sleeps: 1 });
    expect(rowOf(tuned, "moon")).toEqual({ ".": 1, sets: 1 });
  });

  it("the adapter at three times gives the claimed `the` row", () => {
    const scaled = rowOf(combine([base, 1], [adapter, 3]), "the");
    const claim = MODULE.match(/the `the` row becomes (.+?) \((\d+) in total\)/)!;
    const printed = Object.fromEntries(
      Array.from(claim[1].matchAll(/`(\S+)` (\d+)/g), ([, w, n]) => [w, Number(n)]),
    );
    expect(printed).toEqual(scaled);
    expect(Number(claim[2])).toBe(Object.values(scaled).reduce((a, b) => a + b, 0));
  });

  it("the base already has every adapter tally the strips leave out", () => {
    const listed = MODULE.match(/the magpie's grid already has (.+?)\. What's actually new/s)![1];
    const pairs = Array.from(listed.matchAll(/`(\S+) → (\S+)`/g), ([, a, b]) => [a, b]);
    expect(pairs).toHaveLength(10);
    for (const [from, to] of pairs)
      expect(get(base, from, to), `${from} → ${to}`).toBeGreaterThan(0);

    const covered = new Set(["the owl", "the moon"]);
    for (const [from, row] of adapter) {
      for (const [to] of row) {
        const key = `${from} ${to}`;
        const inStrips = covered.has(key) || from === "owl" || from === "moon";
        if (!inStrips) expect(pairs.map((p) => p.join(" "))).toContain(key);
      }
    }
  });

  it("pair A reproduces the adapter's `the` row exactly, pair B blends owl and moon", () => {
    const strips = fromStrips([pairA, pairB]);
    expect(rowOf(strips, "the")).toEqual({
      owl: get(adapter, "the", "owl"),
      moon: get(adapter, "the", "moon"),
    });
    expect(rowOf(strips, "owl")).toEqual(pairB.what);
    expect(rowOf(strips, "moon")).toEqual(pairB.what);
    expect(get(strips, "owl", "sets")).toBe(1);
    expect(get(adapter, "owl", "sets")).toBe(0);
    expect(get(strips, "moon", ".")).toBe(0);
    expect(get(adapter, "moon", ".")).toBe(1);
  });

  it("counts the sheet, the strips and their non-zero numbers as claimed", () => {
    const vocab = new Set([...baseTokens, ...owlTokens]);
    expect(vocab.size).toBe(34);
    expect(MODULE).toContain("34 words down the side and 34 along the top, which is 1,156 cells");
    expect(MODULE).toContain("four strips of 34, so 136 numbers, and only ten of them aren't zero");
    const nonZero = [pairA, pairB].flatMap((p) => [
      ...Object.values(p.when),
      ...Object.values(p.what),
    ]);
    expect(nonZero.filter((n) => n !== 0)).toHaveLength(10);
  });

  it("each version can write the sentences the page claims, and no more", () => {
    const tuned = combine([base, 1], [adapter, 1]);
    const withStrips = combine([base, 1], [fromStrips([pairA, pairB]), 1]);

    const owlInNest = sentence("The owl sits in the nest.");
    expect(canWrite(tuned, owlInNest)).toBe(true);
    expect(contains(baseTokens, owlInNest) || contains(owlTokens, owlInNest)).toBe(false);

    const moonSings = sentence("The moon sings.");
    expect(canWrite(withStrips, moonSings)).toBe(true);
    expect(canWrite(tuned, moonSings)).toBe(false);

    // Every word the strips can produce already has a row in the base, so
    // generation with the strips never reaches a dead end.
    for (const word of Object.keys(pairB.what)) expect(rowOf(base, word)).not.toEqual({});
  });

  it("a single pair mixes the patterns up, and a lone what strip is blunter still", () => {
    const one = fromStrips([
      {
        when: { the: 1, owl: 1, moon: 1 },
        what: { owl: 4, moon: 2, flies: 1, sits: 1, sings: 1, sleeps: 1, sets: 1 },
      },
    ]);
    expect(get(one, "the", "sits")).toBeGreaterThan(0);
    expect(get(one, "owl", "owl")).toBeGreaterThan(0);

    const everyRow = Object.fromEntries(Array.from(base.keys(), (w) => [w, 1]));
    const bias = combine(
      [base, 1],
      [fromStrips([{ when: everyRow, what: { owl: 1, moon: 1 } }]), 1],
    );
    expect(canWrite(bias, ["It", "owl"])).toBe(true);
    expect(canWrite(bias, sentence("the magpie moon"))).toBe(true);
  });
});
