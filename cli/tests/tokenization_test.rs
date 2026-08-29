use llms_unplugged::{CjkMode, NGramCounter, default_punctuation};
use std::fs::File;
use std::io::Write;
use tempfile::NamedTempFile;

fn collect_tokens(counter: &llms_unplugged::NGramCounter) -> Vec<String> {
    counter
        .get_entries()
        .iter()
        .flat_map(|entry| {
            let mut tokens = entry.previous_words.clone();
            tokens.extend(entry.next_words.iter().map(|(w, _)| w.clone()));
            tokens
        })
        .collect()
}

#[test]
fn normalises_case_and_strips_quotes() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Quotes")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // "Hello" appears with mixed case -> lowercase
        // "she" appears consistently lowercase
        writeln!(file, "'Hello,' she said. hello again.")?;
        writeln!(file, "He replied, 'I agree.'")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // "hello" appears mixed case (Hello + hello), so normalised to lowercase
    assert!(tokens.contains(&"hello".to_string()));
    // "agree" appears once capitalised, stays capitalised (single occurrence)
    // But actually it's lowercase in the input 'I agree', so stays lowercase
    assert!(tokens.contains(&"agree".to_string()));
    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    // Should not contain the word with punctuation attached
    assert!(!tokens.contains(&"Hello,".to_string()));

    Ok(())
}

#[test]
fn keeps_allowlisted_pronouns_cased() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Pronouns")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "I think I'm sure I've said I'd do it.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    for pronoun in ["I", "I'm", "I've", "I'd"] {
        assert!(
            tokens.contains(&pronoun.to_string()),
            "Expected allowlisted pronoun {}",
            pronoun
        );
    }
    assert!(tokens.contains(&"think".to_string()));

    Ok(())
}

#[test]
fn filters_numbers_and_roman_numerals() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Numbers")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // Add mixed case to test lowercase normalisation
        writeln!(file, "Chapter IV and Section3 were finished in 2024.")?;
        writeln!(file, "The chapter was good and the section was clear.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // Roman numerals should be filtered
    assert!(!tokens.iter().any(|t| t.to_lowercase() == "iv"));
    // Pure numbers should be filtered
    assert!(!tokens.iter().any(|t| t == "2024"));
    // "chapter" appears with mixed case (Chapter + chapter) -> lowercase
    assert!(tokens.contains(&"chapter".to_string()));
    // "section" appears with mixed case (Section3 stripped to Section + section) -> lowercase
    assert!(tokens.contains(&"section".to_string()));

    Ok(())
}

#[test]
fn preserves_contractions_and_possessives() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Apostrophes")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "The bird's nest and the birds' nests weren't gone.")?;
        // Use lowercase "don't" to ensure consistent case
        writeln!(file, "I don't worry, it'll be fine.")?;
        writeln!(file, "goin' to see.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // All these contractions appear consistently lowercase
    for token in ["bird's", "birds'", "weren't", "don't", "it'll", "goin'"] {
        assert!(
            tokens.contains(&token.to_string()),
            "Expected token {}",
            token
        );
    }

    assert!(!tokens.contains(&"s".to_string()));

    Ok(())
}

fn write_punctuation_corpus(path: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = File::create(path)?;
    writeln!(file, "---")?;
    writeln!(file, "title: Test Punctuation")?;
    writeln!(file, "author: Test")?;
    writeln!(file, "url: https://example.com")?;
    writeln!(file, "---")?;
    writeln!(
        file,
        "Hello, world. How are you? Great! Now: this; then: that."
    )?;
    // Paired punctuation (quotes, brackets, em-dashes) should be stripped, not
    // emitted as tokens.
    writeln!(file, "\"Quoted text\" (parenthetical)---an aside.")?;
    file.flush()?;
    Ok(())
}

