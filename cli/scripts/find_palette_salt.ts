#!/usr/bin/env node
/**
 * Find `(multiplier, salt)` parameters for `entry-for` in
 * tokenized-cutouts.typ such that the top-N most frequent English words
 * land in distinct palette buckets.
 *
 * Background: the original hash (`h = 0`, then `h = (h*31 + cp) mod 1000003`,
 * then `bucket = h mod 30`) had a structural weakness — `31 mod 30 = 1`
 * means `31^n mod 30 = 1` for all word lengths n, so the bucket assignment
 * mod 30 effectively reduces to `sum(codepoints) mod 30`. This collapses
 * common same-length words into shared buckets (e.g. "it" and "on" both
 * land in bucket 11 regardless of salt). The fix is to pick a multiplier
 * whose mod-30 behaviour is non-degenerate.
 *
 * This script brute-forces `(multiplier, salt)` pairs and picks the one
 * with the highest score, where score is lexicographically
 * (totalDistinct, punctDistinct, distinctPrefixLen):
 *   - totalDistinct: count of distinct buckets across all 30 tokens — the
 *     headline number, how many of the top tokens get their own colour.
 *   - punctDistinct: count of distinct buckets among "." "," "?" "!". Used
 *     as a tiebreaker because punctuation pairs sharing a colour
 *     (especially the sentence-final "?"/"!") is the most pedagogically
 *     confusing kind of collision.
 *   - distinctPrefixLen: number of leading tokens (in frequency order)
 *     before the first collision — keeps the search stable when the word
 *     list is edited.
 * Multipliers are odd primes <= 1000, all coprime to the hash modulus
 * 1000003. For each multiplier, salts are searched over the full residue
 * range 0..1000003; anything larger is congruent mod the modulus.
 *
 * The word list is the lowercased top of the standard English frequency
 * order (COCA / Google Books Ngrams broadly agree on these). "I" stays
 * capitalised because the CLI's case allowlist preserves it.
 *
 * Run (requires Node 22.7+ for native .ts support):
 *   node cli/scripts/find_palette_salt.ts
 *   node cli/scripts/find_palette_salt.ts --n 25
 */
import { parseArgs } from "node:util";

const HASH_MOD = 1000003;
const PALETTE_LEN = 30;
const MULT_MAX = 1000;
function primesUpTo(n: number): number[] {
  const sieve = new Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= n; i++) {
    if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = false;
  }
  const out: number[] = [];
  for (let i = 3; i <= n; i++) if (sieve[i] && i !== HASH_MOD) out.push(i);
  return out;
}
const MULTIPLIERS = primesUpTo(MULT_MAX);

// Top English tokens in approximate frequency order. Punctuation marks
// rank high — "." is typically the single most frequent token in any
// running prose corpus (more frequent than "the"), and "," sits near the
// top too. "?" and "!" are rarer but still common enough to warrant a
// distinct colour, since the matching game gets confusing if two
// sentence-final punctuation marks share a bucket. The CLI's
// canonicalisation produces lowercase for almost everything; "I" is the
// one allowlisted exception that stays capitalised in the JSON.
const TOP_WORDS = [
  ".",
  "the",
  ",",
  "of",
  "and",
  "to",
  "a",
  "in",
  "is",
  "you",
  "that",
  "it",
  "he",
  "was",
  "for",
  "on",
  "are",
  "with",
  "as",
  "I",
  "his",
  "they",
  "be",
  "at",
  "one",
  "have",
  "?",
  "this",
  "from",
  "!",
];

function bucketFor(word: string, mult: number, salt: number): number {
  let h = salt % HASH_MOD;
  for (const ch of word) {
    h = (h * mult + ch.codePointAt(0)!) % HASH_MOD;
  }
  return h % PALETTE_LEN;
}

function distinctPrefixLength(
  words: string[],
  mult: number,
  salt: number,
): number {
  const seen = new Set<number>();
  for (let i = 0; i < words.length; i++) {
    const b = bucketFor(words[i], mult, salt);
    if (seen.has(b)) return i;
    seen.add(b);
  }
  return words.length;
}

const { values } = parseArgs({
  options: {
    n: { type: "string", default: "0" },
  },
});

const targetN = Number(values.n);

const PUNCTUATION = [".", ",", "?", "!"];
function punctuationDistinctCount(mult: number, salt: number): number {
  const seen = new Set<number>();
  for (const p of PUNCTUATION) seen.add(bucketFor(p, mult, salt));
  return seen.size;
}

let bestScore = -1;
let bestMult = 0;
let bestSalt = 0;

for (const mult of MULTIPLIERS) {
  for (let salt = 0; salt < HASH_MOD; salt++) {
    // Encode (totalDistinct, punctDistinct, prefixLen) lexicographically.
    // totalDistinct in [0, 30], punctDistinct in [0, 4], prefixLen in
    // [0, 30]; bases 100 / 10 / 1 give room without overflow.
    const totalDistinct = new Set(
      TOP_WORDS.map((w) => bucketFor(w, mult, salt)),
    ).size;
    const punctDistinct = punctuationDistinctCount(mult, salt);
    const prefix = distinctPrefixLength(TOP_WORDS, mult, salt);
    const score = totalDistinct * 1000 + punctDistinct * 100 + prefix;
    if (score > bestScore) {
      bestScore = score;
      bestMult = mult;
      bestSalt = salt;
    }
  }
}

const bestDistinct = Math.floor(bestScore / 1000);
const bestPunctDistinct = Math.floor((bestScore % 1000) / 100);
const bestPrefix = bestScore % 100;

if (targetN > 0 && bestDistinct < targetN) {
  console.error(
    `No (mult, salt) found that distinguishes at least ${targetN} tokens. ` +
      `Best: ${bestDistinct} distinct (mult=${bestMult}, salt=${bestSalt}).`,
  );
  process.exit(1);
}

console.log(`Best: mult=${bestMult}, salt=${bestSalt}`);
console.log(
  `${bestDistinct} of ${TOP_WORDS.length} tokens land in distinct buckets ` +
    `(prefix until first collision: ${bestPrefix}; ` +
    `${bestPunctDistinct}/4 punctuation marks distinct).`,
);
console.log("");
console.log("Bucket assignment:");
const seenBuckets = new Map<number, string>();
for (let i = 0; i < TOP_WORDS.length; i++) {
  const t = TOP_WORDS[i];
  const b = bucketFor(t, bestMult, bestSalt);
  const collides = seenBuckets.has(b);
  const marker = collides ? "*" : " ";
  const note = collides ? `  (collides with ${seenBuckets.get(b)!})` : "";
  if (!collides) seenBuckets.set(b, t);
  console.log(`  ${marker} ${t.padEnd(6)} -> bucket ${b}${note}`);
}
