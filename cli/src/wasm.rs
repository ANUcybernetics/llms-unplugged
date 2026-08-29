//! Browser entry points for the website's in-browser booklet and cutouts
//! generation. Thin wrappers over the same types the CLI uses (`Normalizer`,
//! `Model`, `CutoutSet`, `BookletJson`), so the website and the printed
//! artefacts can never drift apart.

use wasm_bindgen::prelude::*;

use crate::corpus::Frontmatter;
use crate::cutouts::CutoutSet;
use crate::model::Model;
use crate::output::{BookletJson, Metadata};
use crate::text::{CjkMode, Normalizer, NormalizerConfig};

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

fn config(cjk_mode: CjkMode) -> NormalizerConfig {
    NormalizerConfig::new(crate::DEFAULT_PUNCTUATION.chars(), cjk_mode)
}

fn check_n(n: usize) -> Result<(), JsValue> {
    if n < 2 {
        return Err(JsValue::from_str("n must be at least 2"));
    }
    Ok(())
}

fn to_json(value: &impl serde::Serialize) -> Result<String, JsValue> {
    serde_json::to_string(value).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Tokenise arbitrary text into a flat list, using the same normaliser the
/// booklet pipeline uses so the widgets and the printed booklets agree on token
/// boundaries. `word_mode` picks jieba word segmentation (true) or per-character
/// CJK (false); Latin text is unaffected either way. The website loads this on
/// demand only for text containing Chinese — English tokenises synchronously
/// in JS without touching the wasm.
#[wasm_bindgen]
pub fn tokenize(content: &str, word_mode: bool) -> Vec<String> {
    let cjk_mode = if word_mode {
        CjkMode::Words
    } else {
        CjkMode::Chars
    };
    let lines: Vec<&str> = content.lines().collect();
    let normalizer = Normalizer::for_corpus(config(cjk_mode), &lines);
    lines
        .iter()
        .flat_map(|line| normalizer.normalize_line(line))
        .collect()
}

/// The `model.json` for a booklet, as a JSON string for the in-browser
/// Typst compiler.
#[wasm_bindgen]
pub fn process_text_for_booklet(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    check_n(n)?;
    let lines: Vec<&str> = content.lines().collect();
    let normalizer = Normalizer::for_corpus(config(CjkMode::Words), &lines);
    let model = Model::from_lines(n, &normalizer, &lines);
    let frontmatter = Frontmatter {
        title: title.to_string(),
        author: author.to_string(),
        url: Some("https://www.llmsunplugged.org/tools".to_string()),
    };
    let metadata = Metadata::new(
        &frontmatter,
        n,
        normalizer.config().punctuation(),
        Some(model.stats()),
    );
    to_json(&BookletJson::new(metadata, &model.entries(), false))
}

/// The `cutouts.json` for a cutouts sheet, as a JSON string for the
/// in-browser Typst compiler.
#[wasm_bindgen]
pub fn process_text_for_cutouts(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    check_n(n)?;
    let lines: Vec<&str> = content.lines().collect();
    let set = CutoutSet::from_text(
        title.to_string(),
        author.to_string(),
        &lines,
        config(CjkMode::Words),
        n,
    );
    to_json(&set)
}
