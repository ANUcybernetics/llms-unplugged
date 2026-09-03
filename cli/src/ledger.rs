//! The ledger: a corpus's model as a table of rows, one per context, each
//! with its continuations across a fixed number of columns and a tally strip
//! beside every continuation. Participants train by tallying and generate by
//! drawing counters from a bag --- the strips are coloured by column, so the
//! counter drawn names the column to read.
//!
//! The types here are the wire shape of `ledger.json`, which `ledger.typ`
//! reads.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::cutouts::{Cutout, CutoutsMetadata};
use crate::error::{Error, Result};
use crate::text::sort_key;

/// One counter colour: the name a participant calls it by --- printed in the
/// corner of every strip it colours, so a room need not agree on what
/// "purple" looks like --- and the value it prints in.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PaletteEntry {
    pub name: String,
    pub hex: String,
}

/// The colours a room has counters in, as `--palette` takes them: the default
/// twelve unless a set says otherwise. The file is the one place they are
/// written down --- the sheets, the counters page, the brief and the website
/// widgets all read this list rather than a copy of it.
const DEFAULT_PALETTE_JSON: &str = include_str!("../ledger-palette.json");

pub fn default_palette() -> Vec<PaletteEntry> {
    serde_json::from_str(DEFAULT_PALETTE_JSON).expect("the bundled palette parses")
}

/// Whole palettes of `columns` colours the list holds. The list is flat and
/// the rows cycle through it a palette at a time, so twelve colours at four
/// columns give a prefix three rows of distinct strips and eight give two.
/// Colours past the last whole palette cannot be reached by any row.
pub fn palette_cycles(palette: &[PaletteEntry], columns: usize) -> usize {
    palette.len() / columns
}

/// Check a palette can colour a sheet of `columns` columns: fewer colours
/// than columns leaves a cell without a strip, two counters of one name
/// cannot be told apart when one is drawn, and a value neither Typst nor a
/// browser can read colours nothing.
pub fn check_palette(palette: &[PaletteEntry], columns: usize) -> Result<()> {
    if palette.len() < columns {
        return Err(Error::LedgerPaletteTooSmall {
            colours: palette.len(),
            columns,
        });
    }
    let mut seen = std::collections::HashSet::new();
    for entry in palette {
        if !seen.insert(entry.name.as_str()) {
            return Err(Error::LedgerPaletteDuplicate {
                name: entry.name.clone(),
            });
        }
        if !is_hex_colour(&entry.hex) {
            return Err(Error::LedgerPaletteBadHex {
                name: entry.name.clone(),
                hex: entry.hex.clone(),
            });
        }
    }
    Ok(())
}

/// `#rgb`, `#rrggbb` or their alpha forms: what `rgb()` takes in Typst and
/// what a browser takes in CSS, since the same string colours both.
fn is_hex_colour(hex: &str) -> bool {
    let digits = hex.strip_prefix('#').unwrap_or("");
    matches!(digits.len(), 3 | 4 | 6 | 8) && digits.chars().all(|c| c.is_ascii_hexdigit())
}

/// One continuation of a context and how often it followed it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Follower {
    pub text: String,
    pub count: usize,
}

/// One row of the ledger: a context and its continuations, in the order the
/// text first produced them. First appearance rather than frequency, because
/// a prefilled sheet sorted by count would hand out the answer before anyone
/// had tallied a mark.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LedgerEntry {
    pub prefix: Vec<String>,
    pub followers: Vec<Follower>,
}

impl LedgerEntry {
    /// Physical rows the entry takes on a sheet of `columns` columns: an
    /// entry with more followers than columns continues onto the next row.
    pub fn rows(&self, columns: usize) -> usize {
        self.followers.len().div_ceil(columns).max(1)
    }
}

