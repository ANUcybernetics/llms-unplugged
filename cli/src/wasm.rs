#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::text::{CanonicalFormTracker, Normalizer, NormalizerConfig, RawToken};
use crate::{NGramCounter, WordFollowEntry};
use serde::Serialize;

#[derive(Serialize)]
struct BookletOutput {
    metadata: BookletMetadata,
    data: Vec<Vec<serde_json::Value>>,
}

#[derive(Serialize)]
struct BookletMetadata {
    title: String,
    author: String,
    url: String,
    n: usize,
    subtitle: String,
    version: String,
}

#[derive(Serialize)]
struct CutoutsOutput {
    metadata: CutoutsMetadata,
    tokens: Vec<RawToken>,
}

#[derive(Serialize)]
struct CutoutsMetadata {
    title: String,
    author: String,
    total_tokens: usize,
    kept_tokens: usize,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn process_text_for_booklet(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    let mut counter = NGramCounter::new(n, crate::default_punctuation());

    for line in content.lines() {
        counter.process_line(line);
    }

    let entries = counter.get_entries();
    let output = build_booklet_json(&entries, title, author, n);

    serde_json::to_string(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn process_text_for_cutouts(
    content: &str,
    title: &str,
    author: &str,
    n: usize,
) -> Result<String, JsValue> {
    let (tokens, metadata) =
        tokenize_for_cutouts(content, title, author, crate::default_punctuation(), n);

    let output = CutoutsOutput { metadata, tokens };

    serde_json::to_string(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn build_booklet_json(
    entries: &[WordFollowEntry],
    title: &str,
    author: &str,
    n: usize,
) -> BookletOutput {
    let formatted_entries: Vec<Vec<serde_json::Value>> = entries
        .iter()
        .map(|entry| {
            let mut formatted_entry_json = Vec::new();
            let previous_words_str = entry.previous_words.join(" ");
            formatted_entry_json.push(serde_json::Value::String(previous_words_str));

            let total_original_count: usize =
                entry.next_words.iter().map(|(_, count)| count).sum();

            let mut original_cumulative_counts = Vec::new();
            let mut running_sum = 0;

            for (next_word, count) in &entry.next_words {
                running_sum += count;
                original_cumulative_counts.push((next_word.clone(), running_sum));
            }

            let (json_total_for_entry, scaled_next_word_values_json) = if total_original_count == 0
            {
                (serde_json::json!(0), Vec::new())
            } else {
                let k_digits = total_original_count.to_string().len() as u32;
                let max_val_for_scaling = 10_u32.pow(k_digits).saturating_sub(1);

                let actual_json_total = serde_json::json!(max_val_for_scaling);
                let scaling_factor = max_val_for_scaling as f64 / total_original_count as f64;

                let next_words_json_list: Vec<serde_json::Value> = original_cumulative_counts
                    .iter()
                    .map(|(next_word, original_cumul)| {
                        let scaled_cumul =
                            (*original_cumul as f64 * scaling_factor).round() as usize;
                        serde_json::json!([next_word, scaled_cumul])
                    })
                    .collect();
                (actual_json_total, next_words_json_list)
            };

            formatted_entry_json.push(json_total_for_entry);
            formatted_entry_json.extend(scaled_next_word_values_json);

            formatted_entry_json
        })
        .collect();

    let model_type = match n {
        1 => "unigram",
        2 => "bigram",
        3 => "trigram",
        _ => "n-gram",
    };

    BookletOutput {
        metadata: BookletMetadata {
            title: title.to_string(),
            author: author.to_string(),
            url: "https://www.llmsunplugged.org/tools".to_string(),
            n,
            subtitle: format!("A {} language model", model_type),
            version: env!("CARGO_PKG_VERSION").to_string(),
        },
        data: formatted_entries,
    }
}

fn tokenize_for_cutouts(
    content: &str,
    title: &str,
    author: &str,
    punctuation: Vec<char>,
    n: usize,
) -> (Vec<RawToken>, CutoutsMetadata) {
    let mut normalizer = Normalizer::new(NormalizerConfig::new(punctuation));

    let content_lines: Vec<&str> = content.lines().collect();
    let mut tracker = CanonicalFormTracker::new();

    for line in &content_lines {
        for word in normalizer.extract_raw_words(line) {
            tracker.record(&word);
        }
    }

    normalizer.set_corpus_case_map(tracker.build_case_map());

    let mut tokens = Vec::new();
    let mut index = 1usize;

    for line in &content_lines {
        let line_tokens = normalizer.tokenize_line_raw(line, index);
        if let Some(last) = line_tokens.last() {
            index = last.index + 1;
        }
        tokens.extend(line_tokens);
    }

    let context_size = n.saturating_sub(1);
    if context_size > 0 {
        let kept_texts: Vec<String> = tokens
            .iter()
            .filter(|t| t.keep)
            .map(|t| t.text.clone())
            .collect();

        let mut kept_idx = 0usize;
        for token in &mut tokens {
            if token.keep {
                if kept_idx >= context_size {
                    token.previous_words =
                        kept_texts[kept_idx - context_size..kept_idx].to_vec();
                }
                kept_idx += 1;
            }
        }
    }

    let kept_tokens = tokens.iter().filter(|t| t.keep).count();

    let metadata = CutoutsMetadata {
        title: title.to_string(),
        author: author.to_string(),
        total_tokens: tokens.len(),
        kept_tokens,
    };

    (tokens, metadata)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_booklet_json_generation() {
        let entries = vec![WordFollowEntry {
            previous_words: vec!["hello".to_string()],
            next_words: vec![("world".to_string(), 2), ("there".to_string(), 1)],
        }];

        let output = build_booklet_json(&entries, "Test", "Author", 2);
        assert_eq!(output.metadata.title, "Test");
        assert_eq!(output.metadata.n, 2);
        assert_eq!(output.data.len(), 1);
    }

    #[test]
    fn test_cutouts_tokenization() {
        let (tokens, metadata) = tokenize_for_cutouts(
            "Hello world. Hello again.",
            "Test",
            "Author",
            crate::default_punctuation(),
            2,
        );

        assert!(tokens.len() > 0);
        assert_eq!(metadata.title, "Test");
        assert!(metadata.kept_tokens > 0);
    }
}
