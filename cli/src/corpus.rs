use std::fs;
use std::path::Path;

use serde::Deserialize;

use crate::error::{Error, Result};

/// The YAML block at the top of a corpus file. `title` and `author` are
/// required; `url` is optional because the templates already cope with its
/// absence and a hand-written corpus may have no source to cite.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Frontmatter {
    pub title: String,
    pub author: String,
    pub url: Option<String>,
}

/// Deserialisation target with every field optional, so a missing one can be
/// reported by name rather than as a serde error string.
#[derive(Deserialize)]
struct RawFrontmatter {
    title: Option<String>,
    author: Option<String>,
    url: Option<String>,
}

impl Frontmatter {
    pub fn parse(yaml: &str) -> Result<Self> {
        let raw: RawFrontmatter = serde_yaml_ng::from_str(yaml)?;
        Ok(Self {
            title: raw.title.ok_or(Error::MissingField("title"))?,
            author: raw.author.ok_or(Error::MissingField("author"))?,
            url: raw.url,
        })
    }
}

/// A corpus file split into its frontmatter and content lines. The single
/// loader for every pipeline (booklets, cutouts, sheets, sampling), so they
/// can never disagree about where the frontmatter ends.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Corpus {
    pub frontmatter: Frontmatter,
    pub lines: Vec<String>,
}

impl Corpus {
    /// Parse a corpus from its full text: a `---` line, YAML, a `---` line,
    /// then content.
    pub fn parse(text: &str) -> Result<Self> {
        let mut lines = text.lines();
        let first = lines.next().ok_or(Error::EmptyInput)?;
        if first.trim() != "---" {
            return Err(Error::MissingFrontmatter);
        }

        let mut yaml = String::new();
        loop {
            match lines.next() {
                None => return Err(Error::UnterminatedFrontmatter),
                Some(line) if line.trim() == "---" => break,
                Some(line) => {
                    yaml.push_str(line);
                    yaml.push('\n');
                }
            }
        }

        Ok(Self {
            frontmatter: Frontmatter::parse(&yaml)?,
            lines: lines.map(str::to_owned).collect(),
        })
    }

    pub fn load(path: impl AsRef<Path>) -> Result<Self> {
        let bytes = fs::read(path)?;
        let text = String::from_utf8(bytes).map_err(|_| Error::NotUtf8)?;
        Self::parse(&text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_frontmatter_and_content() {
        let corpus =
            Corpus::parse("---\ntitle: T\nauthor: A\nurl: https://x\n---\none\ntwo\n").unwrap();
        assert_eq!(
            corpus.frontmatter,
            Frontmatter {
                title: "T".into(),
                author: "A".into(),
                url: Some("https://x".into()),
            }
        );
        assert_eq!(corpus.lines, vec!["one", "two"]);
    }

    #[test]
    fn url_is_optional() {
        let corpus = Corpus::parse("---\ntitle: T\nauthor: A\n---\nbody").unwrap();
        assert_eq!(corpus.frontmatter.url, None);
    }

    #[test]
    fn reports_each_failure_distinctly() {
        assert!(matches!(Corpus::parse(""), Err(Error::EmptyInput)));
        assert!(matches!(
            Corpus::parse("no frontmatter"),
            Err(Error::MissingFrontmatter)
        ));
        assert!(matches!(
            Corpus::parse("---\ntitle: T\n"),
            Err(Error::UnterminatedFrontmatter)
        ));
        assert!(matches!(
            Corpus::parse("---\nauthor: A\n---\n"),
            Err(Error::MissingField("title"))
        ));
        assert!(matches!(
            Corpus::parse("---\ntitle: [\n---\n"),
            Err(Error::InvalidFrontmatter(_))
        ));
    }

    #[test]
    fn non_utf8_files_are_not_a_frontmatter_problem() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("latin1.txt");
        fs::write(&path, b"---\ntitle: T\nauthor: A\n---\ncaf\xe9\n").unwrap();
        let err = Corpus::load(&path).unwrap_err();
        assert!(matches!(err, Error::NotUtf8));
        assert!(!err.is_frontmatter());
    }
}