/// Count every usable cutout into ledger entries, ordered by prefix in
/// dictionary order. Followers within an entry keep first-appearance order.
pub fn ledger_entries(tokens: &[Cutout]) -> Vec<LedgerEntry> {
    let mut entries: Vec<LedgerEntry> = Vec::new();
    let mut index: HashMap<&[String], usize> = HashMap::new();
    for token in tokens.iter().filter(|t| t.is_usable()) {
        let i = *index.entry(token.context()).or_insert_with(|| {
            entries.push(LedgerEntry {
                prefix: token.context().to_vec(),
                followers: Vec::new(),
            });
            entries.len() - 1
        });
        let followers = &mut entries[i].followers;
        match followers.iter_mut().find(|f| f.text == token.text) {
            Some(follower) => follower.count += 1,
            None => followers.push(Follower {
                text: token.text.clone(),
                count: 1,
            }),
        }
    }
    entries.sort_by_cached_key(|e| e.prefix.iter().map(|w| sort_key(w)).collect::<Vec<_>>());
    entries
}

/// One participant's sheet: a contiguous alphabetical run of entries, so the
/// header can say which prefixes it holds and "who has *the*?" is answered by
/// reading the ranges rather than by everyone searching. Split into pages of
/// at most `rows_per_page` physical rows without ever splitting an entry,
/// because an entry's continuation row has to sit directly under its first
/// one for the alternating row palettes to give it distinct colours.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LedgerSheet {
    /// The first and last prefix on the sheet; `None` for an empty sheet.
    pub range: Option<(Vec<String>, Vec<String>)>,
    pub pages: Vec<Vec<LedgerEntry>>,
}

impl LedgerSheet {
    fn new(entries: Vec<LedgerEntry>, columns: usize, rows_per_page: usize) -> Result<Self> {
        let range = match (entries.first(), entries.last()) {
            (Some(first), Some(last)) => Some((first.prefix.clone(), last.prefix.clone())),
            _ => None,
        };
        Ok(Self {
            range,
            pages: paginate(entries, columns, rows_per_page)?,
        })
    }

    /// A sheet of empty rows, for a group training on a text of its own.
    pub fn blank() -> Self {
        Self {
            range: None,
            pages: vec![Vec::new()],
        }
    }

    pub fn entries(&self) -> impl Iterator<Item = &LedgerEntry> {
        self.pages.iter().flatten()
    }

    pub fn rows(&self, columns: usize) -> usize {
        self.entries().map(|e| e.rows(columns)).sum()
    }
}

/// One token of the training text as the text page prints it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TextToken {
    pub text: String,
    /// False for a token the tokeniser dropped (a digit run, a roman
    /// numeral): printed dimmed and unnumbered, so a reader skips it and can
    /// see what the rows never counted.
    pub keep: bool,
}

/// The text the entries were counted from, one list per document, exactly
/// as the tokeniser saw it: lowercased, punctuation split off, dropped
/// tokens flagged. This is what the text page prints, so a group training
/// by hand reads the tokens the sheets were built from rather than doing
/// the tokenisation in their head from a plain printout.
///
/// A document starts at a kept token with no context that follows a token
/// which had one: the leading run of each document is the n-1 tokens that
/// nothing can match against, and the run is one document's. Dropped
/// tokens directly before such a start go with it, since they were read
/// from the same page.
pub fn text_documents(tokens: &[Cutout]) -> Vec<Vec<TextToken>> {
    let mut documents: Vec<Vec<TextToken>> = Vec::new();
    let mut pending: Vec<TextToken> = Vec::new();
    let mut last_kept_had_context = false;
    for token in tokens {
        let text_token = TextToken {
            text: token.text.clone(),
            keep: token.is_kept(),
        };
        if !token.is_kept() {
            pending.push(text_token);
            continue;
        }
        let starts_document = token.context().is_empty() && last_kept_had_context;
        if documents.is_empty() || starts_document {
            documents.push(Vec::new());
        }
        let document = documents.last_mut().expect("a document to add to");
        document.append(&mut pending);
        document.push(text_token);
        last_kept_had_context = !token.context().is_empty();
    }
    if !pending.is_empty() {
        if documents.is_empty() {
            documents.push(Vec::new());
        }
        documents
            .last_mut()
            .expect("a document")
            .append(&mut pending);
    }
    documents
}

