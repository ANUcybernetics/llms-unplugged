import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBigramModel, parseTokens } from "../../src/lib/tokens";

// Simulation of the Rewards module rounds, shared by rewards.test.ts.

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");
export const STORY = parseTokens(read("../data/originals/the-magpies-nest.txt").split("---")[2]);

export type Counts = Map<string, Map<string, number>>;
export type Sentence = { words: string[]; end: string };

export const END = new Set([".", "!"]);
export const VERBS = new Set([
  "is",
  "sings",
  "flies",
  "sits",
  "comes",
  "swoops",
  "runs",
  "warbles",
  "hides",
  "stops",
  "eats",
  "sets",
  "sleeps",
]);
export const BASE: Counts = buildBigramModel(STORY).counts;
export const MAX_WORDS = 10;

export function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = ReturnType<typeof rng>;

export const copy = (m: Counts): Counts => new Map(Array.from(m, ([w, row]) => [w, new Map(row)]));
export const get = (m: Counts, a: string, b: string) => m.get(a)?.get(b) ?? 0;

export function pick(row: Map<string, number>, r: Rng): string | undefined {
  const live = [...row].filter(([, n]) => n > 0);
  let roll = r() * live.reduce((s, [, n]) => s + n, 0);
  for (const [w, n] of live) if ((roll -= n) < 0) return w;
  return undefined;
}

// One candidate: start after a full stop, roll until `.` or `!`.
export function sentence(m: Counts, r: Rng): Sentence {
  const words: string[] = [];
  let w = ".";
  while (words.length < MAX_WORDS) {
    const next = pick(m.get(w) ?? new Map(), r);
    if (next === undefined) return { words, end: "stuck" };
    if (END.has(next)) return { words, end: next };
    words.push(next);
    w = next;
  }
  return { words, end: "long" };
}

export const pairs = ({ words, end }: Sentence) => {
  const seq = [".", ...words, ...(END.has(end) ? [end] : [])];
  return seq.slice(1).map((b, i) => [seq[i], b] as const);
};
export const finished = (s: Sentence) => END.has(s.end);
export const passes = (s: Sentence) => finished(s) && s.words.includes("magpie");
export const garbled = (s: Sentence) => s.words.filter((w) => VERBS.has(w)).length >= 2;

export type Leash = "on" | "off";
export function update(m: Counts, s: Sentence, delta: number, leash: Leash) {
  for (const [a, b] of pairs(s)) {
    const floor = leash === "on" && get(BASE, a, b) > 0 ? 1 : 0;
    m.get(a)!.set(b, Math.max(floor, get(m, a, b) + delta));
  }
}

export const CANDIDATES = 5;
export const ROUNDS = 3;

// The rule table's rounds, with the tally it keeps: how many of each round's
// five sentences passed.
export function ruleRounds(r: Rng, leash: Leash = "on", rounds = ROUNDS) {
  const m = copy(BASE);
  const passed: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const round = Array.from({ length: CANDIDATES }, () => sentence(m, r));
    passed.push(round.filter(passes).length);
    for (const s of round) update(m, s, passes(s) ? 1 : -1, leash);
  }
  return { model: m, passed };
}

export const ruleTable = (r: Rng, leash: Leash = "on", rounds = ROUNDS): Counts =>
  ruleRounds(r, leash, rounds).model;

// A stand-in for the panel: it prefers finished sentences about the magpie
// that make sense, and its members don't fully agree (the noise).
export function panelTable(r: Rng, rounds = ROUNDS): Counts {
  const m = copy(BASE);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  for (let i = 0; i < rounds; i++) {
    const ranked = Array.from({ length: CANDIDATES }, () => sentence(m, r))
      .map((s) => ({
        s,
        score: +passes(s) + 2 * +(finished(s) && !garbled(s)) + 0.7 * gauss(),
      }))
      .toSorted((x, y) => y.score - x.score);
    update(m, ranked[0].s, 1, "on");
    update(m, ranked.at(-1)!.s, -1, "on");
  }
  return m;
}

export const TRIALS = 2000;
export const SAMPLES = 40;

export function rates(build: (r: Rng) => Counts, seed: number) {
  const r = rng(seed);
  let pass = 0;
  let garble = 0;
  let n = 0;
  for (let t = 0; t < TRIALS; t++) {
    const m = build(r);
    for (let i = 0; i < SAMPLES; i++) {
      const s = sentence(m, r);
      pass += +passes(s);
      garble += +(passes(s) && garbled(s));
      n++;
    }
  }
  return { pass: pass / n, garbled: garble / n };
}

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const STORY_PAIRS = [...BASE.values()].reduce((s, row) => s + row.size, 0);

// The thumbs-up round: one slip per answer in a cup; each vote adds a slip
// (thumbs up) or takes one out, never the last (thumbs down). How a room
// votes can't be simulated, so these voters are an assumption the page states:
// they mostly like hearing they're right, clever or kind, and mostly don't
// like hearing they're wrong, rude or late.
export const ANSWERS = ["right", "wrong", "clever", "kind", "rude", "late"] as const;
export type Answer = (typeof ANSWERS)[number];
export const PLEASING = new Set<Answer>(["right", "clever", "kind"]);
export const P_UP: Record<Answer, number> = {
  right: 0.85,
  clever: 0.85,
  kind: 0.85,
  late: 0.3,
  wrong: 0.2,
  rude: 0.05,
};

export function thumbsUpCup(r: Rng, votes: number) {
  const cup = new Map<Answer, number>(ANSWERS.map((a) => [a, 1]));
  for (let i = 0; i < votes; i++) {
    const drawn = pick(cup, r) as Answer;
    const up = r() < P_UP[drawn];
    cup.set(drawn, Math.max(1, cup.get(drawn)! + (up ? 1 : -1)));
  }
  return cup;
}

export const slips = (cup: Map<Answer, number>) => [...cup.values()].reduce((a, b) => a + b, 0);

export function thumbsUp(r: Rng, voters: number, rounds: number) {
  const cup = thumbsUpCup(r, rounds * voters);
  return [...PLEASING].reduce((s, a) => s + cup.get(a)!, 0) / slips(cup);
}
