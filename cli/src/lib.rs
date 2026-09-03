//! N-gram language models from text corpora, and the printed artefacts built
//! from them.
//!
//! The pipeline is `Corpus` (a file split into frontmatter and lines) →
//! `Normalizer` (tokenisation, with casing decided across the whole corpus) →
//! either a `Model` (the count table the booklets print and the sampler
//! walks) or a `CutoutSet` (every token with its context, for the cut-up and
//! search-sheet activities, and the ledger rows built from them). Both the native CLI and the website's wasm build
//! go through exactly these types, so the two can never drift.

mod corpus;
mod cutouts;
mod error;
mod ledger;
mod model;
mod output;
mod text;
#[cfg(feature = "wasm")]
mod wasm;

pub use corpus::{Corpus, Frontmatter};
pub use cutouts::{
    Cutout, CutoutKind, CutoutSet, CutoutsMetadata, SheetSet, append_tool_tokens, cutouts_model,
    deal_into_sheets, repeat_cutout_tokens, shuffle_cutout_tokens, tokenize_cutouts,
};
pub use error::{Error, Result};
pub use ledger::{
    Follower, LedgerEntry, LedgerSet, LedgerSheet, TextToken, deal_into_ledgers, ledger_entries,
    text_documents,
};
pub use model::{
    Book, ContextTable, Model, ModelSummary, MostCommonNgram, MostPopularContext, ProcessingStats,
    SampleError, WordFollowEntry, format_entries, model_type_str, split_entries_into_books,
};
pub use output::{BookletJson, Metadata, booklet_subtitle, write_json};
pub use text::{CjkMode, DEFAULT_PUNCTUATION, Normalizer, NormalizerConfig, Token, sort_key};

#[cfg(feature = "wasm")]
pub use wasm::*;