fn write_jiangnan_corpus(path: &std::path::Path) -> std::io::Result<()> {
    let mut file = File::create(path)?;
    writeln!(file, "---")?;
    writeln!(file, "title: 江南")?;
    writeln!(file, "author: 汉乐府")?;
    writeln!(file, "url: https://example.com")?;
    writeln!(file, "---")?;
    // Two lines of the yuefu poem "Jiangnan".
    writeln!(file, "江南可采莲，莲叶何田田。")?;
    writeln!(file, "鱼戏莲叶间。")?;
    file.flush()
}

#[test]
fn builds_a_bigram_model_from_chinese_characters() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    write_jiangnan_corpus(&path)?;

    // Char mode: each hanzi is a token and the full-width comma is punctuation.
    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.set_cjk_mode(CjkMode::Chars);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

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
    let lian = counter
        .get_entries()
        .into_iter()
        .find(|e| e.previous_words == vec!["莲".to_string()])
        .expect("莲 should have successors");
    assert!(
        lian.next_words.iter().any(|(w, _)| w == "叶"),
        "莲 should be followed by 叶, got {:?}",
        lian.next_words
    );

    Ok(())
}

#[test]
fn builds_a_bigram_model_from_chinese_words() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    write_jiangnan_corpus(&path)?;

    // Word mode (the default): jieba cuts the poem into dictionary words such as
    // 江南 and 莲叶 rather than individual characters.
    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    for word in ["江南", "采莲", "莲叶"] {
        assert!(tokens.contains(&word.to_string()), "expected word {word}");
    }
    // The bare character 江 is absorbed into 江南, so it is not a token on its own.
    assert!(
        !tokens.contains(&"江".to_string()),
        "江 should be part of 江南, not a standalone token"
    );
    assert!(tokens.contains(&"，".to_string()));
    assert!(tokens.contains(&"。".to_string()));

    Ok(())
}

#[test]
fn default_punctuation_keeps_all_single_marks() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    write_punctuation_corpus(&path)?;

    let mut counter = NGramCounter::new(2, default_punctuation());
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    for punct in [".", ",", "!", "?", ";", ":"] {
        assert!(
            tokens.contains(&punct.to_string()),
            "Expected `{punct}` to be kept by default"
        );
    }

    // Paired punctuation should never appear as tokens.
    for paired in ["\"", "(", ")", "-", "[", "]"] {
        assert!(
            !tokens.contains(&paired.to_string()),
            "Did not expect `{paired}` as a token"
        );
    }

    Ok(())
}

#[test]
fn only_configured_punctuation_is_kept() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    write_punctuation_corpus(&path)?;

    // Override the default with a narrow set: only `.` and `,`.
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    assert!(!tokens.contains(&"?".to_string()));
    assert!(!tokens.contains(&"!".to_string()));
    assert!(!tokens.contains(&";".to_string()));
    assert!(!tokens.contains(&":".to_string()));

    Ok(())
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

/// The full two-pass pipeline `NGramCounter::process_lines` uses: track
/// surface forms, build the corpus case map, then normalise. Char-level CJK
/// to match the website's pure-TS tokeniser (word-level CJK on the website
/// is exercised through the wasm build instead).
fn tokenize_corpus(text: &str) -> Vec<String> {
    use llms_unplugged::{CanonicalFormTracker, Normalizer, NormalizerConfig};

    let mut normalizer = Normalizer::new(NormalizerConfig::new(default_punctuation()));
    normalizer.set_cjk_mode(CjkMode::Chars);
    let mut tracker = CanonicalFormTracker::new();
    for line in text.lines() {
        for word in normalizer.extract_raw_words(line) {
            tracker.record(&word);
        }
    }
    normalizer.set_corpus_case_map(tracker.build_case_map());
    text.lines()
        .flat_map(|line| normalizer.normalize_line(line))
        .collect()
}

fn computed_fixture_cases() -> Vec<FixtureCase> {
    FIXTURE_INPUTS
        .iter()
        .map(|input| FixtureCase {
            input: input.to_string(),
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
