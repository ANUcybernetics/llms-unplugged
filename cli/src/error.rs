use std::io;

use crate::SampleError;

/// Every failure the library can report. The CLI keys its "here is what
/// frontmatter looks like" help on [`Error::is_frontmatter`], so keep the
/// frontmatter variants distinct from plain I/O and encoding failures.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error("Input file is not valid UTF-8 text.")]
    NotUtf8,
    #[error("Input file is empty; expected YAML frontmatter.")]
    EmptyInput,
    #[error("Input must start with '---' followed by YAML frontmatter.")]
    MissingFrontmatter,
    #[error("Reached end of file before closing frontmatter delimiter '---'.")]
    UnterminatedFrontmatter,
    #[error("Invalid YAML frontmatter: {0}")]
    InvalidFrontmatter(#[from] serde_yaml_ng::Error),
    #[error("Frontmatter missing required field '{0}'.")]
    MissingField(&'static str),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error(transparent)]
    Sample(#[from] SampleError),
    #[error("TSV export only supports bigrams (n=2)")]
    TsvRequiresBigrams,
    #[error("Tool name cannot be empty")]
    EmptyToolName,
    #[error("Corpus has no {context_size}-token contexts; cannot place tool '{name}'")]
    NoContextsForTool { name: String, context_size: usize },
}

impl Error {
    /// True for the errors a malformed frontmatter block produces, as opposed
    /// to a missing file, an encoding problem, or a downstream failure.
    pub fn is_frontmatter(&self) -> bool {
        matches!(
            self,
            Error::EmptyInput
                | Error::MissingFrontmatter
                | Error::UnterminatedFrontmatter
                | Error::InvalidFrontmatter(_)
                | Error::MissingField(_)
        )
    }
}

pub type Result<T, E = Error> = std::result::Result<T, E>;
