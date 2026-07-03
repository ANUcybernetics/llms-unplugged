const PUNCTUATION = new Set([
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  // Full-width CJK equivalents, kept as standalone tokens so Chinese corpora
  // box their punctuation the same way English ones do.
  "。",
  "，",
  "、",
  "！",
  "？",
  "；",
  "：",
]);

/**
 * True for CJK ideographs --- the characters tokenised at the character level
 * (one token per glyph). Chinese has no inter-word spaces, so we can't
 * accumulate letter runs the way we do for Latin words. Mirrors
 * `is_cjk_ideograph` in the Rust tokeniser (cli/src/text.rs). Full-width CJK
 * punctuation is excluded here --- it lives in PUNCTUATION instead.
 */
function isCJK(char: string): boolean {
  const cp = char.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Extension A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
    (cp >= 0x20000 && cp <= 0x2a6df) // CJK Extension B
  );
}

export function isPunctuation(token: string): boolean {
  return PUNCTUATION.has(token);
}

/** True if the text contains any CJK ideograph (see {@link isCJK}). */
export function containsCJK(text: string): boolean {
  for (const char of text) {
    if (isCJK(char)) return true;
  }
  return false;
}

const CASE_ALLOWLIST = new Map([
  ["i", "I"],
  ["i'm", "I'm"],
  ["i've", "I've"],
  ["i'd", "I'd"],
  ["i'll", "I'll"],
]);

function normalizeApostrophe(char: string): string {
  if ("\u2018\u2019\u2032\u00B4\u0060".includes(char)) {
    return "'";
  }
  return char;
}

function looksLikeContraction(word: string): boolean {
  const lower = word.toLowerCase();
  const suffixes = ["'s", "s'", "n't", "'ll", "'ve", "'re", "'d", "'m", "in'", "an'", "o'"];
  return suffixes.some((s) => lower.endsWith(s));
}

function isRomanNumeral(s: string): boolean {
  return s.length > 0 && [...s].every((c) => "ivxlcdm".includes(c));
}

function normalizeWordToken(token: string): string | null {
  let word = token.replace(/^'+/, "");

  while (word.endsWith("'") && !looksLikeContraction(word)) {
    word = word.slice(0, -1);
  }

  if (word.length === 0) {
    return null;
  }

  if (/^\d/.test(word)) {
    return null;
  }

  const lower = word.toLowerCase();

  if (lower === "<|endoftext|>") {
    return null;
  }

  if (lower !== "i" && isRomanNumeral(lower)) {
    return null;
  }

  return CASE_ALLOWLIST.get(lower) ?? lower;
}

const MAX_TEXT_LENGTH = 1_000_000;
const MAX_TOKEN_COUNT = 100_000;

export function parseTokens(text: string): string[] {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text too long: ${text.length} characters (max ${MAX_TEXT_LENGTH})`);
  }

  const tokens: string[] = [];
  let current = "";

  for (const rawChar of text) {
    const char = normalizeApostrophe(rawChar);

    if (PUNCTUATION.has(char)) {
      if (current.length > 0) {
        const normalized = normalizeWordToken(current);
        if (normalized) tokens.push(normalized);
        current = "";
      }
      tokens.push(char);
    } else if (isCJK(char)) {
      // Character-level tokenisation: each ideograph is its own token, pushed
      // directly. The English normalisation (lowercasing, roman-numeral and
      // contraction handling) is all irrelevant to a Han character.
      if (current.length > 0) {
        const normalized = normalizeWordToken(current);
        if (normalized) tokens.push(normalized);
        current = "";
      }
      tokens.push(char);
    } else if (/[a-zA-Z]/.test(char) || char === "'") {
      current += char;
    } else {
      if (current.length > 0) {
        const normalized = normalizeWordToken(current);
        if (normalized) tokens.push(normalized);
        current = "";
      }
    }
  }

  if (current.length > 0) {
    const normalized = normalizeWordToken(current);
    if (normalized) tokens.push(normalized);
  }

  if (tokens.length > MAX_TOKEN_COUNT) {
    throw new Error(`Too many tokens: ${tokens.length} (max ${MAX_TOKEN_COUNT})`);
  }

  return tokens;
}

/**
 * Split an already-tokenised, space-separated string into tokens. Unlike
 * `parseTokens`, this does no normalisation (no lowercasing, punctuation
 * splitting or number stripping) --- it assumes the caller passes a token
 * stream that has already been through the pipeline, as the deck partials do.
 */
export function splitTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function getVocabulary(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

export function getBigrams(tokens: string[]): [string, string][] {
  if (tokens.length < 2) return [];
  const pairs: [string, string][] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    pairs.push([tokens[i], tokens[i + 1]]);
  }
  return pairs;
}

export interface BigramModel {
  counts: Map<string, Map<string, number>>;
  hasSuccessors: (word: string) => boolean;
  getCount: (from: string, to: string) => number;
}

export function buildBigramModel(tokens: string[]): BigramModel {
  const vocabulary = getVocabulary(tokens);
  const counts = new Map<string, Map<string, number>>();

  for (const word of vocabulary) {
    counts.set(word, new Map());
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const from = tokens[i];
    const to = tokens[i + 1];
    const row = counts.get(from)!;
    row.set(to, (row.get(to) || 0) + 1);
  }

  return {
    counts,
    hasSuccessors(word: string): boolean {
      const row = counts.get(word);
      return row ? [...row.values()].some((v) => v > 0) : false;
    },
    getCount(from: string, to: string): number {
      return counts.get(from)?.get(to) || 0;
    },
  };
}
