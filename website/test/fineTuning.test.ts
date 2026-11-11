import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../src/lib/tokens";
import { mergedRow, rowTotal } from "../src/lib/adapters";
import { pick, rng } from "./utils/rewardsSim";

// The Fine-tuning and LoRA module fine-tunes the model of The magpie's nest on
// The kookaburra and the possum, and makes claims about the combined rows,
// the scaled adapter, the strip pairs and the sentences each version can write. These
// tests rebuild both models with the CLI-matching tokeniser and check every
// one of those claims against the page.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
const body = (path: string) => read(path).split("---")[2].trim();
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
  it("gives the widgets the same texts as the corpus files and the quoted flattery", () => {
    const constant = (name: string) =>
      JSON.parse(
        MODULE.match(
          new RegExp(String.raw`^export const ${name} =\s*("(?:[^"\\]|\\.)*")`, "m"),
        )![1],
      ) as string;
    expect(constant("MAGPIE")).toBe(body("../data/originals/the-magpies-nest.txt"));
    expect(constant("KOOKABURRA")).toBe(
      body("../data/originals/the-kookaburra-and-the-possum.txt"),
    );
    expect(constant("WOMBAT")).toBe(body("../data/originals/the-wombat.txt"));
    const quoted = Array.from(MODULE.matchAll(/^> (\S.*)$/gm), ([, l]) => l).slice(-3);
    expect(constant("FLATTERY")).toBe(quoted.join("\n"));
  });

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

  describe("the flattering adapter", () => {
    const quoted = Array.from(
      MODULE.split("## A nasty adapter: flattery")[1]
        .split("##")[0]
        .matchAll(/^> (\S.*)$/gm),
      ([, line]) => line,
    );
    const flattery = toCounts(parseTokens(quoted.join("\n")));
    const baseWords = new Set(baseTokens);

    it("quotes three lines from the printable sycophancy sheet", () => {
      expect(quoted).toHaveLength(3);
      const sheet = read("../data/originals/sycophancy.txt");
      for (const line of quoted) expect(sheet.split("\n")).toContain(line);
    });

    it("adds the eight new words the page names, hooked in after `.`, `!` and `is`", () => {
      const newWords = [...flattery.keys()].filter((w) => !baseWords.has(w));
      expect(newWords.toSorted()).toEqual(
        ["you", "are", "so", "good", "for", "this", "much", "fun"].toSorted(),
      );
      const hooks = [...flattery.keys()].filter((w) => baseWords.has(w) && flattery.get(w)!.size);
      expect(hooks.toSorted()).toEqual([".", "!", "is"].toSorted());
      expect(rowOf(flattery, ".")).toEqual({ you: 1, good: 1, this: 1 });
      expect(get(flattery, "is", "so")).toBeGreaterThan(0);
    });

    it("prints the adapter's rows as tallied from the three lines", () => {
      const section = MODULE.split("## A nasty adapter: flattery")[1].split("##")[0];
      const printed = new Map(
        Array.from(section.matchAll(/^\| `(\S+)` +\| (`.+?) +\|$/gm), ([, word, rest]) => [
          word,
          Object.fromEntries(
            Array.from(rest.matchAll(/`(\S+)` (\d+)/g), ([, w, n]) => [w, Number(n)]),
          ),
        ]),
      );
      expect([...printed.keys()].toSorted()).toEqual([...flattery.keys()].toSorted());
      for (const [word, row] of printed) expect(row, word).toEqual(rowOf(flattery, word));
    });

    const newWords = new Set([...flattery.keys()].filter((w) => !baseWords.has(w)));

    it("at three times, the `.` row is the one the page writes out", () => {
      expect(rowOf(combine([base, 1], [flattery, 3]), ".")).toEqual({
        It: 7,
        the: 7,
        Here: 2,
        Down: 1,
        you: 3,
        good: 3,
        this: 3,
      });
      // the merged-rows table prints each changed row's roll numbers and total
      for (const k of [1, 3, 9]) {
        const line = MODULE.split("\n").find((l) => l.startsWith(`| ×${k} `));
        expect(line, `merged rows at ×${k}`).toBeDefined();
        const cells = line!.split("|").slice(2, 5);
        for (const [i, word] of [".", "!", "is"].entries()) {
          const row = mergedRow(
            [
              { counts: base, strength: 1 },
              { counts: flattery, strength: k },
            ],
            word,
          );
          const printed = Array.from(cells[i].matchAll(/`(\S+)` (\d+)(?:–(\d+))?/g), (m) => [
            m[1],
            Number(m[2]),
            Number(m[3] ?? m[2]),
          ]);
          expect(printed, `×${k} ${word}`).toEqual(row.map((o) => [o.word, ...o.range]));
          expect(cells[i]).toContain(`(${rowTotal(row)}`);
        }
      }
      // the d20 and d6 in "You will need" cover every row, at every strength
      for (const k of [1, 3, 9]) {
        for (const row of combine([base, 1], [flattery, k]).values()) {
          expect([...row.values()].reduce((x, y) => x + y, 0)).toBeLessThanOrEqual(60);
        }
      }
    });

    // Sentences from `.` at one strength, counting those with a flattery word.
    function flattering(strength: number, sentences: number, r: ReturnType<typeof rng>) {
      const model = combine([base, 1], [flattery, strength]);
      let count = 0;
      for (let i = 0; i < sentences; i++) {
        const words: string[] = [];
        let w = ".";
        while (words.length < 12) {
          const next = pick(model.get(w) ?? new Map(), r);
          if (!next || next === "." || next === "!") break;
          words.push(next);
          w = next;
        }
        count += +words.some((x) => newWords.has(x));
      }
      return count;
    }

    it("the dose-response matches the expected counts on the board", () => {
      const r = rng(11);
      const runs = 3000;
      const average = (k: number) =>
        Array.from({ length: runs }, () => flattering(k, 10, r)).reduce((x, y) => x + y, 0) / runs;
      expect(average(0)).toBe(0);
      const one = average(1);
      const three = average(3);
      const nine = average(9);
      expect(one).toBeGreaterThan(1.5);
      expect(one).toBeLessThan(2.5);
      expect(three).toBeGreaterThan(3.5);
      expect(three).toBeLessThan(4.5);
      expect(nine).toBeGreaterThan(6);
      expect(nine).toBeLessThan(7);
      expect(MODULE).toContain(
        "Expect about two sentences in ten at full strength, four at three times and six or seven at nine times",
      );

      // one group per strength lands out of order now and then; two groups'
      // counts added together rarely do
      const inOrder = (sentences: number) => {
        let ok = 0;
        for (let i = 0; i < runs; i++) {
          const [x, y, z] = [1, 3, 9].map((k) => flattering(k, sentences, r));
          ok += +(x <= y && y <= z);
        }
        return ok / runs;
      };
      const alone = inOrder(10);
      expect(alone).toBeGreaterThan(0.7);
      expect(alone).toBeLessThan(0.9);
      expect(inOrder(20)).toBeGreaterThan(0.88);
      expect(MODULE).toContain(
        "one group's count can land out of order; two groups' counts added together rarely do",
      );
    });
  });
});
