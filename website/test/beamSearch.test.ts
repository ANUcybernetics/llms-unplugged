import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../src/lib/tokens";

// The Beam Search module prints the bigram model of The magpie's nest as a
// table and claims what greedy and beam search produce from three starting
// points. The story was written so those examples have no ties at any cut;
// these tests rebuild the model from the story (with the CLI-matching
// tokeniser) and check the table and every claimed result, so an edit to
// either file can't leave the page contradicting itself.

const STORY = readFileSync(join(process.cwd(), "../data/originals/the-magpies-nest.txt"), "utf-8");
const MODULE = readFileSync(join(process.cwd(), "src/content/modules/beam-search.mdx"), "utf-8");

const model = buildBigramModel(parseTokens(STORY.split("---")[2]));
const END = new Set([".", "!"]);

function followers(word: string): [string, number][] {
  return [...(model.counts.get(word) ?? new Map()).entries()].filter(([, c]) => c > 0);
}

function share(from: string, to: string): number {
  const total = followers(from).reduce((sum, [, c]) => sum + c, 0);
  return model.getCount(from, to) / total;
}

type Beam = { words: string[]; score: number };

const finished = (beam: Beam, prefixLength: number) =>
  beam.words.length > prefixLength && END.has(beam.words.at(-1)!);

// Beam search as the module describes it: finished beams carry over and hold
// a place, and ties for the last place all survive. Reports whether any cut
// fell on a tie, since the examples are meant to have none.
function beamSearch(prefix: string[], width: number) {
  let beams: Beam[] = [{ words: prefix, score: 1 }];
  let tieAtCut = false;
  while (!beams.every((b) => finished(b, prefix.length))) {
    const candidates = beams.flatMap((b) =>
      finished(b, prefix.length)
        ? [b]
        : followers(b.words.at(-1)!).map(([w]) => ({
            words: [...b.words, w],
            score: b.score * share(b.words.at(-1)!, w),
          })),
    );
    candidates.sort((a, b) => b.score - a.score);
    const cut = candidates[Math.min(width, candidates.length) - 1].score;
    if (candidates.length > width && Math.abs(candidates[width].score - cut) < 1e-12) {
      tieAtCut = true;
    }
    beams = candidates.filter((c) => c.score >= cut - 1e-12);
  }
  return { best: beams[0], tieAtCut };
}

function greedy(prefix: string[]) {
  const words = [...prefix];
  let tie = false;
  while (!finished({ words, score: 0 }, prefix.length)) {
    const options = followers(words.at(-1)!);
    const top = Math.max(...options.map(([, c]) => c));
    if (options.filter(([, c]) => c === top).length > 1) tie = true;
    words.push(options.find(([, c]) => c === top)![0]);
  }
  return { sentence: words.join(" "), tie };
}

describe("Beam Search module", () => {
  it("prints the story's bigram model exactly", () => {
    const rows = [...MODULE.matchAll(/^\| `(\S+)`\s+\| (\d+)\s+\| (.+?)\s*\|$/gm)];
    const printed = Object.fromEntries(
      rows.map(([, word, , cells]) => [
        word,
        Object.fromEntries(
          Array.from(cells.matchAll(/`(\S+)` (\d+)/g), ([, w, c]) => [w, Number(c)]),
        ),
      ]),
    );
    const actual = Object.fromEntries(
      [...model.counts.keys()]
        .filter((w) => followers(w).length > 0)
        .map((w) => [w, Object.fromEntries(followers(w))]),
    );
    expect(printed).toEqual(actual);
    for (const [, word, total] of rows) {
      expect(Number(total)).toBe(followers(word).reduce((sum, [, c]) => sum + c, 0));
    }
  });

  it.each([
    {
      start: "It sleeps in the",
      greedy: "It sleeps in the magpie sings .",
      beam: "It sleeps in the nest .",
    },
    { start: "It", greedy: "It flies to the magpie sings .", beam: "It is morning ." },
    {
      start: "Here comes the",
      greedy: "Here comes the magpie sings .",
      beam: "Here comes the nest .",
    },
  ])("from '$start', greedy and beam width 2 differ as claimed", (example) => {
    const prefix = example.start.split(" ");
    const g = greedy(prefix);
    const b = beamSearch(prefix, 2);
    expect(g).toEqual({ sentence: example.greedy, tie: false });
    expect(b.best.words.join(" ")).toBe(example.beam);
    expect(b.tieAtCut).toBe(false);
  });
});
