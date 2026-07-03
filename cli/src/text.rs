use serde::Serialize;
use std::collections::{HashMap, HashSet};

/// Default punctuation kept as standalone tokens. Covers the unpaired marks
/// that carry sentence structure; paired marks (quotes, brackets, em-dashes)
/// are intentionally excluded because they don't behave well in n-grams. The
/// full-width block (。，、！？；：) is the Chinese equivalent, kept so CJK
/// corpora box their punctuation the same way English ones do.
pub const DEFAULT_PUNCTUATION: &str = ".,!?;:。，、！？；：";

/// Tracks surface forms of words to determine canonical casing.
///
/// Algorithm:
/// - If a word only appears with one capitalisation, preserve it (e.g., "Sally" stays "Sally")
/// - If a word appears with mixed capitalisation, normalise to lowercase (e.g., "Hello" + "hello" → "hello")
/// - Special case: "I" and its contractions always stay uppercase (handled by allowlist)
#[derive(Debug, Default)]
pub struct CanonicalFormTracker {
    /// Maps lowercase form to observed surface forms
    surface_forms: HashMap<String, HashSet<String>>,
}

impl CanonicalFormTracker {
    pub fn new() -> Self {
        Self::default()
    }

    /// Record a word's surface form for later canonical form determination
    pub fn record(&mut self, word: &str) {
        let lower = word.to_lowercase();
        self.surface_forms
            .entry(lower)
            .or_default()
            .insert(word.to_string());
    }

    /// Get the canonical form for a word based on observed surface forms.
    /// If only one form was seen, return it; otherwise return lowercase.
    #[cfg(test)]
    pub fn get_canonical(&self, word: &str) -> String {
        let lower = word.to_lowercase();
        match self.surface_forms.get(&lower) {
            Some(forms) if forms.len() == 1 => forms.iter().next().unwrap().clone(),
            _ => lower,
        }
    }

    /// Build a canonical form map that can be used by the Normalizer
    pub fn build_case_map(&self) -> HashMap<String, String> {
        let mut map = HashMap::new();
        for (lower, forms) in &self.surface_forms {
            if forms.len() == 1 {
                let form = forms.iter().next().unwrap();
                if form != lower {
                    map.insert(lower.clone(), form.clone());
                }
            }
        }
        map
    }
}

/// A raw token from the input text, before filtering.
/// Used for the cutouts lesson variant where we show all tokens but mark some as discarded.
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct RawToken {
    pub index: usize,
    pub text: String,
    pub keep: bool,
    /// The n-1 preceding kept tokens (for n-gram context). Empty for the first n-1 tokens.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub previous_words: Vec<String>,
    /// True for synthetic tool-trigger tokens injected by the cutouts CLI.
    /// Renders distinctly in the typst template so a trigger like VOTE stays
    /// visually unambiguous even when the corpus contains the same word.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub is_tool: bool,
}

/// Configuration for the tokenizer/normalizer.
/// Punctuation is handled as dedicated tokens; case exceptions are handled here too.
#[derive(Clone, Debug)]
pub struct NormalizerConfig {
    pub punctuation: HashSet<char>,
    /// Always-applied case mappings (e.g., "i" → "I")
    pub case_allowlist: HashMap<String, String>,
    /// Corpus-specific case mappings from CanonicalFormTracker
    pub corpus_case_map: HashMap<String, String>,
}

impl NormalizerConfig {
    pub fn new(punctuation: Vec<char>) -> Self {
        Self {
            punctuation: punctuation.into_iter().collect(),
            case_allowlist: default_case_allowlist(),
            corpus_case_map: HashMap::new(),
        }
    }
}

/// The default punctuation set as a `Vec<char>`.
pub fn default_punctuation() -> Vec<char> {
    DEFAULT_PUNCTUATION.chars().collect()
}

