use serde::Serialize;
use std::collections::{HashMap, HashSet};

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
    pub case_allowlist: HashMap<String, String>,
}

impl NormalizerConfig {
    pub fn new(punctuation: Vec<char>) -> Self {
        Self {
            punctuation: punctuation.into_iter().collect(),
            case_allowlist: default_case_allowlist(),
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

        let text = if keep {
            self.config
                .case_allowlist
                .get(&lower)
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

        Some(
            self.config
                .case_allowlist
                .get(&lower)
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

fn is_roman_numeral(s: &str) -> bool {
    !s.is_empty()
        && s.chars()
            .all(|c| matches!(c, 'i' | 'v' | 'x' | 'l' | 'c' | 'd' | 'm'))
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
}
