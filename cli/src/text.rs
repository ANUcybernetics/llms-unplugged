use jieba_rs::Jieba;
use std::collections::{BTreeSet, HashMap, HashSet};
use std::sync::OnceLock;

/// How runs of Chinese characters are cut into tokens.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
#[cfg_attr(feature = "cli", derive(clap::ValueEnum))]
pub enum CjkMode {
    /// Jieba word segmentation --- 深圳 / 最高 / 的 / 楼 --- the natural reading
    /// unit and the default. A "word" may be one or several characters.
    #[default]
    #[cfg_attr(feature = "cli", value(name = "word"))]
    Words,
    /// One token per ideograph --- 深 / 圳 / 最 / 高 --- the simpler, fully
    /// transparent rule, kept as a teaching option.
    #[cfg_attr(feature = "cli", value(name = "char"))]
    Chars,
}

/// Process-wide jieba segmenter, built at most once and only when word-mode
/// Chinese is actually encountered. Loading the ~5 MB dictionary is not free,
/// so an English corpus (or char-mode Chinese) never pays for it.
fn jieba() -> &'static Jieba {
    static JIEBA: OnceLock<Jieba> = OnceLock::new();
    JIEBA.get_or_init(Jieba::new)
}

/// Default punctuation kept as standalone tokens. Covers the unpaired marks
/// that carry sentence structure; paired marks (quotes, brackets, em-dashes)
/// are intentionally excluded because they don't behave well in n-grams. The
/// full-width block (。，、！？；：) is the Chinese equivalent, kept so CJK
/// corpora box their punctuation the same way English ones do.
pub const DEFAULT_PUNCTUATION: &str = ".,!?;:。，、！？；：";

/// One token of a line as the tokeniser saw it: the text, and whether the
/// model keeps it. Digit runs and roman numerals come back with `keep:
/// false` so the cutouts activity can show what the model dropped.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    pub text: String,
    pub keep: bool,
}

/// The corpus-independent tokeniser settings: which marks survive as
/// punctuation tokens, and how Chinese is segmented.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct NormalizerConfig {
    /// Sorted, so [`NormalizerConfig::punctuation`] is deterministic however
    /// the set was given.
    punctuation: BTreeSet<char>,
    cjk_mode: CjkMode,
}

impl Default for NormalizerConfig {
    fn default() -> Self {
        Self::new(DEFAULT_PUNCTUATION.chars(), CjkMode::default())
    }
}

impl NormalizerConfig {
    pub fn new(punctuation: impl IntoIterator<Item = char>, cjk_mode: CjkMode) -> Self {
        Self {
            punctuation: punctuation.into_iter().collect(),
            cjk_mode,
        }
    }

    /// The punctuation marks kept as standalone tokens, as a sorted string.
    pub fn punctuation(&self) -> String {
        self.punctuation.iter().collect()
    }

    pub fn cjk_mode(&self) -> CjkMode {
        self.cjk_mode
    }
}

/// The single tokeniser + normaliser every pipeline uses. Immutable once
/// built: the corpus-wide casing decisions are made in
/// [`Normalizer::for_corpus`], so a normaliser handed to the model builder,
/// the cutouts tokeniser and the sampling prompt is guaranteed to be the same
/// one.
///
/// Deterministic rules (order independent):
/// - Normalize apostrophes to ASCII
/// - Keep configured punctuation as standalone tokens
/// - Split on non-letter/non-apostrophe characters (digit runs are their own
///   segments: skipped by the model, shown as discarded by cutouts)
/// - Drop roman numerals (except the allowlisted "I" forms)
/// - Apply allowlist casing, then corpus casing; otherwise lowercase
#[derive(Debug, Clone)]
pub struct Normalizer {
    config: NormalizerConfig,
    /// Lowercase form → the one surface form the corpus used, for words whose
    /// capitalisation was consistent (see [`corpus_case_map`]).
    case_map: HashMap<String, String>,
}

impl Normalizer {
    /// A normaliser with no corpus-specific casing: every word not on the
    /// allowlist is lowercased.
    pub fn new(config: NormalizerConfig) -> Self {
        Self {
            config,
            case_map: HashMap::new(),
        }
    }