/// Single-surface tokenizer + normalizer used by the CLI.
/// Deterministic rules (order independent):
/// - Normalize apostrophes to ASCII
/// - Keep configured punctuation as standalone tokens
/// - Split on non-letter/non-apostrophe characters (digit runs are their own
///   segments: skipped by the model, shown as discarded by cutouts)
/// - Drop roman numerals (except the allowlisted "I" forms)
/// - Apply allowlist casing; otherwise lowercase everything
#[derive(Debug)]
pub struct Normalizer {
    config: NormalizerConfig,
}

impl Normalizer {
    pub fn new(config: NormalizerConfig) -> Self {
        Self { config }
    }

    /// Update the corpus-specific case map
    pub fn set_corpus_case_map(&mut self, map: HashMap<String, String>) {
        self.config.corpus_case_map = map;
    }

    /// The punctuation marks kept as standalone tokens, as a sorted string.
    /// Sorted so the value is deterministic regardless of insertion order.
    pub fn punctuation(&self) -> String {
        let mut marks: Vec<char> = self.config.punctuation.iter().copied().collect();
        marks.sort_unstable();
        marks.into_iter().collect()
    }

    /// Split a line into lexical segments. This is the single tokenizer
    /// walker: every pipeline (model building, canonical-case tracking, and
    /// cutout sheets) consumes the same segments, so they can never disagree
    /// about token boundaries. Digits act as separators — a digit run is its
    /// own segment, which the model pipelines skip and the cutouts variant
    /// shows as a discarded token.
    fn segments(&self, line: &str) -> Vec<Segment> {
        fn flush(buf: &mut String, make: fn(String) -> Segment, segments: &mut Vec<Segment>) {
            if !buf.is_empty() {
                segments.push(make(std::mem::take(buf)));
            }
        }

        let mut segments = Vec::new();
        let mut word = String::new();
        let mut digits = String::new();

        for c in line.chars() {
            let c = normalize_apostrophe(c);

            if self.config.punctuation.contains(&c) {
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
                segments.push(Segment::Punct(c));
            } else if is_cjk_ideograph(c) {
                // Character-level tokenisation for CJK: each ideograph is its
                // own token. Chinese has no inter-word spaces, so we can't
                // accumulate letter runs the way we do for Latin words. Emitting
                // a single-char Word segment also routes it through the same
                // word pipeline (the English-only case/roman-numeral rules are
                // all no-ops on a Han character).
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
                segments.push(Segment::Word(c.to_string()));
            } else if c.is_ascii_alphabetic() || c == '\'' {
                flush(&mut digits, Segment::Digits, &mut segments);
                word.push(c);
            } else if c.is_ascii_digit() {
                flush(&mut word, Segment::Word, &mut segments);
                digits.push(c);
            } else {
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
            }
        }
        flush(&mut word, Segment::Word, &mut segments);
        flush(&mut digits, Segment::Digits, &mut segments);

        segments
    }

    /// Extract raw word tokens from a line, preserving original casing.
    /// Used for first pass to build canonical form tracking.
    /// Returns only valid word tokens (not punctuation, not filtered).
    pub fn extract_raw_words(&self, line: &str) -> Vec<String> {
        self.segments(line)
            .into_iter()
            .filter_map(|seg| match seg {
                Segment::Word(w) => self.clean_word(&w),
                _ => None,
            })
            .filter(|w| self.is_valid_word(w))
            .collect()
    }

    /// Clean a word token (strip quotes) but preserve original casing
    fn clean_word(&self, token: &str) -> Option<String> {
        let mut word = token.trim_start_matches('\'').to_string();

        while word.ends_with('\'') && !looks_like_contraction(&word) {
            word.pop();
        }

        if word.is_empty() { None } else { Some(word) }
    }

    /// Words consist of letters and apostrophes by construction (digits act
    /// as separators in the walker), so the only filter left is the roman
    /// numeral blocklist (with "I" allowlisted).
    fn is_valid_word(&self, word: &str) -> bool {
        let lower = word.to_lowercase();
        lower == "i" || !is_roman_numeral(&lower)
    }

