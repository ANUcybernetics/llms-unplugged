//! End-to-end tokenisation through the public API: a corpus's frontmatter and
//! lines in, a model's vocabulary out.

use llms_unplugged::{CjkMode, Corpus, DEFAULT_PUNCTUATION, Model, Normalizer, NormalizerConfig};

fn corpus(body: &str) -> Corpus {
    Corpus::parse(&format!("---\ntitle: T\nauthor: A\n---\n{body}")).unwrap()
}

/// Every token type the model saw, as context or continuation.
fn vocabulary(config: NormalizerConfig, body: &str) -> Vec<String> {
    let corpus = corpus(body);
    let normalizer = Normalizer::for_corpus(config, &corpus.lines);
    Model::from_lines(2, &normalizer, &corpus.lines)
        .entries()
        .iter()
        .flat_map(|entry| {
            let mut tokens = entry.previous_words.clone();
            tokens.extend(entry.next_words.iter().map(|(w, _)| w.clone()));
            tokens
        })
        .collect()
}

fn default_vocabulary(body: &str) -> Vec<String> {
    vocabulary(NormalizerConfig::default(), body)
}

#[test]
fn normalises_case_and_strips_quotes() {
    let tokens = default_vocabulary("'Hello,' she said. hello again.\nHe replied, 'I agree.'");

    // "hello" appears mixed case (Hello + hello), so normalised to lowercase
    assert!(tokens.contains(&"hello".to_string()));
    assert!(tokens.contains(&"agree".to_string()));
    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    // Should not contain the word with punctuation attached
    assert!(!tokens.contains(&"Hello,".to_string()));
}

#[test]
fn keeps_allowlisted_pronouns_cased() {
    let tokens = default_vocabulary("I think I'm sure I've said I'd do it.");
    for pronoun in ["I", "I'm", "I've", "I'd"] {
        assert!(tokens.contains(&pronoun.to_string()), "expected {pronoun}");
    }
    assert!(tokens.contains(&"think".to_string()));
}

#[test]
fn filters_numbers_and_roman_numerals() {
    let tokens = default_vocabulary(
        "Chapter IV and Section3 were finished in 2024.\n\
         The chapter was good and the section was clear.",
    );

    assert!(!tokens.iter().any(|t| t.to_lowercase() == "iv"));
    assert!(!tokens.iter().any(|t| t == "2024"));
    // "chapter" appears with mixed case (Chapter + chapter) -> lowercase
    assert!(tokens.contains(&"chapter".to_string()));
    // "section" appears with mixed case (Section3 stripped to Section + section) -> lowercase
    assert!(tokens.contains(&"section".to_string()));
}

#[test]
fn preserves_contractions_and_possessives() {
    let tokens = default_vocabulary(
        "The bird's nest and the birds' nests weren't gone.\n\
         I don't worry, it'll be fine.\ngoin' to see.",
    );
    for token in ["bird's", "birds'", "weren't", "don't", "it'll", "goin'"] {
        assert!(tokens.contains(&token.to_string()), "expected {token}");
    }
    assert!(!tokens.contains(&"s".to_string()));
}

const PUNCTUATION_CORPUS: &str = "Hello, world. How are you? Great! Now: this; then: that.\n\
    \"Quoted text\" (parenthetical)---an aside.";

#[test]
fn default_punctuation_keeps_all_single_marks() {
    let tokens = default_vocabulary(PUNCTUATION_CORPUS);
    for punct in [".", ",", "!", "?", ";", ":"] {
        assert!(tokens.contains(&punct.to_string()), "expected `{punct}`");
    }
    // Paired punctuation should never appear as tokens.
    for paired in ["\"", "(", ")", "-", "[", "]"] {
        assert!(
            !tokens.contains(&paired.to_string()),
            "unexpected `{paired}`"
        );
    }
}

#[test]
fn only_configured_punctuation_is_kept() {
    let tokens = vocabulary(
        NormalizerConfig::new([',', '.'], CjkMode::Words),
        PUNCTUATION_CORPUS,
    );
    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    for dropped in ["?", "!", ";", ":"] {
        assert!(
            !tokens.contains(&dropped.to_string()),
            "unexpected `{dropped}`"
        );
    }
}

// Two lines of the yuefu poem "Jiangnan".
const JIANGNAN: &str = "江南可采莲，莲叶何田田。\n鱼戏莲叶间。";

#[test]
fn builds_a_bigram_model_from_chinese_characters() {
    let config = NormalizerConfig::new(DEFAULT_PUNCTUATION.chars(), CjkMode::Chars);
    let corpus = corpus(JIANGNAN);
    let normalizer = Normalizer::for_corpus(config.clone(), &corpus.lines);
    let model = Model::from_lines(2, &normalizer, &corpus.lines);
    let tokens = vocabulary(config, JIANGNAN);

    // Each hanzi survives as its own token (not dropped as a separator).
    for hanzi in ["江", "南", "莲", "叶", "田", "鱼"] {
        assert!(
            tokens.contains(&hanzi.to_string()),
            "expected hanzi {hanzi}"
        );
    }
    // Full-width punctuation is kept as a token, just like ASCII punctuation.
    assert!(tokens.contains(&"，".to_string()));
    assert!(tokens.contains(&"。".to_string()));

    // A real bigram edge from the corpus: 莲 is followed by 叶 (莲叶 appears twice).
    let lian = &model.contexts()[&vec!["莲".to_string()]];
    assert_eq!(
        lian.get("叶"),
        Some(&2),
        "莲 should be followed by 叶 twice: {lian:?}"
    );
}

