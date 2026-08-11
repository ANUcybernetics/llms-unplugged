//! Browser entry points for the website's in-browser booklet and cutouts
//! generation. These are thin wrappers over the same shared pipeline the CLI
//! uses (`NGramCounter::process_lines`, `tokenize_lines_raw`,
//! `format_entries`), so the website and the printed artefacts can never
//! drift apart.

use crate::text::RawToken;
use crate::{
    CjkMode, CutoutsMetadata, Metadata, NGramCounter, Normalizer, NormalizerConfig, format_entries,
    model_type_str,
};
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct BookletOutput {
    metadata: Metadata,
    data: Vec<Vec<serde_json::Value>>,
}

#[derive(Serialize)]
struct CutoutsOutput {
    metadata: CutoutsMetadata,
    tokens: Vec<RawToken>,
}

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Tokenise arbitrary text into a flat list, using the same normaliser the
/// booklet pipeline uses so the widgets and the printed booklets agree on token
/// boundaries. `word_mode` picks jieba word segmentation (true) or per-character
/// CJK (false); Latin text is unaffected either way. Returned as a JSON array of
/// strings. The website loads this on demand only for text containing Chinese —
/// English tokenises synchronously in JS without touching the wasm.
#[wasm_bindgen]
pub fn tokenize(content: &str, word_mode: bool) -> Result<String, JsValue> {
    let mut normalizer = Normalizer::new(NormalizerConfig::new(crate::default_punctuation()));
    normalizer.set_cjk_mode(if word_mode {
        CjkMode::Words
    } else {
        CjkMode::Chars
    });
    let tokens: Vec<String> = content
        .lines()
        .flat_map(|line| normalizer.normalize_line(line))
        .collect();
    serde_json::to_string(&tokens).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn process_text_for_booklet(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    if n < 2 {
        return Err(JsValue::from_str("n must be at least 2"));
    }

    let lines: Vec<&str> = content.lines().collect();
    let mut counter = NGramCounter::new(n, crate::default_punctuation());
    counter.process_lines(&lines);

    let output = BookletOutput {
        metadata: Metadata {
            title: title.to_string(),
            author: author.to_string(),
            url: "https://www.llmsunplugged.org/tools".to_string(),
            n,
            subtitle: format!("A {} language model", model_type_str(n)),
            punctuation: counter.punctuation(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            stats: None,
        },
        data: format_entries(&counter.get_entries(), false),
    };

    serde_json::to_string(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn process_text_for_cutouts(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    if n < 2 {
        return Err(JsValue::from_str("n must be at least 2"));
    }

    let lines: Vec<&str> = content.lines().collect();
    let mut counter = NGramCounter::new(n, crate::default_punctuation());
    counter.process_lines(&lines);
    let tokens = counter.tokenize_lines_raw(&lines);
    let stats = counter.get_stats();

    let metadata = CutoutsMetadata {
        title: title.to_string(),
        author: author.to_string(),
        documents: 1,
        total_tokens: tokens.len(),
        kept_tokens: tokens.iter().filter(|t| t.keep).count(),
        unique_tokens: stats.unique_tokens,
        entropy: stats.entropy,
        perplexity: stats.perplexity,
        branching_factor: stats.branching_factor,
    };

    let output = CutoutsOutput { metadata, tokens };
    serde_json::to_string(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}