    /// A normaliser whose casing follows the corpus: a word that only ever
    /// appears one way keeps that form ("Sally", "NASA"), a word that appears
    /// both ways is lowercased ("The"/"the" → "the").
    pub fn for_corpus<S: AsRef<str>>(config: NormalizerConfig, lines: &[S]) -> Self {
        let bare = Self::new(config);
        let words = lines
            .iter()
            .flat_map(|line| bare.extract_raw_words(line.as_ref()));
        Self {
            case_map: corpus_case_map(words),
            config: bare.config,
        }
    }

    pub fn config(&self) -> &NormalizerConfig {
        &self.config
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
        // Chinese has no inter-word spaces, so we accumulate a run of adjacent
        // ideographs and cut it as a unit when the run ends (at punctuation, a
        // Latin letter, a digit, or any separator). How it is cut --- jieba
        // words or one token per character --- is decided by `flush_cjk`.
        let mut cjk = String::new();

        for c in line.chars() {
            let c = normalize_apostrophe(c);

            if self.config.punctuation.contains(&c) {
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
                self.flush_cjk(&mut cjk, &mut segments);
                segments.push(Segment::Punct(c));
            } else if is_cjk_ideograph(c) {
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
                cjk.push(c);
            } else if c.is_ascii_alphabetic() || c == '\'' {
                flush(&mut digits, Segment::Digits, &mut segments);
                self.flush_cjk(&mut cjk, &mut segments);
                word.push(c);
            } else if c.is_ascii_digit() {
                flush(&mut word, Segment::Word, &mut segments);
                self.flush_cjk(&mut cjk, &mut segments);
                digits.push(c);
            } else {
                flush(&mut word, Segment::Word, &mut segments);
                flush(&mut digits, Segment::Digits, &mut segments);
                self.flush_cjk(&mut cjk, &mut segments);
            }
        }
        flush(&mut word, Segment::Word, &mut segments);
        flush(&mut digits, Segment::Digits, &mut segments);
        self.flush_cjk(&mut cjk, &mut segments);

        segments
    }

    /// Cut an accumulated run of Chinese characters into Word segments. In
    /// `Words` mode jieba splits the run into dictionary words; in `Chars` mode
    /// each ideograph becomes its own token (the original behaviour). Either way
    /// the pieces route through the same word pipeline, where the English-only
    /// case and roman-numeral rules are no-ops on Han characters.
    fn flush_cjk(&self, buf: &mut String, segments: &mut Vec<Segment>) {
        if buf.is_empty() {
            return;
        }
        let run = std::mem::take(buf);
        match self.config.cjk_mode {
            CjkMode::Chars => {
                for c in run.chars() {
                    segments.push(Segment::Word(c.to_string()));
                }
            }
            CjkMode::Words => {
                for w in jieba().cut(&run, true) {
                    segments.push(Segment::Word(w.to_string()));
                }
            }
        }
    }

    /// The valid word tokens of a line with their original casing: what the
    /// corpus case map is built from.
    fn extract_raw_words(&self, line: &str) -> Vec<String> {
        self.segments(line)
            .into_iter()
            .filter_map(|seg| match seg {
                Segment::Word(w) => clean_word(&w),
                _ => None,
            })
            .filter(|w| is_valid_word(w))
            .collect()
    }

    /// Canonical casing: allowlist > corpus case map > lowercase.
    fn canonical_case(&self, word: &str) -> String {
        let lower = word.to_lowercase();
        if let Some(cased) = allowlisted_case(&lower) {
            return cased.to_string();
        }
        self.case_map.get(&lower).cloned().unwrap_or(lower)
    }

    /// The model's tokens for a line: normalised words and punctuation marks,
    /// with digit runs and roman numerals dropped.
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

    /// Every token of a line with its keep/discard status. Kept tokens agree
    /// with [`Normalizer::normalize_line`] by construction.
    pub fn tokenize_line(&self, line: &str) -> Vec<Token> {
        self.segments(line)
            .into_iter()
            .filter_map(|seg| match seg {
                Segment::Word(w) => self.make_token(&w),
                Segment::Punct(c) => Some(Token {
                    text: c.to_string(),
                    keep: true,
                }),
                Segment::Digits(d) => Some(Token {
                    text: d,
                    keep: false,
                }),
            })
            .collect()
    }