    /// Canonical casing: allowlist > corpus case map > lowercase.
    fn canonical_case(&self, word: &str) -> String {
        let lower = word.to_lowercase();
        self.config
            .case_allowlist
            .get(&lower)
            .or_else(|| self.config.corpus_case_map.get(&lower))
            .cloned()
            .unwrap_or(lower)
    }

    pub fn normalize_line(&self, line: &str) -> Vec<String> {
        self.segments(line)
            .into_iter()
            .filter_map(|seg| match seg {
                Segment::Word(w) => self.normalize_word_token(&w),
                Segment::Punct(c) => Some(c.to_string()),
                Segment::Digits(_) => None,
            })
            .collect()
    }

    /// Tokenize a line returning raw tokens with keep/discard status.
    /// Used for the cutouts lesson variant where all tokens are shown.
    /// Kept tokens agree with `normalize_line` by construction; digit runs
    /// and filtered words appear with `keep: false` so students can see what
    /// the model dropped.
    pub fn tokenize_line_raw(&self, line: &str, start_index: usize) -> Vec<RawToken> {
        let mut tokens = Vec::new();
        let mut index = start_index;

        for seg in self.segments(line) {
            let token = match seg {
                Segment::Word(w) => self.make_raw_token(&w, index),
                Segment::Punct(c) => Some(RawToken {
                    index,
                    text: c.to_string(),
                    keep: true,
                    previous_words: vec![],
                    is_tool: false,
                }),
                Segment::Digits(d) => Some(RawToken {
                    index,
                    text: d,
                    keep: false,
                    previous_words: vec![],
                    is_tool: false,
                }),
            };
            if let Some(token) = token {
                tokens.push(token);
                index += 1;
            }
        }

        tokens
    }

    fn make_raw_token(&self, token: &str, index: usize) -> Option<RawToken> {
        let word = self.clean_word(token)?;
        let keep = self.is_valid_word(&word);

        // Discarded words keep their original surface form so the cutout
        // shows exactly what was dropped.
        let text = if keep {
            self.canonical_case(&word)
        } else {
            word
        };

        Some(RawToken {
            index,
            text,
            keep,
            previous_words: vec![],
            is_tool: false,
        })
    }

    fn normalize_word_token(&self, token: &str) -> Option<String> {
        let word = self.clean_word(token)?;
        if !self.is_valid_word(&word) {
            return None;
        }
        Some(self.canonical_case(&word))
    }
}

/// A lexical segment of a line, produced by [`Normalizer::segments`].
enum Segment {
    Word(String),
    Punct(char),
    Digits(String),
}

/// True for CJK ideographs — the characters we treat as standalone
/// (character-level) tokens. Covers the common Unified Ideographs block plus
/// Extension A, Compatibility Ideographs, and Extension B, which is ample for
/// the texts this project targets. Full-width CJK punctuation (。，！? etc.) is
/// deliberately excluded: it lives in the punctuation set instead, so it boxes
/// like ASCII punctuation rather than becoming a word token.
fn is_cjk_ideograph(c: char) -> bool {
    matches!(c as u32,
        0x3400..=0x4DBF     // CJK Extension A
        | 0x4E00..=0x9FFF   // CJK Unified Ideographs
        | 0xF900..=0xFAFF   // CJK Compatibility Ideographs
        | 0x2_0000..=0x2_A6DF // CJK Extension B
    )
}

fn normalize_apostrophe(c: char) -> char {
    match c {
        '\u{2018}' | '\u{2019}' | '\u{2032}' | '\u{00B4}' | '\u{0060}' => '\'',
        other => other,
    }
}

fn looks_like_contraction(word: &str) -> bool {
    let lower = word.to_lowercase();
    let suffixes = [
        "'s", "s'", "n't", "'ll", "'ve", "'re", "'d", "'m", "in'", "an'", "o'",
    ];
    suffixes.iter().any(|s| lower.ends_with(s))
}

