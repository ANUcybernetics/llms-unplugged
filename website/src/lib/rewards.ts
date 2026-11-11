/**
 * The Rewards module's rounds: generate sentences from a bigram model, score
 * them against the rule card or a panel's ranking, and nudge every pair in
 * each scored sentence up or down. Shared by RewardsWidget and the tests that
 * check the page's numbers (test/utils/rewardsSim.ts).
 */

export type Counts = Map<string, Map<string, number>>;
export type Sentence = { words: string[]; end: string };
export type Leash = "on" | "off";

export const END = new Set([".", "!"]);
export const MAX_WORDS = 10;
export const CANDIDATES = 5;

export const copy = (m: Counts): Counts => new Map(Array.from(m, ([w, row]) => [w, new Map(row)]));
export const get = (m: Counts, a: string, b: string) => m.get(a)?.get(b) ?? 0;

export function pick(row: Map<string, number>, r: () => number): string | undefined {
  const live = [...row].filter(([, n]) => n > 0);
  let roll = r() * live.reduce((s, [, n]) => s + n, 0);
  for (const [w, n] of live) if ((roll -= n) < 0) return w;
  return undefined;
}

// One candidate: start after a full stop, roll until `.` or `!`, and stop it
// unfinished at MAX_WORDS.
export function sentence(m: Counts, r: () => number): Sentence {
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

/**
 * Add `delta` to every pair in the sentence. With the leash on, a pair the
 * base model had never drops below 1.
 */
export function update(m: Counts, base: Counts, s: Sentence, delta: number, leash: Leash) {
  for (const [a, b] of pairs(s)) {
    const floor = leash === "on" && get(base, a, b) > 0 ? 1 : 0;
    m.get(a)!.set(b, Math.max(floor, get(m, a, b) + delta));
  }
}

/** The rule table's update for one round: passes up, failures down. */
export function ruleUpdate(m: Counts, base: Counts, round: Sentence[], leash: Leash) {
  for (const s of round) update(m, base, s, passes(s) ? 1 : -1, leash);
}

/** The panel table's update: the best sentence up, the worst down. */
export function panelUpdate(m: Counts, base: Counts, best: Sentence, worst: Sentence) {
  update(m, base, best, 1, "on");
  update(m, base, worst, -1, "on");
}

export const rowTotal = (m: Counts, w: string) =>
  [...(m.get(w)?.values() ?? [])].reduce((a, b) => a + b, 0);
