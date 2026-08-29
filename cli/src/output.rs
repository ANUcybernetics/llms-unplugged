//! The booklet's wire format: what `model.json` holds and `book.typ` reads.

use std::fs::File;
use std::path::Path;

use serde::Serialize;

use crate::corpus::Frontmatter;
use crate::error::Result;
use crate::model::{ProcessingStats, WordFollowEntry, format_entries, model_type_str};

/// Booklet metadata: the corpus's provenance, the model's parameters, and
/// (optionally) its statistics.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Metadata {
    pub title: String,
    pub author: String,
    /// Source URL, or empty when the frontmatter gave none.
    pub url: String,
    /// Size of n-gram used for processing
    pub n: usize,
    /// Subtitle for the booklet, e.g. "A bigram language model" or "A trigram
    /// language model: A–K (Book 1 of 3)"; see [`booklet_subtitle`].
    pub subtitle: String,
    /// Punctuation marks kept as standalone tokens (e.g. ".,!?;:"). The Typst
    /// template uses this to decide which tokens get a rounded box.
    pub punctuation: String,
    /// CLI version used to generate this model
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stats: Option<ProcessingStats>,
}

impl Metadata {
    pub fn new(
        frontmatter: &Frontmatter,
        n: usize,
        punctuation: String,
        stats: Option<ProcessingStats>,
    ) -> Self {
        Metadata {
            title: frontmatter.title.clone(),
            author: frontmatter.author.clone(),
            url: frontmatter.url.clone().unwrap_or_default(),
            n,
            subtitle: booklet_subtitle(n, None),
            punctuation,
            version: env!("CARGO_PKG_VERSION").to_string(),
            stats,
        }
    }

    /// The same metadata retitled for one volume of a multi-book split.
    #[must_use]
    pub fn for_book(&self, index: usize, total_books: usize, range: &str) -> Self {
        Metadata {
            subtitle: booklet_subtitle(self.n, Some((index, total_books, range))),
            ..self.clone()
        }
    }
}

/// The subtitle printed under the title: the model type, plus the volume's
/// letter range and position when the model is split across books
/// (`(index, total, range)`, index counted from zero).
pub fn booklet_subtitle(n: usize, book: Option<(usize, usize, &str)>) -> String {
    let base = format!("A {} language model", model_type_str(n));
    match book {
        None => base,
        Some((index, total, range)) => {
            format!(
                "{base}: {} (Book {} of {total})",
                range.replace('-', "–"),
                index + 1
            )
        }
    }
}

/// `model.json`: metadata plus the dice-scaled rows of [`format_entries`].
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BookletJson {
    pub metadata: Metadata,
    pub data: Vec<Vec<serde_json::Value>>,
}

impl BookletJson {
    pub fn new(metadata: Metadata, entries: &[WordFollowEntry], raw: bool) -> Self {
        Self {
            metadata,
            data: format_entries(entries, raw),
        }
    }

    pub fn write(&self, path: impl AsRef<Path>) -> Result<()> {
        let file = File::create(path)?;
        serde_json::to_writer_pretty(file, self)?;
        Ok(())
    }
}

/// Write any serialisable value as pretty-printed JSON.
pub fn write_json(value: &impl Serialize, path: impl AsRef<Path>) -> Result<()> {
    let file = File::create(path)?;
    serde_json::to_writer_pretty(file, value)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Model;
    use crate::text::{Normalizer, NormalizerConfig};

    fn frontmatter() -> Frontmatter {
        Frontmatter {
            title: "Test".into(),
            author: "Author".into(),
            url: Some("https://example.com".into()),
        }
    }

    #[test]
    fn subtitles() {
        assert_eq!(booklet_subtitle(2, None), "A bigram language model");
        assert_eq!(
            booklet_subtitle(3, Some((1, 3, "A-K"))),
            "A trigram language model: A–K (Book 2 of 3)"
        );
        assert_eq!(booklet_subtitle(4, None), "A 4-gram language model");
    }

    #[test]
    fn for_book_only_changes_the_subtitle() {
        let meta = Metadata::new(&frontmatter(), 2, ".,".into(), None);
        let book = meta.for_book(0, 2, "A-C");
        assert!(book.subtitle.contains("A–C") && book.subtitle.contains("Book 1 of 2"));
        assert_eq!(
            Metadata {
                subtitle: meta.subtitle.clone(),
                ..book
            },
            meta
        );
    }

    #[test]
    fn missing_url_serialises_as_empty_string() {
        let meta = Metadata::new(
            &Frontmatter {
                url: None,
                ..frontmatter()
            },
            2,
            String::new(),
            None,
        );
        assert_eq!(serde_json::to_value(&meta).unwrap()["url"], "");
    }

    #[test]
    fn booklet_json_round_trips_through_a_file() {
        let lines = ["Hello world. Hello world again."];
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &lines);
        let model = Model::from_lines(2, &normalizer, &lines);
        let metadata = Metadata::new(
            &frontmatter(),
            2,
            normalizer.config().punctuation(),
            Some(model.stats()),
        );

        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("model.json");
        BookletJson::new(metadata, &model.entries(), true)
            .write(&path)
            .unwrap();

        let json: serde_json::Value = serde_json::from_reader(File::open(&path).unwrap()).unwrap();
        assert_eq!(json["metadata"]["title"], "Test");
        assert_eq!(json["metadata"]["n"], 2);
        assert_eq!(json["metadata"]["stats"]["total_tokens"], 7);
        assert!(json["metadata"]["stats"]["entropy"].is_number());
        assert_eq!(
            json["data"],
            serde_json::json!([
                [".", 1, ["Hello", 1]],
                ["again", 1, [".", 1]],
                ["Hello", 2, ["world", 2]],
                ["world", 2, [".", 1], ["again", 2]]
            ])
        );
    }
}
