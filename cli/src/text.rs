use serde::Serialize;
use std::collections::{HashMap, HashSet};

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
/// Used for bucket training cutouts where we show all tokens but mark some as discarded.
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct RawToken {
    pub index: usize,
    pub text: String,
    pub keep: bool,
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

/// Single-surface tokenizer + normalizer used by the CLI.
/// Deterministic rules (order independent):
/// - Normalize apostrophes to ASCII
/// - Keep configured punctuation as standalone tokens
/// - Split on non-letter/non-apostrophe characters
/// - Drop tokens that start with digits
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

    /// Extract raw word tokens from a line, preserving original casing.
    /// Used for first pass to build canonical form tracking.
    /// Returns only valid word tokens (not punctuation, not filtered).
    pub fn extract_raw_words(&self, line: &str) -> Vec<String> {
        let mut words = Vec::new();
        let mut current = String::new();

        for c in line.chars() {
            let normalized_char = normalize_apostrophe(c);

            if self.config.punctuation.contains(&normalized_char) {
                if !current.is_empty() {
                    if let Some(word) = self.clean_word_token(&current) {
                        if self.is_valid_word(&word) {
                            words.push(word);
                        }
                    }
                    current.clear();
                }
            } else if normalized_char.is_ascii_alphabetic() || normalized_char == '\'' {
                current.push(normalized_char);
            } else if !current.is_empty() {
                if let Some(word) = self.clean_word_token(&current) {
                    if self.is_valid_word(&word) {
                        words.push(word);
                    }
                }
                current.clear();
            }
        }

        if !current.is_empty() {
            if let Some(word) = self.clean_word_token(&current) {
                if self.is_valid_word(&word) {
                    words.push(word);
                }
            }
        }

        words
    }

    /// Clean a word token (strip quotes) but preserve original casing
    fn clean_word_token(&self, token: &str) -> Option<String> {
        let mut word = token.trim_start_matches('\'').to_string();

        while word.ends_with('\'') && !looks_like_contraction(&word) {
            word.pop();
        }

        if word.is_empty() { None } else { Some(word) }
    }

    /// Check if a word is valid (not filtered out)
    fn is_valid_word(&self, word: &str) -> bool {
        let starts_with_digit = word
            .chars()
            .next()
            .map(|c| c.is_ascii_digit())
            .unwrap_or(false);
        let lower = word.to_lowercase();
        let is_endoftext = lower == "<|endoftext|>";
        let is_filtered_roman = lower != "i" && is_roman_numeral(&lower);

        !starts_with_digit && !is_endoftext && !is_filtered_roman
    }

    pub fn normalize_line(&self, line: &str) -> Vec<String> {
        let mut tokens = Vec::new();
        let mut current = String::new();

        for c in line.chars() {
            let normalized_char = normalize_apostrophe(c);

            if self.config.punctuation.contains(&normalized_char) {
                if !current.is_empty() {
                    tokens.extend(self.normalize_word_token(&current));
                    current.clear();
                }
                tokens.push(normalized_char.to_string());
            } else if normalized_char.is_ascii_alphabetic() || normalized_char == '\'' {
                current.push(normalized_char);
            } else {
                if !current.is_empty() {
                    tokens.extend(self.normalize_word_token(&current));
                    current.clear();
                }
            }
        }

        if !current.is_empty() {
            tokens.extend(self.normalize_word_token(&current));
        }

        tokens
    }

    /// Tokenize a line returning raw tokens with keep/discard status.
    /// Used for bucket training cutouts where all tokens are shown.
    /// Unlike normalize_line, this preserves digits in tokens so we can show them as discarded.
    pub fn tokenize_line_raw(&self, line: &str, start_index: usize) -> Vec<RawToken> {
        let mut tokens = Vec::new();
        let mut current = String::new();
        let mut index = start_index;

        for c in line.chars() {
            let normalized_char = normalize_apostrophe(c);

            if self.config.punctuation.contains(&normalized_char) {
                if !current.is_empty() {
                    if let Some(token) = self.make_raw_token(&current, index) {
                        tokens.push(token);
                        index += 1;
                    }
                    current.clear();
                }
                tokens.push(RawToken {
                    index,
                    text: normalized_char.to_string(),
                    keep: true,
                });
                index += 1;
            } else if normalized_char.is_ascii_alphanumeric() || normalized_char == '\'' {
                // Include digits (unlike normalize_line) so we can show them as discarded
                current.push(normalized_char);
            } else if !current.is_empty() {
                if let Some(token) = self.make_raw_token(&current, index) {
                    tokens.push(token);
                    index += 1;
                }
                current.clear();
            }
        }

        if !current.is_empty() {
            if let Some(token) = self.make_raw_token(&current, index) {
                tokens.push(token);
            }
        }

        tokens
    }

    fn make_raw_token(&self, token: &str, index: usize) -> Option<RawToken> {
        let mut word = token.trim_start_matches('\'').to_string();

        while word.ends_with('\'') && !looks_like_contraction(&word) {
            word.pop();
        }

        if word.is_empty() {
            return None;
        }

        let starts_with_digit = word
            .chars()
            .next()
            .map(|c| c.is_ascii_digit())
            .unwrap_or(false);
        let lower = word.to_lowercase();
        let is_endoftext = lower == "<|endoftext|>";
        let is_filtered_roman = lower != "i" && is_roman_numeral(&lower);

        let keep = !starts_with_digit && !is_endoftext && !is_filtered_roman;

        // Priority: allowlist > corpus case map > lowercase
        let text = if keep {
            self.config
                .case_allowlist
                .get(&lower)
                .or_else(|| self.config.corpus_case_map.get(&lower))
                .cloned()
                .unwrap_or(lower)
        } else {
            word
        };

        Some(RawToken { index, text, keep })
    }

    fn normalize_word_token(&self, token: &str) -> Option<String> {
        let mut word = token.trim_start_matches('\'').to_string();

        while word.ends_with('\'') && !looks_like_contraction(&word) {
            word.pop();
        }

        if word.is_empty() {
            return None;
        }

        if word
            .chars()
            .next()
            .map(|c| c.is_ascii_digit())
            .unwrap_or(false)
        {
            return None;
        }

        let lower = word.to_lowercase();

        if lower == "<|endoftext|>" {
            return None;
        }

        if lower != "i" && is_roman_numeral(&lower) {
            return None;
        }

        // Priority: allowlist > corpus case map > lowercase
        Some(
            self.config
                .case_allowlist
                .get(&lower)
                .or_else(|| self.config.corpus_case_map.get(&lower))
                .cloned()
                .unwrap_or(lower),
        )
    }
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
        let tokens = normalizer().normalize_line("Hello, world. How are you?");
        assert_eq!(
            tokens,
            vec!["hello", ",", "world", ".", "how", "are", "you"]
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
                keep: true
            }
        );
        assert_eq!(
            tokens[1],
            RawToken {
                index: 2,
                text: "IV".to_string(),
                keep: false
            }
        ); // roman numeral
        assert_eq!(
            tokens[2],
            RawToken {
                index: 3,
                text: "is".to_string(),
                keep: true
            }
        );
        assert_eq!(
            tokens[3],
            RawToken {
                index: 4,
                text: "good".to_string(),
                keep: true
            }
        );
        assert_eq!(
            tokens[4],
            RawToken {
                index: 5,
                text: ".".to_string(),
                keep: true
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
    fn raw_tokens_marks_numbers_as_discard() {
        let tokens = normalizer().tokenize_line_raw("test 123bad word", 1);
        assert_eq!(tokens.len(), 3);
        assert_eq!(
            tokens[0],
            RawToken {
                index: 1,
                text: "test".to_string(),
                keep: true
            }
        );
        assert_eq!(
            tokens[1],
            RawToken {
                index: 2,
                text: "123bad".to_string(),
                keep: false
            }
        );
        assert_eq!(
            tokens[2],
            RawToken {
                index: 3,
                text: "word".to_string(),
                keep: true
            }
        );
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
