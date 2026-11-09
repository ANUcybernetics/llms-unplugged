import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../src/lib/tokens";

// The Fine-tuning and LoRA module fine-tunes the model of The magpie's nest on
// The kookaburra and the possum, and makes claims about the combined rows,
// the scaled adapter, the strip pairs and the sentences each version can write. These
// tests rebuild both models with the CLI-matching tokeniser and check every
// one of those claims against the page.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const storyTokens = (path: string) => parseTokens(read(path).split("---")[2]);

const MODULE = read("src/content/modules/fine-tuning.mdx");
const baseTokens = storyTokens("../data/originals/the-magpies-nest.txt");
const newTokens = storyTokens("../data/originals/the-kookaburra-and-the-possum.txt");

type Counts = Map<string, Map<string, number>>;
type Strips = { when: Record<string, number>; what: Record<string, number> };

const toCounts = (tokens: string[]): Counts => buildBigramModel(tokens).counts;
const base = toCounts(baseTokens);
const adapter = toCounts(newTokens);

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

// "The kookaburra sits in the nest." -> the kookaburra sits in the nest .
// (the sentence-start "The" is the same token as "the", as in Training).
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

const pairA: Strips = { when: { the: 1 }, what: { kookaburra: 4, possum: 2 } };
const pairB: Strips = {
  when: { kookaburra: 1, possum: 1 },
  what: { flies: 1, sits: 1, sings: 1, eats: 1, sleeps: 1, hides: 1 },
};

describe("Fine-tuning and LoRA module", () => {
  it("prints the base model's `the` row", () => {
    expect(printedRow("the", 17)).toEqual(rowOf(base, "the"));
  });

  it("fine-tuning in place gives the printed `the`, `kookaburra` and `possum` rows", () => {
    const tuned = combine([base, 1], [adapter, 1]);
    expect(printedRow("the", 27)).toEqual(rowOf(tuned, "the"));
    expect(rowOf(tuned, "kookaburra")).toEqual({ flies: 1, sits: 1, sings: 1, eats: 1 });
    expect(rowOf(tuned, "possum")).toEqual({ sleeps: 1, hides: 1 });
  });

  it("the adapter at three times gives the claimed `the` row", () => {
    const scaled = rowOf(combine([base, 1], [adapter, 3]), "the");
    const claim = MODULE.match(/the `the` row becomes (.+?) \((\d+) in total\)/s)!;
    const printed = Object.fromEntries(
      Array.from(claim[1].matchAll(/`(\S+)` (\d+)/g), ([, w, n]) => [w, Number(n)]),
    );
    expect(printed).toEqual(scaled);
    expect(Number(claim[2])).toBe(Object.values(scaled).reduce((a, b) => a + b, 0));
  });

  it("the base already has every adapter tally the strips leave out", () => {
    const listed = MODULE.match(
      /the magpie's grid already has (.+?)\. Only two patterns are new/s,
    )![1];
    const pairs = Array.from(listed.matchAll(/`(\S+) → (\S+)`/g), ([, a, b]) => `${a} ${b}`);
    expect(pairs).toHaveLength(15);
    for (const pair of pairs) {
      const [from, to] = pair.split(" ");
      expect(get(base, from, to), pair).toBeGreaterThan(0);
    }

    const newWords = new Set(["kookaburra", "possum"]);
    const leftOut = [...adapter].flatMap(([from, row]) =>
      [...row.keys()]
        .filter((to) => !newWords.has(from) && !(from === "the" && newWords.has(to)))
        .map((to) => `${from} ${to}`),
    );
    expect(leftOut.toSorted()).toEqual(pairs.toSorted());
  });

  it("pair A reproduces the adapter's `the` row, pair B blends the two animals", () => {
    const strips = fromStrips([pairA, pairB]);
    expect(rowOf(strips, "the")).toEqual({
      kookaburra: get(adapter, "the", "kookaburra"),
      possum: get(adapter, "the", "possum"),
    });
    expect(rowOf(strips, "kookaburra")).toEqual(pairB.what);
    expect(rowOf(strips, "possum")).toEqual(pairB.what);
    expect(get(adapter, "possum", "flies")).toBe(0);
    expect(get(adapter, "kookaburra", "hides")).toBe(0);
  });

  it("counts the sheet, the strips and their non-zero numbers as claimed", () => {
    const vocab = new Set([...baseTokens, ...newTokens]);
    expect(vocab.size).toBe(34);
    expect(MODULE).toContain("34 words down the side and 34 along the top, which is 1,156 cells");
    expect(MODULE).toContain(
      "four strips of 34, so 136 numbers, and only eleven of them aren't zero",
    );
    const nonZero = [pairA, pairB].flatMap((p) => [
      ...Object.values(p.when),
      ...Object.values(p.what),
    ]);
    expect(nonZero.filter((n) => n !== 0)).toHaveLength(11);
  });

  it("each version can write the sentences the page claims, and no more", () => {
    const tuned = combine([base, 1], [adapter, 1]);
    const withStrips = combine([base, 1], [fromStrips([pairA, pairB]), 1]);

    const inTheNest = sentence("The kookaburra sits in the nest.");
    expect(canWrite(tuned, inTheNest)).toBe(true);
    expect(contains(baseTokens, inTheNest) || contains(newTokens, inTheNest)).toBe(false);

    const possumSings = sentence("The possum sings.");
    expect(canWrite(withStrips, possumSings)).toBe(true);
    expect(canWrite(tuned, possumSings)).toBe(false);

    // Every word the strips can produce already has a row in the base, so
    // generation with the strips never reaches a dead end.
    for (const word of Object.keys(pairB.what)) expect(rowOf(base, word)).not.toEqual({});
  });

  it("a single pair mixes the patterns up, and a lone what strip is blunter still", () => {
    const one = fromStrips([
      {
        when: { the: 1, kookaburra: 1, possum: 1 },
        what: {
          kookaburra: 4,
          possum: 2,
          flies: 1,
          sits: 1,
          sings: 1,
          eats: 1,
          sleeps: 1,
          hides: 1,
        },
      },
    ]);
    expect(get(one, "the", "sits")).toBeGreaterThan(0);
    expect(get(one, "possum", "possum")).toBeGreaterThan(0);

    const everyRow = Object.fromEntries(Array.from(base.keys(), (w) => [w, 1]));
    const bias = combine(
      [base, 1],
      [fromStrips([{ when: everyRow, what: { kookaburra: 1, possum: 1 } }]), 1],
    );
    expect(canWrite(bias, ["It", "possum"])).toBe(true);
    expect(canWrite(bias, sentence("the magpie kookaburra"))).toBe(true);
  });
});