fn default_case_allowlist() -> HashMap<String, String> {
    let mut map = HashMap::new();
    for (lower, cased) in [
        ("i", "I"),
        ("i'm", "I'm"),
        ("i've", "I've"),
        ("i'd", "I'd"),
        ("i'll", "I'll"),
    ] {
        map.insert(lower.to_string(), cased.to_string());
    }
    map
}

/// Check if a string is a Roman numeral we want to filter out.
///
/// We use an explicit blocklist rather than proper Roman numeral validation because
/// some valid Roman numerals are common English words (e.g., "mix" = 1009, "dix" = 509).
/// In practice, Roman numerals in literary texts are chapter/section numbers which
/// rarely exceed 50, so we just enumerate the ones we want to filter.
fn is_roman_numeral(s: &str) -> bool {
    const BLOCKLIST: &[&str] = &[
        "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv",
        "xvi", "xvii", "xviii", "xix", "xx", "xxi", "xxii", "xxiii", "xxiv", "xxv", "xxvi",
        "xxvii", "xxviii", "xxix", "xxx", "xxxi", "xxxii", "xxxiii", "xxxiv", "xxxv", "xxxvi",
        "xxxvii", "xxxviii", "xxxix", "xl", "xli", "xlii", "xliii", "xliv", "xlv", "xlvi", "xlvii",
        "xlviii", "xlix", "l",
    ];
    let lower = s.to_lowercase();
    BLOCKLIST.contains(&lower.as_str())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn normalizer() -> Normalizer {
        Normalizer::new(NormalizerConfig::new(default_punctuation()))
    }

    fn legacy_normalizer() -> Normalizer {
        Normalizer::new(NormalizerConfig::new(vec![',', '.']))
    }

    #[test]
    fn strips_quotes_and_lowercases() {
        let tokens = normalizer().normalize_line("'Hello,' she said. ''BEST''");
        assert_eq!(tokens, vec!["hello", ",", "she", "said", ".", "best"]);
    }

    #[test]
    fn preserves_allowlisted_casing() {
        let tokens = normalizer().normalize_line("I think I'm fine and i've said so.");
        assert_eq!(
            tokens,
            vec![
                "I", "think", "I'm", "fine", "and", "I've", "said", "so", "."
            ]
        );
    }

    #[test]
    fn filters_numbers_and_roman_numerals() {
        let tokens = normalizer().normalize_line("Chapter IV is 123good and Section3 is fine.");
        assert_eq!(
            tokens,
            vec!["chapter", "is", "good", "and", "section", "is", "fine", "."]
        );
    }

    #[test]
    fn handles_contractions_and_possessives() {
        let tokens = normalizer().normalize_line("The bird's nest and the birds' nests. goin' on");
        assert_eq!(
            tokens,
            vec![
                "the", "bird's", "nest", "and", "the", "birds'", "nests", ".", "goin'", "on"
            ]
        );
    }

    #[test]
    fn punctuation_tokens_are_preserved() {
        let tokens = normalizer().normalize_line("Hello, world. How are you? Yes; right: now!");
        assert_eq!(
            tokens,
            vec![
                "hello", ",", "world", ".", "how", "are", "you", "?", "yes", ";", "right", ":",
                "now", "!"
            ]
        );
    }

    #[test]
    fn paired_punctuation_is_stripped() {
        let tokens =
            normalizer().normalize_line("\"Quoted text\" (parenthetical)---an aside; really!");
        assert_eq!(
            tokens,
            vec![
                "quoted",
                "text",
                "parenthetical",
                "an",
                "aside",
                ";",
                "really",
                "!"
            ]
        );
    }

    #[test]
    fn legacy_punctuation_set_still_filters_new_marks() {
        let tokens = legacy_normalizer().normalize_line("Hello, world. How are you? Yes!");
        assert_eq!(
            tokens,
            vec!["hello", ",", "world", ".", "how", "are", "you", "yes"]
        );
    }

    #[test]
    fn raw_tokens_include_all_with_keep_status() {
        let tokens = normalizer().tokenize_line_raw("Chapter IV is good.", 1);
        assert_eq!(tokens.len(), 5);
        assert_eq!(
            tokens[0],
            RawToken {
                index: 1,
                text: "chapter".to_string(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            }
        );
        assert_eq!(
            tokens[1],
            RawToken {
                index: 2,
                text: "IV".to_string(),
                keep: false,
                previous_words: vec![],
                is_tool: false,
            }
        ); // roman numeral
        assert_eq!(
            tokens[2],
            RawToken {
                index: 3,
                text: "is".to_string(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            }
        );
        assert_eq!(
            tokens[3],
            RawToken {
                index: 4,
                text: "good".to_string(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            }
        );
        assert_eq!(
            tokens[4],
            RawToken {
                index: 5,
                text: ".".to_string(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            }
        );
    }

    #[test]
    fn raw_tokens_index_is_1_based_and_continuous() {
        let tokens = normalizer().tokenize_line_raw("one two three", 1);
        assert_eq!(tokens.len(), 3);
        assert_eq!(tokens[0].index, 1);
        assert_eq!(tokens[1].index, 2);
        assert_eq!(tokens[2].index, 3);
    }

    #[test]
    fn raw_tokens_split_digit_runs_as_discards() {
        // A digit run is its own discarded token and the adjacent word is
        // kept — matching exactly what normalize_line feeds the model
        // ("bad" is a model token for this input).
        let tokens = normalizer().tokenize_line_raw("test 123bad word", 1);
        let summary: Vec<(&str, bool)> = tokens.iter().map(|t| (t.text.as_str(), t.keep)).collect();
        assert_eq!(
            summary,
            vec![
                ("test", true),
                ("123", false),
                ("bad", true),
                ("word", true)
            ]
        );
        // Indices stay continuous across kept and discarded tokens.
        assert_eq!(
            tokens.iter().map(|t| t.index).collect::<Vec<_>>(),
            vec![1, 2, 3, 4]
        );
    }

    #[test]
    fn kept_raw_tokens_agree_with_normalize_line() {
        // The core invariant of the unified walker: the kept cutouts are
        // exactly the tokens the booklet model is built from.
        let n = normalizer();
        for line in [
            "Chapter IV is 123good and Section3 is fine.",
            "test 123bad word, don't stop",
            "Number123 again. I think I'm fine.",
            "'Hello,' she said. ''BEST'' 42",
        ] {
            let kept: Vec<String> = n
                .tokenize_line_raw(line, 1)
                .into_iter()
                .filter(|t| t.keep)
                .map(|t| t.text)
                .collect();
            assert_eq!(
                kept,
                n.normalize_line(line),
                "kept cutouts must equal model tokens for {line:?}"
            );
        }
    }

    #[test]
    fn roman_numeral_blocklist_filters_common_numerals() {
        assert!(is_roman_numeral("ii"));
        assert!(is_roman_numeral("iii"));
        assert!(is_roman_numeral("iv"));
        assert!(is_roman_numeral("v"));
        assert!(is_roman_numeral("ix"));
        assert!(is_roman_numeral("x"));
        assert!(is_roman_numeral("xii"));
        assert!(is_roman_numeral("xx"));
        assert!(is_roman_numeral("xlii"));
        assert!(is_roman_numeral("l"));
    }

    #[test]
    fn roman_numeral_blocklist_case_insensitive() {
        assert!(is_roman_numeral("IV"));
        assert!(is_roman_numeral("XII"));
        assert!(is_roman_numeral("Xlii"));
        assert!(is_roman_numeral("XXX"));
    }

    #[test]
    fn roman_numeral_blocklist_preserves_english_words() {
        assert!(!is_roman_numeral("did"));
        assert!(!is_roman_numeral("vivid"));
        assert!(!is_roman_numeral("livid"));
        assert!(!is_roman_numeral("mid"));
        assert!(!is_roman_numeral("lid"));
        assert!(!is_roman_numeral("dim"));
        assert!(!is_roman_numeral("mill"));
        assert!(!is_roman_numeral("mild"));
        assert!(!is_roman_numeral("vim"));
        assert!(!is_roman_numeral("civic"));
        assert!(!is_roman_numeral("mimic"));
        assert!(!is_roman_numeral("mix"));
        assert!(!is_roman_numeral("civil"));
        assert!(!is_roman_numeral("victim"));
        assert!(!is_roman_numeral("limit"));
        assert!(!is_roman_numeral("climax"));
        assert!(!is_roman_numeral("maxim"));
        assert!(!is_roman_numeral("diva"));
    }

    #[test]
    fn roman_numeral_blocklist_ignores_large_numerals() {
        assert!(!is_roman_numeral("c"));
        assert!(!is_roman_numeral("d"));
        assert!(!is_roman_numeral("m"));
        assert!(!is_roman_numeral("xcix"));
        assert!(!is_roman_numeral("mcmxciv"));
    }

    #[test]
    fn normalizer_preserves_roman_lookalike_words() {
        let tokens = normalizer().normalize_line("I did see a vivid civic display.");
        assert_eq!(
            tokens,
            vec!["I", "did", "see", "a", "vivid", "civic", "display", "."]
        );
    }

    #[test]
    fn normalizer_still_filters_real_roman_numerals() {
        let tokens = normalizer().normalize_line("Chapter IV and section XII are done.");
        assert_eq!(
            tokens,
            vec!["chapter", "and", "section", "are", "done", "."]
        );
    }

    // CanonicalFormTracker tests

    #[test]
    fn tracker_preserves_consistent_capitalisation() {
        let mut tracker = CanonicalFormTracker::new();
        tracker.record("Sally");
        tracker.record("Sally");
        tracker.record("Sally");

        assert_eq!(tracker.get_canonical("Sally"), "Sally");
        assert_eq!(tracker.get_canonical("sally"), "Sally");
    }

    #[test]
    fn tracker_lowercases_mixed_capitalisation() {
        let mut tracker = CanonicalFormTracker::new();
        tracker.record("Hello");
        tracker.record("hello");

        assert_eq!(tracker.get_canonical("Hello"), "hello");
        assert_eq!(tracker.get_canonical("hello"), "hello");
    }

    #[test]
    fn tracker_preserves_acronyms() {
        let mut tracker = CanonicalFormTracker::new();
        tracker.record("NASA");
        tracker.record("NASA");

        assert_eq!(tracker.get_canonical("NASA"), "NASA");
        assert_eq!(tracker.get_canonical("nasa"), "NASA");
    }

    #[test]
    fn tracker_handles_sentence_initial_words() {
        // "The" appears at start of sentences (capitalised) and mid-sentence (lowercase)
        let mut tracker = CanonicalFormTracker::new();
        tracker.record("The");
        tracker.record("the");
        tracker.record("the");

        // Mixed case should normalise to lowercase
        assert_eq!(tracker.get_canonical("The"), "the");
    }

    #[test]
    fn tracker_builds_case_map_correctly() {
        let mut tracker = CanonicalFormTracker::new();
        tracker.record("Sally"); // consistent
        tracker.record("Sally");
        tracker.record("Hello"); // mixed
        tracker.record("hello");
        tracker.record("world"); // all lowercase (no entry needed)

        let map = tracker.build_case_map();

        // Sally should be in the map (needs to preserve casing)
        assert_eq!(map.get("sally"), Some(&"Sally".to_string()));

        // hello should NOT be in the map (mixed case → lowercase, which is default)
        assert_eq!(map.get("hello"), None);

        // world should NOT be in the map (already lowercase)
        assert_eq!(map.get("world"), None);
    }

    #[test]
    fn extract_raw_words_preserves_case() {
        let n = normalizer();
        let words = n.extract_raw_words("Sally said Hello to NASA.");

        assert_eq!(words, vec!["Sally", "said", "Hello", "to", "NASA"]);
    }

    #[test]
    fn extract_raw_words_filters_invalid() {
        let n = normalizer();
        let words = n.extract_raw_words("Chapter IV has 123numbers.");

        // IV is filtered (roman numeral), 123numbers is filtered (starts with digit)
        assert_eq!(words, vec!["Chapter", "has", "numbers"]);
    }

    #[test]
    fn normalizer_uses_corpus_case_map() {
        let mut n = normalizer();

        // Without corpus case map, everything is lowercased
        assert_eq!(n.normalize_line("Sally"), vec!["sally"]);

        // Add corpus case map
        let mut map = HashMap::new();
        map.insert("sally".to_string(), "Sally".to_string());
        n.set_corpus_case_map(map);

        // Now Sally is preserved
        assert_eq!(n.normalize_line("Sally"), vec!["Sally"]);
    }

    // CJK (character-level) tokenisation tests

    #[test]
    fn cjk_each_ideograph_is_its_own_token() {
        // Opening line of the Han-dynasty yuefu poem "Jiangnan": each
        // character becomes a standalone token, and the full-width comma is
        // kept as a punctuation token.
        let tokens = normalizer().normalize_line("江南可采莲，莲叶何田田");
        assert_eq!(
            tokens,
            vec![
                "江", "南", "可", "采", "莲", "，", "莲", "叶", "何", "田", "田"
            ]
        );
    }

    #[test]
    fn cjk_full_width_punctuation_is_tokenised() {
        let tokens = normalizer().normalize_line("四是四。十是十！");
        assert_eq!(tokens, vec!["四", "是", "四", "。", "十", "是", "十", "！"]);
    }

    #[test]
    fn cjk_mixed_with_latin_splits_at_the_boundary() {
        // Latin runs still accumulate; each Han char stands alone.
        let tokens = normalizer().normalize_line("AI是cool的");
        assert_eq!(tokens, vec!["ai", "是", "cool", "的"]);
    }

    #[test]
    fn cjk_repeated_characters_repeat_as_tokens() {
        // "田田" must yield two identical tokens so bigram counts can form.
        let tokens = normalizer().normalize_line("田田");
        assert_eq!(tokens, vec!["田", "田"]);
    }

    #[test]
    fn cjk_raw_tokens_are_all_kept() {
        let raw = normalizer().tokenize_line_raw("小猫。", 1);
        let summary: Vec<(&str, bool)> = raw.iter().map(|t| (t.text.as_str(), t.keep)).collect();
        assert_eq!(summary, vec![("小", true), ("猫", true), ("。", true)]);
    }

    #[test]
    fn cjk_kept_raw_tokens_agree_with_normalize_line() {
        // Same unified-walker invariant as English: cutouts == model tokens.
        let n = normalizer();
        for line in ["江南可采莲，莲叶何田田。", "小壁虎借尾巴", "AI是cool的"] {
            let kept: Vec<String> = n
                .tokenize_line_raw(line, 1)
                .into_iter()
                .filter(|t| t.keep)
                .map(|t| t.text)
                .collect();
            assert_eq!(
                kept,
                n.normalize_line(line),
                "kept must equal model for {line:?}"
            );
        }
    }

    #[test]
    fn is_cjk_ideograph_boundaries() {
        assert!(is_cjk_ideograph('江'));
        assert!(is_cjk_ideograph('\u{4E00}'));
        assert!(is_cjk_ideograph('\u{9FFF}'));
        // Full-width punctuation and Latin letters are NOT ideographs.
        assert!(!is_cjk_ideograph('，'));
        assert!(!is_cjk_ideograph('。'));
        assert!(!is_cjk_ideograph('a'));
        assert!(!is_cjk_ideograph('1'));
    }

    #[test]
    fn allowlist_takes_priority_over_corpus_map() {
        let mut n = normalizer();

        // Add corpus case map that conflicts with allowlist
        let mut map = HashMap::new();
        map.insert("i".to_string(), "i".to_string()); // corpus says lowercase
        n.set_corpus_case_map(map);

        // Allowlist should still win - "I" stays uppercase
        assert_eq!(n.normalize_line("I think"), vec!["I", "think"]);
    }
}