/// The wire shape of `ledger.json`.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct LedgerSet {
    /// The corpus the sheets were built from; absent for blank sheets.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<CutoutsMetadata>,
    /// What the sheet headers call the set: the corpus title, or whatever a
    /// blank set was given (possibly nothing).
    pub title: String,
    pub columns: usize,
    pub rows_per_page: usize,
    /// The counter colours the strips take, cycling a palette of `columns`
    /// down the rows (see [`palette_cycles`]).
    pub palette: Vec<PaletteEntry>,
    pub sheets: Vec<LedgerSheet>,
    /// The training text by document (see [`text_documents`]); empty for
    /// blank sheets.
    pub text: Vec<Vec<TextToken>>,
}

/// Deal ledger entries into `num_sheets` sheets: contiguous runs of the
/// alphabetical order, cut so every sheet carries about the same number of
/// physical rows. Row count rather than entry count, because the common
/// contexts take two rows and cluster --- "the", "then", "there" --- and an
/// entry-balanced deal would hand one person twice the paper.
///
/// Sheets beyond the entries come back empty rather than being dropped, so a
/// pinned participant count is honoured and the shortfall is visible.
pub fn deal_into_ledgers(
    entries: &[LedgerEntry],
    num_sheets: usize,
    columns: usize,
    rows_per_page: usize,
) -> Result<Vec<LedgerSheet>> {
    if num_sheets == 0 {
        return Ok(Vec::new());
    }
    let total: usize = entries.iter().map(|e| e.rows(columns)).sum();
    let mut sheets = Vec::with_capacity(num_sheets);
    let mut remaining = entries;
    let mut dealt_rows = 0;
    for i in 0..num_sheets {
        // The cumulative row count this sheet should end nearest to.
        let boundary = (total * (i + 1)).div_ceil(num_sheets);
        let mut taken = 0;
        let mut rows = dealt_rows;
        for entry in remaining {
            let with = rows + entry.rows(columns);
            // Take the entry if it brings the cut closer to the boundary, or
            // if the sheet would otherwise be empty while entries remain.
            if taken > 0 && with.abs_diff(boundary) > rows.abs_diff(boundary) {
                break;
            }
            rows = with;
            taken += 1;
        }
        // The last sheet takes whatever is left.
        if i + 1 == num_sheets {
            taken = remaining.len();
        }
        let (sheet, rest) = remaining.split_at(taken);
        sheets.push(LedgerSheet::new(sheet.to_vec(), columns, rows_per_page)?);
        remaining = rest;
        dealt_rows += sheet.iter().map(|e| e.rows(columns)).sum::<usize>();
    }
    Ok(sheets)
}

