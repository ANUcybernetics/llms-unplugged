//! Browser entry points for the website's in-browser booklet, cutouts and
//! ledger generation. Thin wrappers over the same types the CLI uses
//! (`Normalizer`, `Model`, `CutoutSet`, `LedgerSet`, `BookletJson`), so the
//! website and the printed artefacts can never drift apart.

use wasm_bindgen::prelude::*;

use crate::corpus::Frontmatter;
use crate::cutouts::CutoutSet;
use crate::ledger::{
    DEFAULT_COLUMNS, DEFAULT_ROWS, LedgerSet, check_palette, default_palette, trim_palette,
};
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
    serde_json::to_string(value).map_err(js_error)
}

fn js_error(err: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&err.to_string())
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

/// The `ledger.json` for a ledger set, as a JSON string for the in-browser
/// Typst compiler: the sheets, the counters page and the text page all read
/// it. `colours` is how many of the default palette the room's counters come
/// in, taken from the front of the list and cut back to whole rows of the
/// default columns, exactly as the CLI's `--palette` would be. `sheets` pins
/// the group size; absent, the count follows the corpus at the default rows a
/// page.
#[wasm_bindgen]
pub fn process_text_for_ledger(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
    colours: usize,
    sheets: Option<usize>,
) -> Result<String, JsValue> {
    check_n(n)?;
    if sheets == Some(0) {
        return Err(JsValue::from_str("sheets must be at least 1"));
    }
    let mut palette = default_palette();
    palette.truncate(colours);
    check_palette(&palette, DEFAULT_COLUMNS).map_err(js_error)?;
    trim_palette(&mut palette, DEFAULT_COLUMNS);

    let lines: Vec<&str> = content.lines().collect();
    let set = CutoutSet::from_text(
        title.to_string(),
        author.to_string(),
        &lines,
        config(CjkMode::Words),
        n,
    );
    let ledger = LedgerSet::from_cutouts(set, sheets, DEFAULT_COLUMNS, DEFAULT_ROWS, palette)
        .map_err(js_error)?;
    to_json(&ledger)
}
