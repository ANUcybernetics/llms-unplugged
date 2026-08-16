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

/**
 * Roman numerals we filter out, ported verbatim from `is_roman_numeral` in
 * cli/src/text.rs. An explicit blocklist rather than proper Roman numeral
 * validation because some valid Roman numerals are common English words
 * (e.g. "mix" = 1009, "dix" = 509). In practice, Roman numerals in literary
 * texts are chapter/section numbers which rarely exceed 50, so we just
 * enumerate the ones we want to filter. The shared fixture test
 * (test/tokens.test.ts) pins this against the Rust implementation.
 */
// prettier-ignore
const ROMAN_NUMERAL_BLOCKLIST = new Set([
  "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii",
  "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx", "xxi", "xxii", "xxiii",
  "xxiv", "xxv", "xxvi", "xxvii", "xxviii", "xxix", "xxx", "xxxi", "xxxii",
  "xxxiii", "xxxiv", "xxxv", "xxxvi", "xxxvii", "xxxviii", "xxxix", "xl",
  "xli", "xlii", "xliii", "xliv", "xlv", "xlvi", "xlvii", "xlviii", "xlix",
  "l",
]);

/** Strip leading/trailing apostrophe quoting, keeping contraction endings. */
function cleanWord(token: string): string | null {
  let word = token.replace(/^'+/, "");
  while (word.endsWith("'") && !looksLikeContraction(word)) {
    word = word.slice(0, -1);
  }
  return word.length > 0 ? word : null;
}

function isValidWord(word: string): boolean {
  const lower = word.toLowerCase();
  return lower === "i" || !ROMAN_NUMERAL_BLOCKLIST.has(lower);
}

type Segment = { kind: "word" | "punct"; text: string };

/**
 * Split text into lexical segments, mirroring `Normalizer::segments` in
 * cli/src/text.rs: punctuation is its own segment; digits and everything else
 * outside letters/apostrophes separate words. The one deliberate difference:
 * CJK ideographs are always one segment per character (the Rust side defaults
 * to jieba word segmentation; word-level CJK on the website goes through the
 * wasm build via cjkTokenize.ts instead).
 */
function segment(text: string): Segment[] {
  const segments: Segment[] = [];
  let word = "";
  const flushWord = () => {
    if (word.length > 0) {
      segments.push({ kind: "word", text: word });
      word = "";
    }
  };

  for (const rawChar of text) {
    const char = normalizeApostrophe(rawChar);
    if (PUNCTUATION.has(char)) {
      flushWord();
      segments.push({ kind: "punct", text: char });
    } else if (isCJK(char)) {
      flushWord();
      segments.push({ kind: "word", text: char });
    } else if (/[a-zA-Z]/.test(char) || char === "'") {
      word += char;
    } else {
      flushWord();
    }
  }
  flushWord();

  return segments;
}

const MAX_TEXT_LENGTH = 1_000_000;
const MAX_TOKEN_COUNT = 100_000;

/**
 * Tokenise and normalise a corpus the way the Rust CLI does (cli/src/text.rs),
 * so the widgets agree with the printed booklets. Two passes, mirroring
 * `NGramCounter::process_lines`: first track surface forms so a word that
 * always appears with one capitalisation keeps it ("Sally" stays "Sally"),
 * then emit canonical tokens (allowlist > corpus case map > lowercase).
 */
export function parseTokens(text: string): string[] {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text too long: ${text.length} characters (max ${MAX_TEXT_LENGTH})`);
  }

  const segments = segment(text);

  // Pass 1: record surface forms (CanonicalFormTracker in the Rust source).
  const surfaceForms = new Map<string, Set<string>>();
  for (const seg of segments) {
    if (seg.kind !== "word") continue;
    const word = cleanWord(seg.text);
    if (!word || !isValidWord(word)) continue;
    const lower = word.toLowerCase();
    const forms = surfaceForms.get(lower) ?? new Set();
    forms.add(word);
    surfaceForms.set(lower, forms);
  }
  const corpusCase = new Map<string, string>();
  for (const [lower, forms] of surfaceForms) {
    if (forms.size === 1) {
      const [form] = forms;
      if (form !== lower) corpusCase.set(lower, form);
    }
  }

  // Pass 2: emit canonical tokens (allowlist > corpus case map > lowercase).
  const tokens: string[] = [];
  for (const seg of segments) {
    if (seg.kind === "punct") {
      tokens.push(seg.text);
      continue;
    }
    const word = cleanWord(seg.text);
    if (!word || !isValidWord(word)) continue;
    const lower = word.toLowerCase();
    tokens.push(CASE_ALLOWLIST.get(lower) ?? corpusCase.get(lower) ?? lower);
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