#[test]
fn builds_a_bigram_model_from_chinese_words() {
    // Word mode (the default): jieba cuts the poem into dictionary words such as
    // 江南 and 莲叶 rather than individual characters.
    let tokens = default_vocabulary(JIANGNAN);
    for word in ["江南", "采莲", "莲叶"] {
        assert!(tokens.contains(&word.to_string()), "expected word {word}");
    }
    // The bare character 江 is absorbed into 江南, so it is not a token on its own.
    assert!(!tokens.contains(&"江".to_string()));
    assert!(tokens.contains(&"，".to_string()));
    assert!(tokens.contains(&"。".to_string()));
}

// --- shared tokenisation fixture ------------------------------------------
//
// tests/fixtures/tokenization_cases.json pins the tokeniser's end-to-end
// behaviour (segmentation, roman-numeral blocklist, contraction handling,
// corpus-wide canonical casing) and is ALSO consumed by
// website/test/tokens.test.ts, so the TypeScript port in
// website/src/lib/tokens.ts can never silently drift from this crate.
// After a deliberate tokeniser change, regenerate with:
//
//   cargo test regenerate_tokenization_fixture -- --ignored
//
// and confirm the website test suite still passes against the new fixture.

const FIXTURE_PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/tests/fixtures/tokenization_cases.json"
);

const FIXTURE_INPUTS: &[&str] = &[
    "",
    "Chapter IV and section XII are done.",
    "I did see a vivid civic display. We mix and mill about.",
    "c d m mcmxciv xcix",
    "Sally met Sally at the well. The well was dry.",
    "Hello world. hello again.",
    "I'm sure I'll go, don't you think? The dogs' bowls o' porridge.",
    "Number123 again. 42 said 7bad things.",
    "'Hello,' she said. ''BEST'' 42",
    "\u{2018}Twas the night --- don\u{2019}t stop.",
    "\u{4f60}\u{597d}\u{ff0c}\u{4e16}\u{754c}\u{3002}Hello \u{4e16}\u{754c}!",
    "one <|endoftext|> two",
    "The cat sat.\nthe dog ran.\nThe cat again.",
];

#[derive(serde::Serialize, serde::Deserialize)]
struct FixtureCase {
    input: String,
    tokens: Vec<String>,
}

/// The same corpus-wide pass the model builder uses. Char-level CJK to match
/// the website's pure-TS tokeniser (word-level CJK on the website is
/// exercised through the wasm build instead).
fn tokenize_corpus(text: &str) -> Vec<String> {
    let lines: Vec<&str> = text.lines().collect();
    let config = NormalizerConfig::new(DEFAULT_PUNCTUATION.chars(), CjkMode::Chars);
    let normalizer = Normalizer::for_corpus(config, &lines);
    lines
        .iter()
        .flat_map(|line| normalizer.normalize_line(line))
        .collect()
}

fn computed_fixture_cases() -> Vec<FixtureCase> {
    FIXTURE_INPUTS
        .iter()
        .map(|input| FixtureCase {
            input: (*input).to_string(),
            tokens: tokenize_corpus(input),
        })
        .collect()
}

#[test]
fn tokenization_fixture_is_current() {
    let file = std::fs::read_to_string(FIXTURE_PATH)
        .expect("fixture missing; run: cargo test regenerate_tokenization_fixture -- --ignored");
    let recorded: Vec<FixtureCase> =
        serde_json::from_str(&file).expect("fixture is not valid JSON");
    let computed = computed_fixture_cases();

    assert_eq!(
        recorded.len(),
        computed.len(),
        "fixture case count differs from FIXTURE_INPUTS; regenerate the fixture"
    );
    for (recorded, computed) in recorded.iter().zip(&computed) {
        assert_eq!(
            recorded.input, computed.input,
            "fixture inputs drifted from FIXTURE_INPUTS; regenerate the fixture"
        );
        assert_eq!(
            recorded.tokens, computed.tokens,
            "tokeniser output changed for {:?}; if deliberate, regenerate the fixture and \
             confirm website/src/lib/tokens.ts still agrees (website test suite)",
            recorded.input
        );
    }
}

#[test]
#[ignore = "writes the fixture; run explicitly after a deliberate tokeniser change"]
fn regenerate_tokenization_fixture() {
    let json = serde_json::to_string_pretty(&computed_fixture_cases()).unwrap();
    std::fs::write(FIXTURE_PATH, json + "\n").unwrap();
}