/// Split entries into pages of at most `rows_per_page` physical rows without
/// splitting an entry. An empty sheet still gets one (empty) page so it prints
/// as a blank sheet rather than vanishing from the numbering.
fn paginate(
    entries: Vec<LedgerEntry>,
    columns: usize,
    rows_per_page: usize,
) -> Result<Vec<Vec<LedgerEntry>>> {
    let mut pages: Vec<Vec<LedgerEntry>> = vec![Vec::new()];
    let mut used = 0;
    for entry in entries {
        let rows = entry.rows(columns);
        if rows > rows_per_page {
            return Err(Error::LedgerEntryTooTall {
                prefix: entry.prefix.join(" "),
                rows,
                rows_per_page,
            });
        }
        if used + rows > rows_per_page {
            pages.push(Vec::new());
            used = 0;
        }
        used += rows;
        pages.last_mut().expect("at least one page").push(entry);
    }
    Ok(pages)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cutouts::tokenize_cutouts;
    use crate::text::{Normalizer, NormalizerConfig};

    fn tokens_for(text: &str) -> Vec<Cutout> {
        let lines: Vec<&str> = text.lines().collect();
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &lines);
        tokenize_cutouts(&normalizer, 2, &lines)
    }

    fn entry(prefix: &str, followers: &[(&str, usize)]) -> LedgerEntry {
        LedgerEntry {
            prefix: vec![prefix.to_string()],
            followers: followers
                .iter()
                .map(|(text, count)| Follower {
                    text: (*text).to_string(),
                    count: *count,
                })
                .collect(),
        }
    }

    #[test]
    fn the_default_palette_is_twelve_named_hex_colours() {
        let palette = default_palette();
        assert_eq!(palette.len(), 12);
        assert_eq!(
            palette[0],
            PaletteEntry {
                name: "red".to_string(),
                hex: "#e50002".to_string(),
            }
        );
        assert!(check_palette(&palette, 4).is_ok());
        // Twelve colours are three rows of four, two of six, and cannot fill
        // a row of five without leaving two colours unreachable.
        assert_eq!(palette_cycles(&palette, 4), 3);
        assert_eq!(palette_cycles(&palette, 6), 2);
        assert_eq!(palette_cycles(&palette, 5), 2);
    }

    #[test]
    fn a_palette_needs_a_colour_per_column_and_distinct_names() {
        let entry = |name: &str, hex: &str| PaletteEntry {
            name: name.to_string(),
            hex: hex.to_string(),
        };
        let good = vec![entry("red", "#f00"), entry("blue", "#0000ff")];
        assert!(check_palette(&good, 2).is_ok());
        assert!(matches!(
            check_palette(&good, 3),
            Err(Error::LedgerPaletteTooSmall {
                colours: 2,
                columns: 3
            })
        ));
        let twice = vec![entry("red", "#f00"), entry("red", "#0000ff")];
        assert!(matches!(
            check_palette(&twice, 2),
            Err(Error::LedgerPaletteDuplicate { .. })
        ));
        let unreadable = vec![entry("red", "crimson"), entry("blue", "#0000ff")];
        assert!(matches!(
            check_palette(&unreadable, 2),
            Err(Error::LedgerPaletteBadHex { .. })
        ));
    }

    #[test]
    fn entries_count_followers_in_first_appearance_order() {
        let entries = ledger_entries(&tokens_for("see spot run . see spot jump . run , spot"));
        let spot = entries.iter().find(|e| e.prefix == ["spot"]).unwrap();
        assert_eq!(
            spot,
            &entry("spot", &[("run", 1), ("jump", 1)]),
            "followers keep the order the text produced them, not count order"
        );
        let see = entries.iter().find(|e| e.prefix == ["see"]).unwrap();
        assert_eq!(see, &entry("see", &[("spot", 2)]));
    }

    #[test]
    fn entries_are_in_dictionary_order_and_skip_unusable_tokens() {
        // "IV" is discarded and "chapter" opens the text with no context.
        let entries = ledger_entries(&tokens_for("chapter IV Zebra ate apples . zebra ate"));
        let prefixes: Vec<&str> = entries.iter().map(|e| e.prefix[0].as_str()).collect();
        assert_eq!(prefixes, vec![".", "apples", "ate", "chapter", "zebra"]);
    }

    #[test]
    fn rows_follow_from_follower_count() {
        assert_eq!(entry("a", &[]).rows(4), 1);
        assert_eq!(entry("a", &[("b", 1); 4]).rows(4), 1);
        assert_eq!(entry("a", &[("b", 1); 5]).rows(4), 2);
        assert_eq!(entry("a", &[("b", 1); 9]).rows(4), 3);
    }

    #[test]
    fn text_documents_split_at_each_leading_run_and_keep_dropped_tokens() {
        let mut tokens = tokens_for("one 2 two . three");
        tokens.extend(tokens_for("four five"));
        let docs = text_documents(&tokens);
        let words = |doc: &[TextToken]| {
            doc.iter()
                .map(|t| format!("{}{}", t.text, if t.keep { "" } else { "*" }))
                .collect::<Vec<_>>()
                .join(" ")
        };
        assert_eq!(docs.len(), 2);
        assert_eq!(words(&docs[0]), "one 2* two . three");
        assert_eq!(words(&docs[1]), "four five");
    }

    #[test]
    fn deal_keeps_alphabetical_order_and_balances_rows() {
        // 26 entries; every fourth one is two rows tall.
        let entries: Vec<LedgerEntry> = (0..26)
            .map(|i| {
                let prefix = char::from(b'a' + i as u8).to_string();
                let followers = if i % 4 == 0 { 6 } else { 2 };
                entry(&prefix, &vec![("x", 1); followers])
            })
            .collect();

        let sheets = deal_into_ledgers(&entries, 4, 4, 12).unwrap();
        assert_eq!(sheets.len(), 4);

        let dealt: Vec<&LedgerEntry> = sheets.iter().flat_map(LedgerSheet::entries).collect();
        assert_eq!(dealt.len(), 26, "every entry is dealt exactly once");
        assert!(
            dealt.windows(2).all(|w| w[0].prefix < w[1].prefix),
            "sheets are contiguous runs of the alphabetical order"
        );

        let rows: Vec<usize> = sheets.iter().map(|s| s.rows(4)).collect();
        let (min, max) = (*rows.iter().min().unwrap(), *rows.iter().max().unwrap());
        assert!(max - min <= 2, "sheets unbalanced by rows: {rows:?}");

        let first = sheets[0].range.as_ref().unwrap();
        assert_eq!(first.0, vec!["a"]);
        assert_eq!(sheets[3].range.as_ref().unwrap().1, vec!["z"]);
    }

    #[test]
    fn deal_honours_a_pinned_count_beyond_the_entries() {
        let entries = vec![entry("a", &[("b", 1)]), entry("b", &[("c", 1)])];
        let sheets = deal_into_ledgers(&entries, 5, 4, 12).unwrap();
        assert_eq!(sheets.len(), 5);
        assert_eq!(sheets.iter().filter(|s| s.range.is_none()).count(), 3);
        assert!(
            sheets.iter().all(|s| s.pages.len() == 1),
            "an empty sheet still prints as one blank page"
        );
        assert!(deal_into_ledgers(&entries, 0, 4, 12).unwrap().is_empty());
    }

    #[test]
    fn pages_never_split_an_entry() {
        // Rows: 1, 2, 2, 1, 2 at three rows a page must break as 1+2 | 2+1 | 2,
        // not 1+2 | 2+1 | 2 with a two-row entry straddling a page.
        let entries = vec![
            entry("a", &[("x", 1)]),
            entry("b", &[("x", 1); 5]),
            entry("c", &[("x", 1); 5]),
            entry("d", &[("x", 1)]),
            entry("e", &[("x", 1); 5]),
        ];
        let sheet = LedgerSheet::new(entries, 4, 3).unwrap();
        let layout: Vec<Vec<&str>> = sheet
            .pages
            .iter()
            .map(|p| p.iter().map(|e| e.prefix[0].as_str()).collect())
            .collect();
        assert_eq!(layout, vec![vec!["a", "b"], vec!["c", "d"], vec!["e"]]);
        assert!(
            sheet
                .pages
                .iter()
                .all(|p| p.iter().map(|e| e.rows(4)).sum::<usize>() <= 3)
        );
    }

    #[test]
    fn an_entry_taller_than_a_page_is_an_error() {
        let entries = vec![entry("the", &[("x", 1); 13])];
        let err = LedgerSheet::new(entries, 4, 3).unwrap_err();
        assert!(
            matches!(
                err,
                Error::LedgerEntryTooTall {
                    rows: 4,
                    rows_per_page: 3,
                    ..
                }
            ),
            "got: {err}"
        );
    }
}