    fn make_token(&self, token: &str) -> Option<Token> {
        let word = clean_word(token)?;
        let keep = is_valid_word(&word);

        // Discarded words keep their original surface form so the cutout
        // shows exactly what was dropped.
        let text = if keep {
            self.canonical_case(&word)
        } else {
            word
        };

        Some(Token { text, keep })
    }

    fn normalize_word_token(&self, token: &str) -> Option<String> {
        let word = clean_word(token)?;
        if !is_valid_word(&word) {
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

/// Decide each word's canonical casing from every surface form the corpus
/// used: one consistent form is kept as-is, mixed forms collapse to
/// lowercase. Only words that keep a non-lowercase form appear in the map,
/// since lowercase is the fallback anyway.
fn corpus_case_map(words: impl IntoIterator<Item = String>) -> HashMap<String, String> {
    let mut surface_forms: HashMap<String, HashSet<String>> = HashMap::new();
    for word in words {
        surface_forms
            .entry(word.to_lowercase())
            .or_default()
            .insert(word);
    }

    surface_forms
        .into_iter()
        .filter_map(|(lower, forms)| {
            if forms.len() != 1 {
                return None;
            }
            let form = forms.into_iter().next()?;
            (form != lower).then_some((lower, form))
        })
        .collect()
}

/// Clean a word token (strip quotes) but preserve original casing
fn clean_word(token: &str) -> Option<String> {
    let mut word = token.trim_start_matches('\'').to_string();

    while word.ends_with('\'') && !looks_like_contraction(&word) {
        word.pop();
    }

    if word.is_empty() { None } else { Some(word) }
}

/// Words consist of letters and apostrophes by construction (digits act
/// as separators in the walker), so the only filter left is the roman
/// numeral blocklist (with "I" allowlisted).
fn is_valid_word(word: &str) -> bool {
    let lower = word.to_lowercase();
    lower == "i" || !is_roman_numeral(&lower)
}

/// True for CJK ideographs — the characters we treat as standalone
/// (character-level) tokens. Covers the common Unified Ideographs block plus
/// Extension A, Compatibility Ideographs, and Extension B, which is ample for
/// the texts this project targets. Full-width CJK punctuation (。，！? etc.) is
/// deliberately excluded: it lives in the punctuation set instead, so it boxes
/// like ASCII punctuation rather than becoming a word token.
pub(crate) fn is_cjk_ideograph(c: char) -> bool {
    matches!(c as u32,
        0x3400..=0x4DBF     // CJK Extension A
        | 0x4E00..=0x9FFF   // CJK Unified Ideographs
        | 0xF900..=0xFAFF   // CJK Compatibility Ideographs
        | 0x2_0000..=0x2_A6DF // CJK Extension B
    )
}

/// A dictionary-order sort key for a vocabulary token.
///
/// Chinese words sort by their toneless pinyin romanisation --- 电脑 ("diannao")
/// before 手机 ("shouji"), matching how a printed Chinese dictionary is ordered
/// --- which keeps hanzi lookups tractable as the booklets grow. Each syllable
/// is space-separated so syllable boundaries compare cleanly. Everything else
/// (Latin words, digits, punctuation) falls back to a case-insensitive key of
/// its own text, so English corpora order exactly as they did before.
pub fn sort_key(word: &str) -> String {
    use pinyin::ToPinyin;

    if !word.chars().any(is_cjk_ideograph) {
        return word.to_lowercase();
    }

    let mut key = String::new();
    for (c, syllable) in word.chars().zip(word.to_pinyin()) {
        match syllable {
            Some(p) => key.push_str(p.plain()),
            // Non-hanzi characters inside a CJK word keep their own lowercase form.
            None => key.extend(c.to_lowercase()),
        }
        key.push(' ');
    }
    key
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

/// Casing that always wins, whatever the corpus does: the pronoun "I" and
/// its contractions.
fn allowlisted_case(lower: &str) -> Option<&'static str> {
    match lower {
        "i" => Some("I"),
        "i'm" => Some("I'm"),
        "i've" => Some("I've"),
        "i'd" => Some("I'd"),
        "i'll" => Some("I'll"),
        _ => None,
    }
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
        Normalizer::new(NormalizerConfig::default())
    }

    /// A normalizer pinned to char-level CJK segmentation (the non-default mode).
    fn char_normalizer() -> Normalizer {
        Normalizer::new(NormalizerConfig::new(
            DEFAULT_PUNCTUATION.chars(),
            CjkMode::Chars,
        ))
    }

    fn legacy_normalizer() -> Normalizer {
        Normalizer::new(NormalizerConfig::new([',', '.'], CjkMode::Words))
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
    fn punctuation_string_is_sorted_and_deduplicated() {
        let config = NormalizerConfig::new("!.,.".chars(), CjkMode::Words);
        assert_eq!(config.punctuation(), "!,.");
    }

    fn summary(tokens: &[Token]) -> Vec<(&str, bool)> {
        tokens.iter().map(|t| (t.text.as_str(), t.keep)).collect()
    }

    #[test]
    fn tokens_include_all_with_keep_status() {
        let tokens = normalizer().tokenize_line("Chapter IV is good.");
        assert_eq!(
            summary(&tokens),
            vec![
                ("chapter", true),
                ("IV", false),
                ("is", true),
                ("good", true),
                (".", true)
            ]
        );
    }

    #[test]
    fn tokens_split_digit_runs_as_discards() {
        // A digit run is its own discarded token and the adjacent word is
        // kept — matching exactly what normalize_line feeds the model
        // ("bad" is a model token for this input).
        let tokens = normalizer().tokenize_line("test 123bad word");
        assert_eq!(
            summary(&tokens),
            vec![
                ("test", true),
                ("123", false),
                ("bad", true),
                ("word", true)
            ]
        );
    }

    #[test]
    fn kept_tokens_agree_with_normalize_line() {
        // The core invariant of the unified walker: the kept cutouts are
        // exactly the tokens the booklet model is built from --- in English
        // and in both CJK modes.
        for (n, lines) in [
            (
                normalizer(),
                vec![
                    "Chapter IV is 123good and Section3 is fine.",
                    "test 123bad word, don't stop",
                    "Number123 again. I think I'm fine.",
                    "'Hello,' she said. ''BEST'' 42",
                    "江南可采莲，莲叶何田田。",
                    "小壁虎借尾巴",
                    "AI是cool的",
                ],
            ),
            (
                char_normalizer(),
                vec!["江南可采莲，莲叶何田田。", "小壁虎借尾巴", "AI是cool的"],
            ),
        ] {
            for line in lines {
                let kept: Vec<String> = n
                    .tokenize_line(line)
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
    }

    #[test]
    fn roman_numeral_blocklist_filters_common_numerals() {
        for numeral in ["ii", "iii", "iv", "v", "ix", "x", "xii", "xx", "xlii", "l"] {
            assert!(is_roman_numeral(numeral), "{numeral}");
        }
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
        for word in [
            "did", "vivid", "livid", "mid", "lid", "dim", "mill", "mild", "vim", "civic", "mimic",
            "mix", "civil", "victim", "limit", "climax", "maxim", "diva",
        ] {
            assert!(!is_roman_numeral(word), "{word}");
        }
    }

    #[test]
    fn roman_numeral_blocklist_ignores_large_numerals() {
        for numeral in ["c", "d", "m", "xcix", "mcmxciv"] {
            assert!(!is_roman_numeral(numeral), "{numeral}");
        }
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

    // Corpus casing

    fn case_map(words: &[&str]) -> HashMap<String, String> {
        corpus_case_map(words.iter().map(|w| (*w).to_string()))
    }

    #[test]
    fn corpus_case_map_keeps_consistent_forms_and_drops_the_rest() {
        let map = case_map(&["Sally", "Sally", "NASA", "Hello", "hello", "world"]);
        // Consistent non-lowercase forms are recorded.
        assert_eq!(map.get("sally"), Some(&"Sally".to_string()));
        assert_eq!(map.get("nasa"), Some(&"NASA".to_string()));
        // Mixed case collapses to lowercase, which is the default, so no entry.
        assert_eq!(map.get("hello"), None);
        // Already lowercase needs no entry either.
        assert_eq!(map.get("world"), None);
    }

    #[test]
    fn corpus_case_map_lowercases_sentence_initial_words() {
        // "The" at the start of sentences plus "the" mid-sentence is mixed.
        let map = case_map(&["The", "the", "the"]);
        assert_eq!(map.get("the"), None);
    }

    #[test]
    fn for_corpus_applies_corpus_casing() {
        let plain = normalizer();
        assert_eq!(plain.normalize_line("Sally"), vec!["sally"]);

        let corpus = Normalizer::for_corpus(
            NormalizerConfig::default(),
            &["Sally said Hello to NASA.", "hello again"],
        );
        assert_eq!(
            corpus.normalize_line("Sally said Hello to NASA."),
            vec!["Sally", "said", "hello", "to", "NASA", "."]
        );
        // The case map also applies to text the corpus never contained, which
        // is what lets a sampling prompt match the model's vocabulary.
        assert_eq!(corpus.normalize_line("SALLY"), vec!["Sally"]);
    }

    #[test]
    fn allowlist_takes_priority_over_corpus_casing() {
        // The corpus only ever writes "i" lowercase; the allowlist still wins.
        let n = Normalizer::for_corpus(NormalizerConfig::default(), &["i think i know"]);
        assert_eq!(n.normalize_line("i think"), vec!["I", "think"]);
    }

    // CJK char-level tokenisation tests (the non-default `Chars` mode).

    #[test]
    fn cjk_each_ideograph_is_its_own_token() {
        // Opening line of the Han-dynasty yuefu poem "Jiangnan": in char mode
        // each character becomes a standalone token, and the full-width comma is
        // kept as a punctuation token.
        let tokens = char_normalizer().normalize_line("江南可采莲，莲叶何田田");
        assert_eq!(
            tokens,
            vec![
                "江", "南", "可", "采", "莲", "，", "莲", "叶", "何", "田", "田"
            ]
        );
    }

    #[test]
    fn cjk_full_width_punctuation_is_tokenised() {
        let tokens = char_normalizer().normalize_line("四是四。十是十！");
        assert_eq!(tokens, vec!["四", "是", "四", "。", "十", "是", "十", "！"]);
    }

    #[test]
    fn cjk_mixed_with_latin_splits_at_the_boundary() {
        // Latin runs still accumulate; each Han char stands alone in char mode.
        let tokens = char_normalizer().normalize_line("AI是cool的");
        assert_eq!(tokens, vec!["ai", "是", "cool", "的"]);
    }

    #[test]
    fn cjk_tokens_are_all_kept() {
        let tokens = char_normalizer().tokenize_line("小猫。");
        assert_eq!(
            summary(&tokens),
            vec![("小", true), ("猫", true), ("。", true)]
        );
    }

    // CJK word-level tokenisation tests (jieba, the default `Words` mode).

    #[test]
    fn cjk_words_segment_the_jiangnan_line() {
        // The default word mode cuts the run into dictionary words rather than
        // characters; the full-width comma still boxes as its own token.
        let tokens = normalizer().normalize_line("江南可采莲，莲叶何田田");
        assert_eq!(tokens, vec!["江南", "可", "采莲", "，", "莲叶", "何田田"]);
    }

    #[test]
    fn cjk_words_keep_multi_character_words_intact() {
        // 小猫 ("kitten") is one word, not two characters, in word mode.
        let tokens = normalizer().normalize_line("小猫。");
        assert_eq!(tokens, vec!["小猫", "。"]);
    }

    #[test]
    fn cjk_words_still_split_at_latin_boundaries() {
        let tokens = normalizer().normalize_line("AI是cool的");
        assert_eq!(tokens, vec!["ai", "是", "cool", "的"]);
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
    fn sort_key_orders_chinese_by_pinyin() {
        // 电脑 "diannao" sorts before 手机 "shouji" (dictionary order), even
        // though 手 (U+624B) precedes 电 (U+7535) by codepoint.
        assert!(sort_key("电脑") < sort_key("手机"));
        assert_eq!(sort_key("电脑"), "dian nao ");
        // Latin words are untouched and remain case-insensitive.
        assert_eq!(sort_key("Hello"), "hello");
        assert!(sort_key("apple") < sort_key("Banana"));
    }
}
