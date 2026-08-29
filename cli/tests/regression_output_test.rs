use llms_unplugged::{BookletJson, Corpus, Metadata, Model, Normalizer, NormalizerConfig};
use serde_json::json;

/// The booklet JSON for a small fixture, pinned end to end: tokenisation,
/// corpus casing, entry order, raw cumulative counts and the metadata block.
#[test]
fn regression_fixture_output_is_stable() {
    let corpus = Corpus::parse(
        "---\ntitle: Regression Fixture\nauthor: Fixture Author\n\
         url: https://example.com/fixture\n---\nHello world. Hello world again.\n",
    )
    .unwrap();
    let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &corpus.lines);
    let model = Model::from_lines(2, &normalizer, &corpus.lines);
    let metadata = Metadata::new(
        &corpus.frontmatter,
        2,
        normalizer.config().punctuation(),
        Some(model.stats()),
    );

    let output = serde_json::to_value(BookletJson::new(metadata, &model.entries(), true)).unwrap();

    let meta = &output["metadata"];
    assert_eq!(meta["title"], json!("Regression Fixture"));
    assert_eq!(meta["author"], json!("Fixture Author"));
    assert_eq!(meta["url"], json!("https://example.com/fixture"));
    assert_eq!(meta["n"], json!(2));
    assert_eq!(meta["subtitle"], json!("A bigram language model"));
    assert_eq!(meta["punctuation"], json!("!,.:;?、。！，：；？"));
    assert_eq!(meta["stats"]["total_tokens"], json!(7));
    assert_eq!(meta["stats"]["unique_contexts"], json!(4));
    assert_eq!(meta["stats"]["unique_tokens"], json!(4));
    assert_eq!(
        meta["stats"]["most_common_ngram"],
        json!({"context": ["Hello"], "next_word": "world", "count": 2})
    );
    assert_eq!(
        meta["stats"]["most_popular_context"],
        json!({"context": ["Hello"], "count": 2})
    );

    // "Hello" appears consistently capitalised, so it stays "Hello".
    assert_eq!(
        output["data"],
        json!([
            [".", 1, ["Hello", 1]],
            ["again", 1, [".", 1]],
            ["Hello", 2, ["world", 2]],
            ["world", 2, [".", 1], ["again", 2]]
        ]),
        "Data output should stay stable for fixture"
    );
}
