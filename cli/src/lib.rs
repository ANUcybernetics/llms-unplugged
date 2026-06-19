use rand::Rng;
use rand::distr::{Distribution, weighted::WeightedIndex};
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet, HashMap, VecDeque};
use std::fs::File;
use std::io;
use std::path::Path;

mod text;
#[cfg(feature = "wasm")]
mod wasm;

pub use text::RawToken;
pub use text::{
    CanonicalFormTracker, DEFAULT_PUNCTUATION, Normalizer, NormalizerConfig, default_punctuation,
};

#[cfg(feature = "wasm")]
pub use wasm::*;

/// Helper function to get model type string (e.g., "bigram", "trigram")
pub fn model_type_str(n: usize) -> String {
    match n {
        1 => "unigram".to_string(),
        2 => "bigram".to_string(),
        3 => "trigram".to_string(),
        _ => format!("{}-gram", n),
    }
}

/// Contains metadata from the frontmatter of the processed file
#[derive(Debug, Clone, Serialize)]
pub struct Metadata {
    /// Title of the document
    pub title: String,
    /// Author of the document
    pub author: String,
    /// URL related to the document
    pub url: String,
    /// Size of n-gram used for processing
    pub n: usize,
    /// Subtitle for the booklet (e.g., "A bigram language model" or "A trigram language model: A-K (Book 1 of 3)")
    pub subtitle: String,
    /// CLI version used to generate this model
    pub version: String,
    /// Summary statistics for the processed text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stats: Option<ProcessingStats>,
}

/// Contains summary statistics for processed text
#[derive(Debug, Clone, Serialize)]
pub struct ProcessingStats {
    /// Total number of tokens in the text
    pub total_tokens: usize,
    /// Total number of unique n-grams found
    pub unique_ngrams: usize,
    /// Number of distinct word types (the model's vocabulary size)
    pub unique_tokens: usize,
    /// Total number of n-gram occurrences
    pub total_ngram_occurrences: usize,
    /// Most common n-gram (previous words and the most likely next word)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_common_ngram: Option<(Vec<String>, String, usize)>,
    /// Previous-words context with the most cumulative next-word occurrences
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_popular_previous_words: Option<(Vec<String>, usize)>,
    /// Weighted average conditional entropy (bits per token)
    pub entropy: f64,
    /// Perplexity (2^entropy) --- effective number of choices per generation step
    pub perplexity: f64,
    /// Mean number of distinct next-word continuations per previous-words
    /// context (unweighted by frequency). Differs from perplexity by ignoring
    /// the probability distribution over continuations.
    pub branching_factor: f64,
}

/// One entry in the n-gram model: the n-1 previous words and the next-word counts that follow them.
#[derive(Serialize, Debug, PartialEq, Clone)]
pub struct WordFollowEntry {
    pub previous_words: Vec<String>,
    pub next_words: Vec<(String, usize)>,
}

/// A counter for tracking n-gram occurrences in text
#[derive(Debug)]
pub struct NGramCounter {
    /// Mapping from previous-words context to next-word occurrence counts
    previous_words_map: BTreeMap<Vec<String>, HashMap<String, usize>>,
    /// Size of n-gram (e.g., 2 for bigrams, 3 for trigrams)
    n: usize,
    /// Statistics gathered during processing
    stats: ProcessingStats,
    /// Sliding window for processing text
    window: VecDeque<String>,
    /// Metadata from the frontmatter of the processed file
    metadata: Option<Metadata>,
    /// Unified tokenizer/normalizer
    normalizer: Normalizer,
}

impl NGramCounter {
    /// Creates a new NGramCounter with the specified n-gram size and punctuation chars
    pub fn new(n: usize, punctuation: Vec<char>) -> Self {
        // Callers (clap, the wasm entry points) validate n at the edges.
        assert!(n >= 2, "NGramCounter requires n >= 2 (got {n})");

        let context_size = n - 1;

        NGramCounter {
            previous_words_map: BTreeMap::new(),
            n,
            stats: ProcessingStats {
                total_tokens: 0,
                unique_ngrams: 0,
                unique_tokens: 0,
                total_ngram_occurrences: 0,
                most_common_ngram: None,
                most_popular_previous_words: None,
                entropy: 0.0,
                perplexity: 1.0,
                branching_factor: 0.0,
            },
            window: VecDeque::with_capacity(context_size),
            metadata: None,
            normalizer: Normalizer::new(NormalizerConfig::new(punctuation)),
        }
    }

    /// Process a single line of text
    pub fn process_line(&mut self, line: &str) {
        let words = self.normalizer.normalize_line(line);
        let context_size = self.n - 1;

        // Add to token count
        self.stats.total_tokens += words.len();

        // Process each word
        for word in words {
            // If the window is full (contains n-1 words), we have a complete previous-words context
            if self.window.len() == context_size {
                let previous_words = self.window.iter().cloned().collect::<Vec<String>>();
                let next_word = word.clone();

                // Update the frequency map
                self.previous_words_map
                    .entry(previous_words)
                    .or_default()
                    .entry(next_word)
                    .and_modify(|count| {
                        *count += 1;
                        self.stats.total_ngram_occurrences += 1;
                    })
                    .or_insert_with(|| {
                        self.stats.total_ngram_occurrences += 1;
                        1
                    });

                // Slide the window: remove the oldest word
                self.window.pop_front();
            }
            // Add the current word to the window
            self.window.push_back(word);
        }
    }

    /// Process a file containing text with frontmatter.
    pub fn process_file<P: AsRef<Path>>(&mut self, path: P) -> io::Result<()> {
        use std::io::{BufRead, BufReader};

        let file = File::open(&path)?;
        let mut reader = BufReader::new(file);
        let frontmatter_raw = read_frontmatter(&mut reader)?;
        self.metadata = Some(parse_frontmatter(&frontmatter_raw, self.n)?);

        let lines: Vec<String> = reader.lines().collect::<Result<_, _>>()?;
        self.process_lines(&lines);

        Ok(())
    }

    /// Process content lines in two passes: collect surface forms to build the
    /// corpus case map, then count n-grams with canonical forms applied, and
    /// finish by calculating statistics. Shared by the file path above and the
    /// wasm entry points.
    pub fn process_lines<S: AsRef<str>>(&mut self, lines: &[S]) {
        let mut tracker = CanonicalFormTracker::new();
        for line in lines {
            for word in self.normalizer.extract_raw_words(line.as_ref()) {
                tracker.record(&word);
            }
        }
        self.normalizer
            .set_corpus_case_map(tracker.build_case_map());

        for line in lines {
            self.process_line(line.as_ref());
        }

        self.calculate_statistics();
    }

    /// Tokenize lines for the cutouts variant using this counter's normalizer
    /// (corpus case map included), backfilling each kept token's previous
    /// words (its n-1 preceding kept tokens). Call after `process_lines` so
    /// the case map is populated.
    pub fn tokenize_lines_raw<S: AsRef<str>>(&self, lines: &[S]) -> Vec<RawToken> {
        let mut tokens = Vec::new();
        let mut index = 1usize;

        for line in lines {
            let line_tokens = self.normalizer.tokenize_line_raw(line.as_ref(), index);
            if let Some(last) = line_tokens.last() {
                index = last.index + 1;
            }
            tokens.extend(line_tokens);
        }

        let context_size = self.n - 1;
        let kept_texts: Vec<String> = tokens
            .iter()
            .filter(|t| t.keep)
            .map(|t| t.text.clone())
            .collect();

        let mut kept_idx = 0usize;
        for token in &mut tokens {
            if token.keep {
                if kept_idx >= context_size {
                    token.previous_words = kept_texts[kept_idx - context_size..kept_idx].to_vec();
                }
                kept_idx += 1;
            }
        }

        tokens
    }

    /// Calculate statistics after processing
    fn calculate_statistics(&mut self) {
        // Find the most common n-gram
        let mut most_common_count = 0;
        let mut most_common_previous_words = None;
        let mut most_common_next_word = None;

        // Find the previous-words context with the most cumulative next-word occurrences
        let mut most_popular_previous_words = None;
        let mut most_popular_count = 0;

        for (previous_words, next_word_counts) in &self.previous_words_map {
            // Calculate the cumulative count for this context
            let total_next_words: usize = next_word_counts.values().sum();

            // Check if this is the context with the most next-word occurrences
            if total_next_words > most_popular_count {
                most_popular_count = total_next_words;
                most_popular_previous_words = Some(previous_words.clone());
            }

            // Continue with existing logic for finding the most common specific n-gram
            for (next_word, count) in next_word_counts {
                if *count > most_common_count {
                    most_common_count = *count;
                    most_common_previous_words = Some(previous_words.clone());
                    most_common_next_word = Some(next_word.clone());
                }
            }
        }

        if let (Some(previous_words), Some(next_word)) =
            (most_common_previous_words, most_common_next_word)
        {
            self.stats.most_common_ngram = Some((previous_words, next_word, most_common_count));
        }

        if let Some(previous_words) = most_popular_previous_words {
            self.stats.most_popular_previous_words = Some((previous_words, most_popular_count));
        }

        // Set the count of unique previous-words contexts
        self.stats.unique_ngrams = self.previous_words_map.len();

        // Count distinct word types (vocabulary size): every word that appears
        // as a context word or as a next-word continuation.
        self.stats.unique_tokens = {
            let mut vocab: BTreeSet<&str> = BTreeSet::new();
            for (context, next_words) in &self.previous_words_map {
                for word in context {
                    vocab.insert(word.as_str());
                }
                for next_word in next_words.keys() {
                    vocab.insert(next_word.as_str());
                }
            }
            vocab.len()
        };

        // Compute weighted average conditional entropy
        let total_occurrences = self.stats.total_ngram_occurrences as f64;
        if total_occurrences > 0.0 {
            let mut weighted_entropy = 0.0;
            for next_word_counts in self.previous_words_map.values() {
                let context_total: usize = next_word_counts.values().sum();
                let context_total_f = context_total as f64;
                let mut context_entropy = 0.0;
                for &count in next_word_counts.values() {
                    let p = count as f64 / context_total_f;
                    context_entropy -= p * p.log2();
                }
                weighted_entropy += (context_total_f / total_occurrences) * context_entropy;
            }
            self.stats.entropy = weighted_entropy;
            self.stats.perplexity = weighted_entropy.exp2();
        }

        // Compute unweighted average branching factor: mean number of distinct
        // next-word continuations per previous-words context.
        if !self.previous_words_map.is_empty() {
            let distinct_continuations: usize =
                self.previous_words_map.values().map(|m| m.len()).sum();
            self.stats.branching_factor =
                distinct_continuations as f64 / self.previous_words_map.len() as f64;
        }
    }

    /// Get the results as a sorted list of WordFollowEntry
    pub fn get_entries(&self) -> Vec<WordFollowEntry> {
        convert_to_entries(&self.previous_words_map)
    }

    /// Get the statistics collected during processing
    pub fn get_stats(&self) -> &ProcessingStats {
        &self.stats
    }

    /// Get the metadata from the frontmatter
    pub fn get_metadata(&self) -> Option<&Metadata> {
        self.metadata.as_ref()
    }

    /// Normalise an external line of text (e.g. a sampling prompt) using the same
    /// tokenisation and canonical-casing rules that were applied to the corpus.
    /// Only meaningful after `process_file` has populated the corpus case map.
    pub fn normalize(&self, line: &str) -> Vec<String> {
        self.normalizer.normalize_line(line)
    }
}

/// Processes a text file and returns N-gram following statistics along with summary statistics and metadata
pub fn process_file<P: AsRef<Path>>(
    path: P,
    n: usize,
) -> io::Result<(Vec<WordFollowEntry>, ProcessingStats, Option<Metadata>)> {
    let mut counter = NGramCounter::new(n, default_punctuation());
    counter.process_file(path)?;

    let entries = counter.get_entries();
    let stats = counter.get_stats().clone();
    let metadata = counter.get_metadata().cloned();

    Ok((entries, stats, metadata))
}

/// Metadata for cutouts output
#[derive(Debug, Clone, Serialize)]
pub struct CutoutsMetadata {
    pub title: String,
    pub author: String,
    pub total_tokens: usize,
    pub kept_tokens: usize,
    pub unique_tokens: usize,
    pub entropy: f64,
    pub perplexity: f64,
    pub branching_factor: f64,
}

/// Processes a text file and returns raw tokens for the cutouts lesson
/// variant, plus metadata with model statistics computed from the same
/// content in a single read.
pub fn process_file_for_cutouts<P: AsRef<Path>>(
    path: P,
    punctuation: Vec<char>,
    n: usize,
) -> io::Result<(Vec<RawToken>, CutoutsMetadata)> {
    use std::io::{BufRead, BufReader};

    let file = File::open(&path)?;
    let mut reader = BufReader::new(file);
    let frontmatter_raw = read_frontmatter(&mut reader)?;

    // Cutouts only need title/author, so the frontmatter is parsed leniently
    // (unlike the booklet path, which requires title/author/url).
    let yaml: serde_yaml_ng::Value = serde_yaml_ng::from_str(&frontmatter_raw).map_err(|e| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid YAML frontmatter: {e}"),
        )
    })?;
    let title = yaml
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled")
        .to_string();
    let author = yaml
        .get("author")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown")
        .to_string();

    let lines: Vec<String> = reader.lines().collect::<Result<_, _>>()?;

    let mut counter = NGramCounter::new(n, punctuation);
    counter.process_lines(&lines);
    let tokens = counter.tokenize_lines_raw(&lines);
    let stats = counter.get_stats();

    let metadata = CutoutsMetadata {
        title,
        author,
        total_tokens: tokens.len(),
        kept_tokens: tokens.iter().filter(|t| t.keep).count(),
        unique_tokens: stats.unique_tokens,
        entropy: stats.entropy,
        perplexity: stats.perplexity,
        branching_factor: stats.branching_factor,
    };

    Ok((tokens, metadata))
}

/// Read the YAML frontmatter block (between `---` delimiter lines) from the
/// start of a corpus file, leaving the reader positioned at the first content
/// line.
fn read_frontmatter(reader: &mut impl io::BufRead) -> io::Result<String> {
    let mut line = String::new();
    if reader.read_line(&mut line)? == 0 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Input file is empty; expected YAML frontmatter.",
        ));
    }

    if line.trim() != "---" {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Input must start with '---' followed by YAML frontmatter.",
        ));
    }

    let mut frontmatter_raw = String::new();
    loop {
        line.clear();
        if reader.read_line(&mut line)? == 0 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Reached end of file before closing frontmatter delimiter '---'.",
            ));
        }

        if line.trim() == "---" {
            break;
        }

        frontmatter_raw.push_str(&line);
    }

    Ok(frontmatter_raw)
}

/// Multiply the usable cutouts in a token list by `factor`. A usable cutout is
/// a kept token that has a full n-1-word context (i.e. `keep && !previous_words
/// .is_empty()`); discarded tokens and the leading run that has no context stay
/// at their original count because they're rendered dimmed and aren't meant to
/// be cut out. Duplicates are emitted adjacently so the printed sheet shows
/// repeated cutouts together, easy to grab as a batch when cutting.
///
/// Intended for short curated corpora (e.g. the sycophancy stack) that would
/// otherwise be swamped when mixed into a much larger pile of base-corpus
/// cutouts. `factor == 0` or `1` is a no-op.
pub fn repeat_cutout_tokens(tokens: &mut Vec<RawToken>, factor: usize) {
    if factor <= 1 {
        return;
    }
    let mut expanded = Vec::with_capacity(tokens.len() * factor);
    for token in tokens.drain(..) {
        let usable = token.keep && !token.previous_words.is_empty();
        if usable {
            for _ in 0..(factor - 1) {
                expanded.push(token.clone());
            }
        }
        expanded.push(token);
    }
    *tokens = expanded;
}

/// Append synthetic tool-trigger cutouts to a corpus token list.
///
/// Each `(name, count)` spec produces up to `count` trigger cutouts (one per
/// context), seeded at the top `count` most common (n-1)-token previous-word
/// contexts among the corpus's kept tokens. If the corpus has fewer distinct
/// contexts than requested, the available ones are used. Triggers carry
/// `is_tool = true` so the typst template renders them in the dedicated
/// black/gold style.
///
/// Triggers are appended in order, so they cluster at the end of the cutout
/// sheets — easy for the teacher to find and distribute separately.
pub fn append_tool_tokens(
    tokens: &mut Vec<RawToken>,
    specs: &[(String, usize)],
    n: usize,
) -> Result<usize, String> {
    if specs.is_empty() {
        return Ok(0);
    }
    let context_size = n.saturating_sub(1);

    let mut context_counts: HashMap<Vec<String>, usize> = HashMap::new();
    for t in tokens
        .iter()
        .filter(|t| t.keep && !t.is_tool && t.previous_words.len() == context_size)
    {
        *context_counts.entry(t.previous_words.clone()).or_insert(0) += 1;
    }
    let mut ranked: Vec<(Vec<String>, usize)> = context_counts.into_iter().collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut next_index = tokens.iter().map(|t| t.index).max().unwrap_or(0) + 1;
    let mut injected = 0usize;

    for (name, count) in specs {
        if name.trim().is_empty() {
            return Err("Tool name cannot be empty".to_string());
        }
        if *count == 0 {
            continue;
        }
        let copies = if context_size == 0 {
            // No context to discriminate on; emit one trigger per requested copy
            // (all share an empty previous_words).
            (0..*count)
                .map(|_| Vec::<String>::new())
                .collect::<Vec<_>>()
        } else {
            if ranked.is_empty() {
                return Err(format!(
                    "Corpus has no {}-token contexts; cannot place tool '{}'",
                    context_size, name
                ));
            }
            ranked
                .iter()
                .take(*count)
                .map(|(ctx, _)| ctx.clone())
                .collect::<Vec<_>>()
        };
        for previous_words in copies {
            tokens.push(RawToken {
                index: next_index,
                text: name.clone(),
                keep: true,
                previous_words,
                is_tool: true,
            });
            next_index += 1;
            injected += 1;
        }
    }
    Ok(injected)
}

fn parse_frontmatter(frontmatter_raw: &str, n: usize) -> io::Result<Metadata> {
    use serde_yaml_ng::Value;

    let yaml: Value = serde_yaml_ng::from_str(frontmatter_raw).map_err(|e| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid YAML frontmatter: {e}"),
        )
    })?;

    let title = yaml.get("title").and_then(|v| v.as_str()).ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            "Frontmatter missing required field 'title'.",
        )
    })?;
    let author = yaml.get("author").and_then(|v| v.as_str()).ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            "Frontmatter missing required field 'author'.",
        )
    })?;
    let url = yaml.get("url").and_then(|v| v.as_str()).ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            "Frontmatter missing required field 'url'.",
        )
    })?;

    Ok(Metadata {
        title: title.to_string(),
        author: author.to_string(),
        url: url.to_string(),
        n,
        subtitle: format!("A {} language model", model_type_str(n)),
        version: env!("CARGO_PKG_VERSION").to_string(),
        stats: None,
    })
}

/// Converts the internal n-gram HashMap representation to the required output format
fn convert_to_entries(
    previous_words_map: &BTreeMap<Vec<String>, HashMap<String, usize>>,
) -> Vec<WordFollowEntry> {
    let mut entries: Vec<WordFollowEntry> = previous_words_map
        .iter()
        .map(|(previous_words, next_word_counts)| {
            let mut next_word_entries: Vec<(String, usize)> = next_word_counts
                .iter()
                .map(|(word, count)| (word.clone(), *count))
                .collect();
            // Sort next-words by count (largest to smallest)
            // If counts are equal, then sort alphabetically by word (case-insensitive)
            next_word_entries.sort_by(|a, b| {
                b.1.cmp(&a.1)
                    .then_with(|| a.0.to_lowercase().cmp(&b.0.to_lowercase()))
            });

            WordFollowEntry {
                previous_words: previous_words.clone(),
                next_words: next_word_entries,
            }
        })
        .collect();

    // Sort entries by previous-words case-insensitively
    entries.sort_by(|a, b| {
        let a_lower: Vec<String> = a.previous_words.iter().map(|s| s.to_lowercase()).collect();
        let b_lower: Vec<String> = b.previous_words.iter().map(|s| s.to_lowercase()).collect();
        a_lower.cmp(&b_lower)
    });

    entries
}

/// Splits entries into multiple books based on estimated rendered size
pub fn split_entries_into_books(
    entries: &[WordFollowEntry],
    num_books: usize,
) -> Vec<(String, Vec<WordFollowEntry>)> {
    if num_books <= 1 || entries.is_empty() {
        return vec![("".to_string(), entries.to_vec())];
    }

    let total_weight: usize = entries.iter().map(entry_weight).sum();
    let target_per_book = total_weight as f64 / num_books as f64;

    let mut books = Vec::new();
    let mut start_idx = 0usize;
    let mut running_weight = 0f64;
    let mut next_cutoff = target_per_book;

    for (idx, entry) in entries.iter().enumerate() {
        running_weight += entry_weight(entry) as f64;

        let remaining_books = num_books.saturating_sub(books.len() + 1);
        if running_weight >= next_cutoff && remaining_books > 0 {
            books.push(build_book(entries, start_idx, idx + 1));
            start_idx = idx + 1;
            running_weight = 0.0;
            next_cutoff = target_per_book;
        }
    }

    if start_idx < entries.len() {
        books.push(build_book(entries, start_idx, entries.len()));
    }

    books
}

fn entry_weight(entry: &WordFollowEntry) -> usize {
    let weight: usize = entry.next_words.iter().map(|(_, count)| *count).sum();
    weight.max(1)
}

fn build_book(
    entries: &[WordFollowEntry],
    start_idx: usize,
    end_idx: usize,
) -> (String, Vec<WordFollowEntry>) {
    let book_entries: Vec<WordFollowEntry> = entries[start_idx..end_idx].to_vec();

    let start_label = previous_words_label(&book_entries[0]);
    let end_label = previous_words_label(&book_entries[book_entries.len() - 1]);

    let book_name = if start_label == end_label {
        start_label
    } else {
        format!("{}-{}", start_label, end_label)
    };

    (book_name, book_entries)
}

fn previous_words_label(entry: &WordFollowEntry) -> String {
    entry
        .previous_words
        .first()
        .and_then(|p| p.chars().next())
        .map(|c| c.to_ascii_uppercase().to_string())
        .unwrap_or_else(|| "?".to_string())
}

/// Format model entries as the booklet JSON "data" rows:
/// `["joined previous words", total, ["next word", cumulative], ...]`.
/// Without `raw`, cumulative counts are rescaled so each entry's total is
/// 10^k - 1 (k = digits of the true total), i.e. read directly off d10 dice.
/// Shared by the CLI JSON writer and the wasm booklet entry point so the two
/// can never drift.
pub fn format_entries(entries: &[WordFollowEntry], raw: bool) -> Vec<Vec<serde_json::Value>> {
    entries
        .iter()
        .map(|entry| {
            let mut row = vec![serde_json::Value::String(entry.previous_words.join(" "))];

            let total: usize = entry.next_words.iter().map(|(_, count)| count).sum();

            // Next words are already sorted by count (largest to smallest)
            // from convert_to_entries; cumulative counts follow that order.
            let mut cumulative = Vec::new();
            let mut running_sum = 0;
            for (next_word, count) in &entry.next_words {
                running_sum += count;
                cumulative.push((next_word, running_sum));
            }

            if total == 0 {
                // No next-word occurrences: total is 0, no next-word data.
                row.push(serde_json::json!(0));
            } else if raw {
                row.push(serde_json::json!(total));
                row.extend(cumulative.iter().map(|(w, c)| serde_json::json!([w, c])));
            } else {
                // 10^k-1 scaling for d10 dice (e.g. total 75 -> k=2 -> 0-99)
                let k_digits = total.to_string().len() as u32;
                let max_val = 10_u32.pow(k_digits).saturating_sub(1);
                let factor = max_val as f64 / total as f64;

                row.push(serde_json::json!(max_val));
                row.extend(
                    cumulative.iter().map(|(w, c)| {
                        serde_json::json!([w, (*c as f64 * factor).round() as usize])
                    }),
                );
            }

            row
        })
        .collect()
}

/// Saves the N-gram follow entries to a JSON file
pub fn save_to_json<P: AsRef<Path>>(
    entries: &[WordFollowEntry],
    path: P,
    metadata: Option<&Metadata>,
    stats: Option<&ProcessingStats>,
    raw: bool,
) -> io::Result<()> {
    let formatted_entries = format_entries(entries, raw);

    // Build the full output object with metadata and data
    let mut output = serde_json::Map::new();

    // Add metadata if available
    if let Some(meta) = metadata {
        // Clone metadata and add stats
        let mut meta_with_stats = meta.clone();
        meta_with_stats.stats = stats.cloned();
        output.insert(
            "metadata".to_string(),
            serde_json::to_value(meta_with_stats)?,
        );
    } else {
        // Create minimal metadata with just the n value
        let mut meta_map = serde_json::Map::new();
        meta_map.insert(
            "n".to_string(),
            serde_json::Value::Number(serde_json::Number::from(
                entries[0].previous_words.len() + 1,
            )),
        );
        output.insert("metadata".to_string(), serde_json::Value::Object(meta_map));
    }

    // Add data
    output.insert("data".to_string(), serde_json::to_value(formatted_entries)?);

    // Write to file
    let file = File::create(path)?;
    serde_json::to_writer_pretty(file, &output)?;
    Ok(())
}

/// Render a bigram frequency matrix as TSV, matching the legacy Python script.
///
/// Rows and columns share the same sorted vocabulary. Cells contain cumulative
/// counts across the row; empty strings represent zero counts.
pub fn render_bigram_tsv(entries: &[WordFollowEntry]) -> Result<String, String> {
    let mut vocab = BTreeSet::new();
    let mut matrix: BTreeMap<String, HashMap<String, usize>> = BTreeMap::new();

    for entry in entries {
        if entry.previous_words.len() != 1 {
            return Err("TSV export only supports bigrams (n=2)".to_string());
        }

        let previous_word = entry.previous_words[0].clone();
        vocab.insert(previous_word.clone());

        for (next_word, count) in &entry.next_words {
            vocab.insert(next_word.clone());
            matrix
                .entry(previous_word.clone())
                .or_default()
                .insert(next_word.clone(), *count);
        }
    }

    let vocab: Vec<String> = vocab.into_iter().collect();
    let mut output = String::new();

    // Header row
    output.push_str(&format!("\t{}\n", vocab.join("\t")));

    for first in &vocab {
        output.push_str(first);
        let mut cumulative = 0usize;
        for second in &vocab {
            let count = matrix
                .get(first)
                .and_then(|row| row.get(second))
                .copied()
                .unwrap_or(0);

            if count > 0 {
                cumulative += count;
                output.push('\t');
                output.push_str(&cumulative.to_string());
            } else {
                output.push('\t');
            }
        }
        output.push('\n');
    }

    Ok(output)
}

/// Errors returned by [`sample`].
#[derive(Debug, PartialEq, Eq)]
pub enum SampleError {
    /// The model has no entries to sample from.
    EmptyModel,
    /// Prompt has fewer normalised tokens than the model's context size (n - 1).
    PromptTooShort { needed: usize, got: usize },
    /// The prompt's tail context does not appear as a key in the model.
    PromptContextNotFound { context: Vec<String> },
    /// Sampling produced `generated` tokens, then hit a context with no successors.
    DeadEnd {
        context: Vec<String>,
        generated: Vec<String>,
    },
}

impl std::fmt::Display for SampleError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SampleError::EmptyModel => write!(f, "model has no entries"),
            SampleError::PromptTooShort { needed, got } => write!(
                f,
                "prompt too short: need at least {needed} normalised token(s) for context, got {got}"
            ),
            SampleError::PromptContextNotFound { context } => write!(
                f,
                "prompt context not found in model: `{}`",
                context.join(" ")
            ),
            SampleError::DeadEnd { context, generated } => write!(
                f,
                "dead-end context `{}` has no successors; stopped after generating {} token(s)",
                context.join(" "),
                generated.len()
            ),
        }
    }
}

impl std::error::Error for SampleError {}

/// Sample `n_tokens` tokens from an N-gram model, continuing from `prompt`.
///
/// The n-gram size is inferred from `entries`: every entry's `previous_words` vector
/// has length `n - 1`. `prompt` must contain at least `n - 1` tokens, already
/// normalised to match the model's vocabulary.
///
/// Returns only the newly generated tokens (the prompt is not echoed back).
///
/// Errors:
/// - [`SampleError::EmptyModel`] if `entries` is empty.
/// - [`SampleError::PromptTooShort`] if the prompt has fewer than `n - 1` tokens.
/// - [`SampleError::PromptContextNotFound`] if the prompt's tail context is unseen.
/// - [`SampleError::DeadEnd`] if generation hits a context with no successors;
///   the partially-generated tokens are returned inside the error.
pub fn sample<R: Rng + ?Sized>(
    entries: &[WordFollowEntry],
    prompt: &[String],
    n_tokens: usize,
    rng: &mut R,
) -> Result<Vec<String>, SampleError> {
    let context_size = entries
        .first()
        .ok_or(SampleError::EmptyModel)?
        .previous_words
        .len();

    if prompt.len() < context_size {
        return Err(SampleError::PromptTooShort {
            needed: context_size,
            got: prompt.len(),
        });
    }

    let map: HashMap<&[String], &Vec<(String, usize)>> = entries
        .iter()
        .map(|e| (e.previous_words.as_slice(), &e.next_words))
        .collect();

    let mut context: Vec<String> = prompt[prompt.len() - context_size..].to_vec();

    if !map.contains_key(context.as_slice()) {
        return Err(SampleError::PromptContextNotFound { context });
    }

    let mut generated = Vec::with_capacity(n_tokens);
    for _ in 0..n_tokens {
        let next_words = match map.get(context.as_slice()) {
            Some(nw) if !nw.is_empty() => *nw,
            _ => return Err(SampleError::DeadEnd { context, generated }),
        };

        let dist = match WeightedIndex::new(next_words.iter().map(|(_, c)| *c)) {
            Ok(d) => d,
            Err(_) => return Err(SampleError::DeadEnd { context, generated }),
        };
        let chosen = next_words[dist.sample(rng)].0.clone();

        generated.push(chosen.clone());

        if context_size > 0 {
            context.remove(0);
            context.push(chosen);
        }
    }

    Ok(generated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_entries_scales_to_dice_range() {
        let entries = vec![WordFollowEntry {
            previous_words: vec!["hello".to_string()],
            next_words: vec![("world".to_string(), 2), ("there".to_string(), 1)],
        }];

        let rows = format_entries(&entries, false);
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0][0], serde_json::json!("hello"));
        assert_eq!(rows[0][1], serde_json::json!(9)); // total 3 -> 10^1 - 1
        assert_eq!(rows[0][2], serde_json::json!(["world", 6])); // round(2 * 9/3)
        assert_eq!(rows[0][3], serde_json::json!(["there", 9]));

        let raw_rows = format_entries(&entries, true);
        assert_eq!(raw_rows[0][1], serde_json::json!(3));
        assert_eq!(raw_rows[0][2], serde_json::json!(["world", 2]));
        assert_eq!(raw_rows[0][3], serde_json::json!(["there", 3]));
    }

    #[test]
    fn process_lines_applies_canonical_casing() {
        // The wasm booklet path used to skip the canonical-casing pass; this
        // pins that process_lines (shared by CLI and wasm) applies it.
        let mut counter = NGramCounter::new(2, default_punctuation());
        counter.process_lines(&["Sally said hello.", "Sally said hi."]);

        let entries = counter.get_entries();
        assert!(
            entries
                .iter()
                .any(|e| e.previous_words == vec!["Sally".to_string()]),
            "consistently-capitalised words keep their case: {entries:?}"
        );
    }

    #[test]
    fn append_tool_tokens_seeds_top_contexts() {
        // Bigram token list for "a b a b a c": context [a] occurs 3 times
        // (followed by b, b, c), context [b] twice (followed by a, a).
        let words = ["a", "b", "a", "b", "a", "c"];
        let mut tokens: Vec<RawToken> = words
            .iter()
            .enumerate()
            .map(|(i, w)| RawToken {
                index: i + 1,
                text: w.to_string(),
                keep: true,
                previous_words: if i == 0 {
                    vec![]
                } else {
                    vec![words[i - 1].to_string()]
                },
                is_tool: false,
            })
            .collect();

        let injected = append_tool_tokens(&mut tokens, &[("VOTE".to_string(), 2)], 2).unwrap();
        assert_eq!(injected, 2);

        let tools: Vec<&RawToken> = tokens.iter().filter(|t| t.is_tool).collect();
        assert_eq!(tools.len(), 2);
        assert!(tools.iter().all(|t| t.text == "VOTE" && t.keep));

        let contexts: Vec<&[String]> = tools.iter().map(|t| t.previous_words.as_slice()).collect();
        assert!(contexts.contains(&["a".to_string()].as_slice()));
        assert!(contexts.contains(&["b".to_string()].as_slice()));
    }

    #[test]
    fn append_tool_tokens_errors_when_corpus_has_no_contexts() {
        let mut tokens = vec![RawToken {
            index: 1,
            text: "only".to_string(),
            keep: true,
            previous_words: vec![],
            is_tool: false,
        }];
        let err = append_tool_tokens(&mut tokens, &[("VOTE".to_string(), 1)], 2).unwrap_err();
        assert!(err.contains("cannot place tool"), "got: {err}");
    }
    // BufReader is used by save_to_json tests, Write and NamedTempFile are used by multiple tests.
    use std::io::{BufReader, Write};
    use tempfile::NamedTempFile;

    #[test]
    fn test_next_word_sort_order() {
        // Test the sorting of next-words by count (largest to smallest)
        let mut counter = NGramCounter::new(2, default_punctuation());
        counter.process_line("the cat sat on the mat and the cat ate");

        // Get entries and check sorting
        let entries = counter.get_entries();

        // Find entry for "the"
        let the_entry = entries
            .iter()
            .find(|e| e.previous_words == vec!["the"])
            .unwrap();

        // Check that next-words are sorted by count (largest to smallest)
        assert_eq!(the_entry.next_words[0].0, "cat"); // "cat" should be first (count = 2)
        assert_eq!(the_entry.next_words[0].1, 2);
        assert_eq!(the_entry.next_words[1].0, "mat"); // "mat" should be second (count = 1)
        assert_eq!(the_entry.next_words[1].1, 1);

        // Test equal counts with alphabetical tiebreaker
        let mut counter2 = NGramCounter::new(2, default_punctuation());
        counter2.process_line("he no test he yes test");

        let entries2 = counter2.get_entries();
        let he_entry = entries2
            .iter()
            .find(|e| e.previous_words == vec!["he"])
            .unwrap();

        // Both next-words have count 1, so should be sorted alphabetically
        assert_eq!(he_entry.next_words[0].0, "no"); // "no" comes before "yes" alphabetically
        assert_eq!(he_entry.next_words[0].1, 1);
        assert_eq!(he_entry.next_words[1].0, "yes");
        assert_eq!(he_entry.next_words[1].1, 1);
    }

    // Tokenization-specific tests live alongside the normalizer in text.rs

    #[test]
    fn test_previous_words_case_insensitive_sort_order() {
        // Test that previous-words contexts are sorted case-insensitively
        // Without case-insensitive sorting, uppercase letters sort before lowercase
        // (e.g., "Z" < "a" in ASCII), which would put "Zebra" before "apple"
        let mut counter = NGramCounter::new(2, default_punctuation());
        // Process text with mixed case previous-words that would sort differently
        // if case-sensitive: ASCII order would be "Apple", "Zebra", "apple", "banana"
        // Case-insensitive order should be: "apple", "Apple", "banana", "Zebra"
        // (or "Apple", "apple" depending on stable sort, but both "apple" variants before "banana")
        counter.process_line("Apple pie. Zebra stripes. apple tart. banana split.");

        let entries = counter.get_entries();
        let previous_words_list: Vec<&str> = entries
            .iter()
            .map(|e| e.previous_words[0].as_str())
            .collect();

        // Verify case-insensitive ordering: all "a" words before "b" words before "z" words
        // Find positions of each previous-words variant
        let apple_pos = previous_words_list
            .iter()
            .position(|&p| p.to_lowercase() == "apple");
        let banana_pos = previous_words_list
            .iter()
            .position(|&p| p.to_lowercase() == "banana");
        let zebra_pos = previous_words_list
            .iter()
            .position(|&p| p.to_lowercase() == "zebra");

        assert!(
            apple_pos.is_some(),
            "Should have apple/Apple previous-words, got: {:?}",
            previous_words_list
        );
        assert!(
            banana_pos.is_some(),
            "Should have banana previous-words, got: {:?}",
            previous_words_list
        );
        assert!(
            zebra_pos.is_some(),
            "Should have zebra/Zebra previous-words, got: {:?}",
            previous_words_list
        );

        // All apple variants should come before banana
        let apple_positions: Vec<usize> = previous_words_list
            .iter()
            .enumerate()
            .filter(|&(_, p)| p.to_lowercase() == "apple")
            .map(|(i, _)| i)
            .collect();
        let banana_pos = banana_pos.unwrap();
        let zebra_pos = zebra_pos.unwrap();

        for apple_pos in &apple_positions {
            assert!(
                *apple_pos < banana_pos,
                "Apple variants should come before banana: apple at {}, banana at {}",
                apple_pos,
                banana_pos
            );
        }

        // Banana should come before zebra
        assert!(
            banana_pos < zebra_pos,
            "Banana should come before zebra: banana at {}, zebra at {}",
            banana_pos,
            zebra_pos
        );
    }

    #[test]
    fn test_process_small_file_bigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write test content to the temporary file with frontmatter
        {
            let mut file = File::create(&path)?;
            writeln!(
                file,
                "---\ntitle: Test Document\nauthor: Test Author\nurl: https://example.com\n---"
            )?;
            // "Hello" appears twice consistently capitalised -> stays "Hello"
            // "Number123" -> trailing digits are dropped, leaving "Number"
            // "!" is kept as a token under the default punctuation set
            writeln!(
                file,
                "Hello world. Hello again world! Number123 will be ignored."
            )?;
            file.flush()?;
        }

        // Process with n=2 for bigrams
        let (entries, stats, metadata) = process_file(&path, 2)?;

        // Expected tokens: "Hello", "world", ".", "Hello", "again", "world", "!", "Number", "will", "be", "ignored", "."
        // Expected unique previous-words contexts (n-1=1):
        // "Hello" -> "world" (1), "again" (1)
        // "world" -> "." (1), "!" (1)
        // "." -> "Hello" (1)
        // "again" -> "world" (1)
        // "!" -> "Number" (1)
        // "Number" -> "will" (1)
        // "will" -> "be" (1)
        // "be" -> "ignored" (1)
        // "ignored" -> "." (1)
        // Total 9 unique previous-words contexts
        assert_eq!(
            entries.len(),
            9,
            "Expected 9 unique bigram previous-words contexts. Got: {:?}",
            entries
        );

        // "Hello" appears consistently capitalised, so stays "Hello"
        let hello_entry = entries
            .iter()
            .find(|e| e.previous_words == vec!["Hello".to_string()])
            .expect("Prefix ['Hello'] not found in entries");
        assert_eq!(
            hello_entry.next_words.len(),
            2,
            "Expected 'Hello' to have 2 next-words"
        );
        // Followers are sorted by count (desc), then alphabetically (asc). Here counts are equal.
        assert_eq!(
            hello_entry.next_words[0],
            ("again".to_string(), 1),
            "Follower of 'Hello' should include 'again'"
        );

        // Check previous-words ["world"]
        // "world" appears twice: "Hello world." and "again world!"
        // With "!" preserved as punctuation, the second "world" is followed by "!"
        let world_entry = entries
            .iter()
            .find(|e| e.previous_words == vec!["world".to_string()])
            .expect("Prefix ['world'] not found in entries");
        assert_eq!(
            world_entry.next_words.len(),
            2,
            "Expected 'world' to have 2 next-words, got: {:?}",
            world_entry.next_words
        );
        assert!(
            world_entry
                .next_words
                .iter()
                .any(|(word, count)| word == "." && *count == 1),
            "Expected 'world' to be followed by '.'"
        );
        assert!(
            world_entry
                .next_words
                .iter()
                .any(|(word, count)| word == "!" && *count == 1),
            "Expected 'world' to be followed by '!'"
        );

        assert!(
            entries
                .iter()
                .any(|e| e.previous_words == vec!["again".to_string()])
        );
        // "Number" appears consistently capitalised
        assert!(
            entries
                .iter()
                .any(|e| e.previous_words == vec!["Number".to_string()])
        );

        // Check stats
        assert_eq!(
            stats.total_tokens, 12,
            "Expected 12 tokens: Hello, world, ., Hello, again, world, !, Number, will, be, ignored, ."
        );
        assert_eq!(
            stats.unique_ngrams, 9,
            "Expected 9 unique previous-words contexts: Hello, world, ., again, !, Number, will, be, ignored"
        );
        // Vocabulary size: 9 distinct word types. Equal to unique_ngrams here
        // only because every type also appears as a previous word.
        assert_eq!(
            stats.unique_tokens, 9,
            "Expected 9 distinct word types (vocabulary)"
        );
        assert_eq!(
            stats.total_ngram_occurrences, 11,
            "Expected 11 total bigram occurrences"
        );

        // Check metadata
        let metadata = metadata.expect("Metadata should be present");
        assert_eq!(metadata.title, "Test Document");
        assert_eq!(metadata.author, "Test Author");
        assert_eq!(metadata.url, "https://example.com");
        assert_eq!(metadata.n, 2);

        Ok(())
    }

    #[test]
    fn test_process_small_file_trigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write to the file with frontmatter and explicitly flush
        {
            let mut file = File::create(&path)?;
            writeln!(
                file,
                "---\ntitle: Trigram Test\nauthor: Trigram Author\nurl: https://trigram.example.com\n---"
            )?;
            writeln!(file, "The quick brown fox jumps over the lazy dog")?;
            file.flush()?;
        }

        // Process with n=3 for trigrams
        let (entries, stats, metadata) = process_file(&path, 3)?;

        // For n=3, each previous-words context is 2 words
        // Expected trigrams: [the, quick] -> brown, [quick, brown] -> fox, etc.
        assert!(!entries.is_empty());

        // Check specific previous-words contexts
        let the_quick_entry = entries
            .iter()
            .find(|e| e.previous_words == vec!["the".to_string(), "quick".to_string()]);
        assert!(
            the_quick_entry.is_some(),
            "Expected previous-words ['the', 'quick'] not found"
        );
        let the_quick_entry = the_quick_entry.unwrap();
        assert_eq!(the_quick_entry.next_words.len(), 1);
        assert_eq!(the_quick_entry.next_words[0], ("brown".to_string(), 1));

        // Check previous-words [quick, brown]
        let quick_brown_entry = entries
            .iter()
            .find(|e| e.previous_words == vec!["quick".to_string(), "brown".to_string()]);
        assert!(
            quick_brown_entry.is_some(),
            "Expected previous-words ['quick', 'brown'] not found"
        );
        let quick_brown_entry = quick_brown_entry.unwrap();
        assert_eq!(quick_brown_entry.next_words.len(), 1);
        assert_eq!(quick_brown_entry.next_words[0], ("fox".to_string(), 1));

        // Check that we have stats
        assert_eq!(stats.total_tokens, 9); // the, quick, brown, fox, jumps, over, the, lazy, dog
        assert!(stats.unique_ngrams > 0);
        // 8 distinct word types (the, quick, brown, fox, jumps, over, lazy,
        // dog); "the" repeats. Differs from the 7 unique previous-words
        // contexts because "dog" only ever appears as a next word.
        assert_eq!(
            stats.unique_tokens, 8,
            "Expected 8 distinct word types (vocabulary)"
        );
        assert!(stats.total_ngram_occurrences > 0);

        // Check metadata
        let metadata = metadata.expect("Metadata should be present");
        assert_eq!(metadata.title, "Trigram Test");
        assert_eq!(metadata.author, "Trigram Author");
        assert_eq!(metadata.url, "https://trigram.example.com");
        assert_eq!(metadata.n, 3);

        Ok(())
    }

    #[test]
    fn test_save_to_json_bigrams() -> io::Result<()> {
        // Example data for bigrams (n=2, context size = 1)
        // Followers should be pre-sorted as `convert_to_entries` would do:
        // "hello" -> next-words: ("world", 2), ("again", 1) -- this order is correct based on count.
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["hello".to_string()],
                next_words: vec![("world".to_string(), 2), ("again".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["world".to_string()],
                next_words: vec![("hello".to_string(), 1)],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Create metadata
        let metadata = Metadata {
            title: "Test Bigrams".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/bigrams".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        assert_eq!(data.len(), 2);
        // Prefix "hello": total_original_count=3 (k=1, max_val=9). Followers: "world"(2), "again"(1)
        // Original cumulative: world:2, again:3
        // Scaled: world (2/3 * 9) = 6, again (3/3 * 9) = 9
        assert_eq!(data[0][0], serde_json::json!("hello"));
        assert_eq!(data[0][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[0][2], serde_json::json!(["world", 6]));
        assert_eq!(data[0][3], serde_json::json!(["again", 9]));
        // Prefix "world": total_original_count=1 (k=1, max_val=9)
        assert_eq!(data[1][0], serde_json::json!("world"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[1][2], serde_json::json!(["hello", 9])); // (1/1 * 9).round() = 9

        // Check metadata
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Bigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/bigrams");
        assert_eq!(meta.get("n").unwrap(), 2);

        Ok(())
    }

    #[test]
    fn test_save_to_json_trigrams() -> io::Result<()> {
        // Example data for trigrams (n=3, context size = 2)
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["the".to_string(), "quick".to_string()],
                next_words: vec![("brown".to_string(), 1)], // 1 unique next-word
            },
            WordFollowEntry {
                previous_words: vec!["quick".to_string(), "brown".to_string()],
                next_words: vec![("fox".to_string(), 1)], // 1 unique next-word
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Create metadata
        let metadata = Metadata {
            title: "Test Trigrams".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/trigrams".to_string(),
            n: 3,
            subtitle: "A trigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        // Both entries: total_original_count=1 (k=1, max_val=9)
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        assert_eq!(data.len(), 2);
        // Entry ["the", "quick"]
        assert_eq!(data[0][0], serde_json::json!("the quick"));
        assert_eq!(data[0][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[0][2], serde_json::json!(["brown", 9])); // (1/1 * 9).round() = 9
        // Entry ["quick", "brown"]
        assert_eq!(data[1][0], serde_json::json!("quick brown"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[1][2], serde_json::json!(["fox", 9])); // (1/1 * 9).round() = 9

        // Check metadata
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Trigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/trigrams");
        assert_eq!(meta.get("n").unwrap(), 3);

        Ok(())
    }

    #[test]
    fn test_save_to_json_cumulative_counts() -> io::Result<()> {
        // Test data with multiple next-words having different counts
        // Previous-words "the": next-words dog(5), cat(3), bird(2) - sorted by count from largest to smallest
        // Total original = 10. 3 unique next-words.
        // Original cumulative: dog:5, cat:8, bird:10
        let entries = vec![WordFollowEntry {
            previous_words: vec!["the".to_string()],
            next_words: vec![
                ("dog".to_string(), 5),
                ("cat".to_string(), 3),
                ("bird".to_string(), 2),
            ],
        }];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Create metadata
        let metadata = Metadata {
            title: "Cumulative Test".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/cumulative".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        // total_original_count=10 (k=2, max_val=99). Factor = 9.9
        // Original cumulative: dog:5, cat:8 (5+3), bird:10 (8+2)
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        assert_eq!(data.len(), 1);
        assert_eq!(data[0][0], serde_json::json!("the"));
        assert_eq!(data[0][1], serde_json::json!(99)); // Total scaled to 99
        assert_eq!(
            data[0][2],
            serde_json::json!(["dog", (5.0_f64 * 9.9_f64).round() as u64])
        ); // 50
        assert_eq!(
            data[0][3],
            serde_json::json!(["cat", (8.0_f64 * 9.9_f64).round() as u64])
        ); // 79
        assert_eq!(
            data[0][4],
            serde_json::json!(["bird", (10.0_f64 * 9.9_f64).round() as u64])
        ); // 99

        // Check metadata
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Cumulative Test");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/cumulative");
        assert_eq!(meta.get("n").unwrap(), 2);

        Ok(())
    }

    #[test]
    fn test_save_to_json_raw_output() -> Result<(), Box<dyn std::error::Error>> {
        use serde_json::Value;
        use std::fs;
        use tempfile::NamedTempFile;

        // Create test entries with known counts
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["the".to_string()],
                next_words: vec![
                    ("dog".to_string(), 3),
                    ("cat".to_string(), 2),
                    ("bird".to_string(), 1),
                ],
            },
            WordFollowEntry {
                previous_words: vec!["a".to_string()],
                next_words: vec![("house".to_string(), 5), ("tree".to_string(), 4)],
            },
        ];

        let metadata = Metadata {
            title: "Test Document".to_string(),
            author: "Test Author".to_string(),
            url: "https://test.com".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with raw=true (no scaling)
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path();

        save_to_json(&entries, path, Some(&metadata), None, true)?;

        let content = fs::read_to_string(path)?;
        let json: Value = serde_json::from_str(&content)?;

        // Check the data array
        let data = json
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        // First entry: "the" with raw cumulative counts
        assert_eq!(data[0][0], serde_json::json!("the"));
        assert_eq!(data[0][1], serde_json::json!(6)); // Total: 3+2+1=6
        assert_eq!(data[0][2], serde_json::json!(["dog", 3])); // Raw cumulative: 3
        assert_eq!(data[0][3], serde_json::json!(["cat", 5])); // Raw cumulative: 3+2=5
        assert_eq!(data[0][4], serde_json::json!(["bird", 6])); // Raw cumulative: 3+2+1=6

        // Second entry: "a" with raw cumulative counts
        assert_eq!(data[1][0], serde_json::json!("a"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total: 5+4=9
        assert_eq!(data[1][2], serde_json::json!(["house", 5])); // Raw cumulative: 5
        assert_eq!(data[1][3], serde_json::json!(["tree", 9])); // Raw cumulative: 5+4=9

        Ok(())
    }

    #[test]
    fn test_save_to_json_raw_vs_scaled() -> Result<(), Box<dyn std::error::Error>> {
        use serde_json::Value;
        use std::fs;
        use tempfile::NamedTempFile;

        // Create test entries
        let entries = vec![WordFollowEntry {
            previous_words: vec!["test".to_string()],
            next_words: vec![
                ("word1".to_string(), 10),
                ("word2".to_string(), 8),
                ("word3".to_string(), 7),
            ],
        }];

        let metadata = Metadata {
            title: "Test".to_string(),
            author: "Test".to_string(),
            url: "https://test.com".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test raw output
        let raw_file = NamedTempFile::new()?;
        save_to_json(&entries, raw_file.path(), Some(&metadata), None, true)?;

        let raw_content = fs::read_to_string(raw_file.path())?;
        let raw_json: Value = serde_json::from_str(&raw_content)?;
        let raw_data = raw_json.get("data").unwrap().as_array().unwrap();

        // Check raw values
        assert_eq!(raw_data[0][1], serde_json::json!(25)); // Total: 10+8+7=25
        assert_eq!(raw_data[0][2][1], serde_json::json!(10)); // First cumulative
        assert_eq!(raw_data[0][3][1], serde_json::json!(18)); // Second cumulative
        assert_eq!(raw_data[0][4][1], serde_json::json!(25)); // Third cumulative

        // Test scaled output (default scaling)
        let scaled_file = NamedTempFile::new()?;
        save_to_json(&entries, scaled_file.path(), Some(&metadata), None, false)?;

        let scaled_content = fs::read_to_string(scaled_file.path())?;
        let scaled_json: Value = serde_json::from_str(&scaled_content)?;
        let scaled_data = scaled_json.get("data").unwrap().as_array().unwrap();

        // With total 25, should scale to [0, 99] range
        assert_eq!(scaled_data[0][1], serde_json::json!(99)); // Scaled total

        // Values should be different from raw
        assert_ne!(scaled_data[0][2][1], raw_data[0][2][1]);
        assert_ne!(scaled_data[0][3][1], raw_data[0][3][1]);
        assert_ne!(scaled_data[0][4][1], raw_data[0][4][1]);

        Ok(())
    }

    #[test]
    fn test_split_entries_into_books() {
        // Create test entries with various previous-words
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["apple".to_string()],
                next_words: vec![("pie".to_string(), 3), ("juice".to_string(), 2)],
            },
            WordFollowEntry {
                previous_words: vec!["banana".to_string()],
                next_words: vec![("split".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["cherry".to_string()],
                next_words: vec![("pie".to_string(), 2)],
            },
            WordFollowEntry {
                previous_words: vec!["date".to_string()],
                next_words: vec![("palm".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["elderberry".to_string()],
                next_words: vec![("wine".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["fig".to_string()],
                next_words: vec![("tree".to_string(), 2)],
            },
            WordFollowEntry {
                previous_words: vec!["grape".to_string()],
                next_words: vec![("vine".to_string(), 3), ("juice".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["honeydew".to_string()],
                next_words: vec![("melon".to_string(), 1)],
            },
        ];

        // Test with no splitting (1 book)
        let books = split_entries_into_books(&entries, 1);
        assert_eq!(books.len(), 1);
        assert_eq!(books[0].0, "");
        assert_eq!(books[0].1.len(), 8);

        // Test with 2 books
        let books = split_entries_into_books(&entries, 2);
        assert_eq!(books.len(), 2);
        // Total entries should be preserved
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 8);

        // Test with 3 books - should return exactly 3 groups
        let books = split_entries_into_books(&entries, 3);
        assert_eq!(books.len(), 3, "Expected 3 books");
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 8);

        // Test that entries are not duplicated or lost
        for book in &books {
            for entry in &book.1 {
                // Check that each entry appears in original list
                assert!(
                    entries
                        .iter()
                        .any(|e| e.previous_words == entry.previous_words)
                );
            }
        }
    }

    #[test]
    fn test_split_entries_balanced() {
        // Create entries with uneven distribution of next-words
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["a".to_string()],
                next_words: vec![("x".to_string(), 100)], // Heavy entry
            },
            WordFollowEntry {
                previous_words: vec!["b".to_string()],
                next_words: vec![("y".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["c".to_string()],
                next_words: vec![("z".to_string(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["d".to_string()],
                next_words: vec![("w".to_string(), 100)], // Heavy entry
            },
        ];

        // Split into 2 books - should balance by next-word count
        let books = split_entries_into_books(&entries, 2);

        // Debug output
        eprintln!("Books created: {}", books.len());
        for (name, entries) in &books {
            eprintln!("  Book '{}': {} entries", name, entries.len());
        }

        assert_eq!(books.len(), 2);

        // Both books should have entries
        assert!(!books[0].1.is_empty());
        assert!(!books[1].1.is_empty());

        // Total entries preserved
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 4);
    }

    // Capitalisation tests

    #[test]
    fn test_capitalisation_preserved_when_consistent() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Capitalisation")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            // Sally appears twice with same capitalisation - should stay Sally
            writeln!(file, "Sally said hello. Sally waved goodbye.")?;
            file.flush()?;
        }

        let (entries, _stats, _metadata) = process_file(&path, 2)?;

        // Check if Sally is preserved as capitalised
        let sally_entry = entries
            .iter()
            .find(|e| e.previous_words[0].to_lowercase() == "sally");

        assert!(sally_entry.is_some(), "Should have Sally entry");
        let sally_entry = sally_entry.unwrap();
        assert_eq!(
            sally_entry.previous_words[0], "Sally",
            "Sally should remain capitalised when consistent"
        );

        Ok(())
    }

    #[test]
    fn test_capitalisation_normalised_when_mixed() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Mixed Case")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            // Hello appears with different capitalisation - should normalise to lowercase
            writeln!(file, "Hello world. hello again.")?;
            file.flush()?;
        }

        let (entries, _stats, _metadata) = process_file(&path, 2)?;

        // Check if hello is normalised to lowercase
        let hello_entry = entries
            .iter()
            .find(|e| e.previous_words[0].to_lowercase() == "hello");

        assert!(hello_entry.is_some(), "Should have hello entry");
        let hello_entry = hello_entry.unwrap();
        assert_eq!(
            hello_entry.previous_words[0], "hello",
            "Mixed case 'Hello/hello' should normalise to lowercase"
        );

        Ok(())
    }

    #[test]
    fn test_special_case_i_always_uppercase() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test I Case")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            // "I" should always be uppercase regardless of mixed usage
            writeln!(file, "I think that i am right and I know it.")?;
            file.flush()?;
        }

        let (entries, _stats, _metadata) = process_file(&path, 2)?;

        // Check that "I" is preserved as uppercase
        let i_entry = entries
            .iter()
            .find(|e| e.previous_words[0].to_lowercase() == "i");

        assert!(i_entry.is_some(), "Should have I entry");
        let i_entry = i_entry.unwrap();
        assert_eq!(
            i_entry.previous_words[0], "I",
            "'I' should always be uppercase (allowlist)"
        );

        Ok(())
    }

    #[test]
    fn test_acronyms_preserved() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Acronyms")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            // NASA appears consistently uppercase - should stay NASA
            writeln!(file, "NASA launched rockets. NASA announced plans.")?;
            file.flush()?;
        }

        let (entries, _stats, _metadata) = process_file(&path, 2)?;

        let nasa_entry = entries
            .iter()
            .find(|e| e.previous_words[0].to_lowercase() == "nasa");

        assert!(nasa_entry.is_some(), "Should have NASA entry");
        let nasa_entry = nasa_entry.unwrap();
        assert_eq!(
            nasa_entry.previous_words[0], "NASA",
            "NASA should remain uppercase when consistent"
        );

        Ok(())
    }

    // Cutouts n-gram tests

    #[test]
    fn test_cutouts_bigram_previous_words() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Cutouts")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            writeln!(file, "one two three four")?;
            file.flush()?;
        }

        let (tokens, metadata) = process_file_for_cutouts(&path, default_punctuation(), 2)?;

        assert_eq!(metadata.title, "Test Cutouts");
        assert_eq!(tokens.len(), 4);

        // First token has no previous-words (bigram needs 1 preceding token)
        assert_eq!(tokens[0].text, "one");
        assert!(tokens[0].previous_words.is_empty());

        // Second token has previous-words ["one"]
        assert_eq!(tokens[1].text, "two");
        assert_eq!(tokens[1].previous_words, vec!["one"]);

        // Third token has previous-words ["two"]
        assert_eq!(tokens[2].text, "three");
        assert_eq!(tokens[2].previous_words, vec!["two"]);

        // Fourth token has previous-words ["three"]
        assert_eq!(tokens[3].text, "four");
        assert_eq!(tokens[3].previous_words, vec!["three"]);

        Ok(())
    }

    #[test]
    fn test_cutouts_trigram_previous_words() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Trigram Cutouts")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            writeln!(file, "one two three four five")?;
            file.flush()?;
        }

        let (tokens, _metadata) = process_file_for_cutouts(&path, default_punctuation(), 3)?;

        assert_eq!(tokens.len(), 5);

        // First two tokens have no previous-words (trigram needs 2 preceding tokens)
        assert_eq!(tokens[0].text, "one");
        assert!(tokens[0].previous_words.is_empty());

        assert_eq!(tokens[1].text, "two");
        assert!(tokens[1].previous_words.is_empty());

        // Third token has previous-words ["one", "two"]
        assert_eq!(tokens[2].text, "three");
        assert_eq!(tokens[2].previous_words, vec!["one", "two"]);

        // Fourth token has previous-words ["two", "three"]
        assert_eq!(tokens[3].text, "four");
        assert_eq!(tokens[3].previous_words, vec!["two", "three"]);

        // Fifth token has previous-words ["three", "four"]
        assert_eq!(tokens[4].text, "five");
        assert_eq!(tokens[4].previous_words, vec!["three", "four"]);

        Ok(())
    }

    #[test]
    fn test_cutouts_fourgram_previous_words() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test 4-gram Cutouts")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            writeln!(file, "a b c d e f")?;
            file.flush()?;
        }

        let (tokens, _metadata) = process_file_for_cutouts(&path, default_punctuation(), 4)?;

        assert_eq!(tokens.len(), 6);

        // First three tokens have no previous-words (4-gram needs 3 preceding tokens)
        assert!(tokens[0].previous_words.is_empty());
        assert!(tokens[1].previous_words.is_empty());
        assert!(tokens[2].previous_words.is_empty());

        // Fourth token has previous-words ["a", "b", "c"]
        assert_eq!(tokens[3].text, "d");
        assert_eq!(tokens[3].previous_words, vec!["a", "b", "c"]);

        // Fifth token has previous-words ["b", "c", "d"]
        assert_eq!(tokens[4].text, "e");
        assert_eq!(tokens[4].previous_words, vec!["b", "c", "d"]);

        // Sixth token has previous-words ["c", "d", "e"]
        assert_eq!(tokens[5].text, "f");
        assert_eq!(tokens[5].previous_words, vec!["c", "d", "e"]);

        Ok(())
    }

    #[test]
    fn test_cutouts_previous_words_skips_discarded_tokens() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Skip Discarded")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            // IV is a roman numeral - should be discarded
            writeln!(file, "chapter IV begins here")?;
            file.flush()?;
        }

        let (tokens, _metadata) = process_file_for_cutouts(&path, default_punctuation(), 2)?;

        // Tokens: chapter (keep), IV (discard), begins (keep), here (keep)
        assert_eq!(tokens.len(), 4);

        // chapter has no previous-words
        assert_eq!(tokens[0].text, "chapter");
        assert!(tokens[0].keep);
        assert!(tokens[0].previous_words.is_empty());

        // IV is discarded - no previous-words
        assert_eq!(tokens[1].text, "IV");
        assert!(!tokens[1].keep);
        assert!(tokens[1].previous_words.is_empty());

        // begins has previous-words ["chapter"] - skips discarded IV
        assert_eq!(tokens[2].text, "begins");
        assert!(tokens[2].keep);
        assert_eq!(tokens[2].previous_words, vec!["chapter"]);

        // here has previous-words ["begins"]
        assert_eq!(tokens[3].text, "here");
        assert!(tokens[3].keep);
        assert_eq!(tokens[3].previous_words, vec!["begins"]);

        Ok(())
    }

    #[test]
    fn test_repeat_cutout_tokens_multiplies_only_usable_tokens() {
        let mut tokens = vec![
            RawToken {
                index: 1,
                text: "alpha".to_string(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            },
            RawToken {
                index: 2,
                text: "beta".to_string(),
                keep: true,
                previous_words: vec!["alpha".to_string()],
                is_tool: false,
            },
            RawToken {
                index: 3,
                text: "IV".to_string(),
                keep: false,
                previous_words: vec![],
                is_tool: false,
            },
            RawToken {
                index: 4,
                text: "gamma".to_string(),
                keep: true,
                previous_words: vec!["beta".to_string()],
                is_tool: false,
            },
        ];

        repeat_cutout_tokens(&mut tokens, 3);

        // alpha (1x, no prev) + beta (3x) + IV (1x, discarded) + gamma (3x) = 8
        assert_eq!(tokens.len(), 8);

        let texts: Vec<&str> = tokens.iter().map(|t| t.text.as_str()).collect();
        assert_eq!(
            texts,
            vec![
                "alpha", "beta", "beta", "beta", "IV", "gamma", "gamma", "gamma"
            ]
        );

        // Duplicates land adjacent so a printed sheet shows a batch per word.
        assert!(tokens[1..4].iter().all(|t| t.text == "beta"));
        assert!(tokens[5..8].iter().all(|t| t.text == "gamma"));
    }

    #[test]
    fn test_repeat_cutout_tokens_factor_one_is_noop() {
        let original = vec![
            RawToken {
                index: 1,
                text: "alpha".to_string(),
                keep: true,
                previous_words: vec!["start".to_string()],
                is_tool: false,
            },
            RawToken {
                index: 2,
                text: "beta".to_string(),
                keep: true,
                previous_words: vec!["alpha".to_string()],
                is_tool: false,
            },
        ];
        let mut tokens = original.clone();
        repeat_cutout_tokens(&mut tokens, 1);
        assert_eq!(tokens, original);

        let mut tokens = original.clone();
        repeat_cutout_tokens(&mut tokens, 0);
        assert_eq!(tokens, original);
    }

    #[test]
    fn test_cutouts_previous_words_with_punctuation() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Test Punctuation Prefix")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            writeln!(file, "hello, world. yes")?;
            file.flush()?;
        }

        let (tokens, _metadata) = process_file_for_cutouts(&path, default_punctuation(), 2)?;

        // Tokens: hello, comma, world, period, yes
        assert_eq!(tokens.len(), 5);

        // hello has no previous-words
        assert_eq!(tokens[0].text, "hello");
        assert!(tokens[0].previous_words.is_empty());

        // comma has previous-words ["hello"]
        assert_eq!(tokens[1].text, ",");
        assert_eq!(tokens[1].previous_words, vec!["hello"]);

        // world has previous-words [","]
        assert_eq!(tokens[2].text, "world");
        assert_eq!(tokens[2].previous_words, vec![","]);

        // period has previous-words ["world"]
        assert_eq!(tokens[3].text, ".");
        assert_eq!(tokens[3].previous_words, vec!["world"]);

        // yes has previous-words ["."]
        assert_eq!(tokens[4].text, "yes");
        assert_eq!(tokens[4].previous_words, vec!["."]);

        Ok(())
    }

    #[test]
    fn test_entropy_zero_for_deterministic_model() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        {
            let mut file = File::create(&path)?;
            writeln!(file, "---\ntitle: T\nauthor: A\nurl: https://x.com\n---")?;
            writeln!(file, "a b c d e")?;
            file.flush()?;
        }
        let (_entries, stats, _meta) = process_file(&path, 2)?;
        assert!(
            stats.entropy.abs() < 1e-10,
            "Deterministic model should have zero entropy, got {}",
            stats.entropy
        );
        assert!(
            (stats.perplexity - 1.0).abs() < 1e-10,
            "Deterministic model should have perplexity 1.0, got {}",
            stats.perplexity
        );
        Ok(())
    }

    #[test]
    fn test_entropy_positive_for_nondeterministic_model() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        {
            let mut file = File::create(&path)?;
            writeln!(file, "---\ntitle: T\nauthor: A\nurl: https://x.com\n---")?;
            writeln!(file, "the cat the dog")?;
            file.flush()?;
        }
        let (_entries, stats, _meta) = process_file(&path, 2)?;
        assert!(
            stats.entropy > 0.0,
            "Non-deterministic model should have positive entropy"
        );
        assert!(
            stats.perplexity > 1.0,
            "Non-deterministic model should have perplexity > 1"
        );
        Ok(())
    }

    #[test]
    fn test_entropy_known_value() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        {
            let mut file = File::create(&path)?;
            writeln!(file, "---\ntitle: T\nauthor: A\nurl: https://x.com\n---")?;
            // "go" has 2 equally-likely next-words (left, right) -> H = 1.0 bit
            // "left" and "right" each have 1 deterministic next-word -> H = 0.0
            // Bigrams: go→left, left→go, go→right, right→go (4 total)
            // Weighted: (2/4)*1.0 + (1/4)*0.0 + (1/4)*0.0 = 0.5
            writeln!(file, "go left go right")?;
            file.flush()?;
        }
        let (_entries, stats, _meta) = process_file(&path, 2)?;

        // "go" context: 2 bigrams, entropy 1.0 bit, weight 2/3
        // "left" context: 1 bigram, entropy 0.0 bit, weight 1/3
        // Weighted: (2/3)*1.0 + (1/3)*0.0 = 0.667
        // But "right" is last word so only 3 bigrams total: go→left, left→go, go→right
        let expected = 2.0 / 3.0;
        assert!(
            (stats.entropy - expected).abs() < 1e-6,
            "Expected entropy ~{:.3}, got {:.6}",
            expected,
            stats.entropy
        );

        // "go" continues to {left, right} -> 2 distinct
        // "left" continues to {go} -> 1 distinct
        // ("right" never appears as a context: it's the last token.)
        // Branching factor = (2 + 1) / 2 = 1.5
        assert!(
            (stats.branching_factor - 1.5).abs() < 1e-6,
            "Expected branching factor 1.5, got {:.6}",
            stats.branching_factor
        );
        Ok(())
    }

    #[test]
    fn test_entropy_serialised_in_json() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        {
            let mut file = File::create(&path)?;
            writeln!(file, "---\ntitle: T\nauthor: A\nurl: https://x.com\n---")?;
            writeln!(file, "the cat sat on the mat and the cat ate")?;
            file.flush()?;
        }

        let (entries, stats, metadata) = process_file(&path, 2)?;

        let json_file = NamedTempFile::new()?;
        save_to_json(
            &entries,
            json_file.path(),
            metadata.as_ref(),
            Some(&stats),
            false,
        )?;

        let json: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(json_file.path())?))?;
        let json_stats = json
            .get("metadata")
            .unwrap()
            .get("stats")
            .expect("stats should be present in JSON");
        let json_entropy = json_stats.get("entropy").unwrap().as_f64().unwrap();
        let json_perplexity = json_stats.get("perplexity").unwrap().as_f64().unwrap();

        assert!(
            (json_entropy - stats.entropy).abs() < 1e-6,
            "JSON entropy should match computed entropy"
        );
        assert!(
            (json_perplexity - stats.perplexity).abs() < 1e-6,
            "JSON perplexity should match computed perplexity"
        );

        Ok(())
    }

    #[test]
    fn test_cutouts_metadata_gets_entropy_from_process_file() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        {
            let mut file = File::create(&path)?;
            writeln!(file, "---")?;
            writeln!(file, "title: Cutouts Entropy")?;
            writeln!(file, "author: Test")?;
            writeln!(file, "url: https://example.com")?;
            writeln!(file, "---")?;
            writeln!(file, "I do not like green eggs and ham I do not like them")?;
            file.flush()?;
        }

        // process_file_for_cutouts returns default entropy (set by caller)
        let (_tokens, mut cutouts_meta) =
            process_file_for_cutouts(&path, default_punctuation(), 2)?;

        // Simulate what run_cutouts_command does: get stats from process_file
        let (_entries, stats, _meta) = process_file(&path, 2)?;
        cutouts_meta.entropy = stats.entropy;
        cutouts_meta.perplexity = stats.perplexity;
        cutouts_meta.branching_factor = stats.branching_factor;

        assert!(
            cutouts_meta.entropy > 0.0,
            "Cutouts entropy should be positive for text with repeated previous-words"
        );
        assert!(
            cutouts_meta.perplexity > 1.0,
            "Cutouts perplexity should be > 1"
        );
        assert!(
            (cutouts_meta.perplexity - cutouts_meta.entropy.exp2()).abs() < 1e-10,
            "Perplexity should equal 2^entropy"
        );
        assert!(
            cutouts_meta.branching_factor > 1.0,
            "Branching factor should exceed 1 when at least one context has multiple continuations"
        );

        Ok(())
    }

    // --- sampling tests ----------------------------------------------------

    fn write_corpus(text: &str) -> io::Result<NamedTempFile> {
        let mut f = NamedTempFile::new()?;
        writeln!(f, "---")?;
        writeln!(f, "title: Sampling Test")?;
        writeln!(f, "author: Test")?;
        writeln!(f, "url: https://example.com")?;
        writeln!(f, "---")?;
        writeln!(f, "{text}")?;
        f.flush()?;
        Ok(f)
    }

    fn rng(seed: u64) -> rand_chacha::ChaCha8Rng {
        use rand::SeedableRng;
        rand_chacha::ChaCha8Rng::seed_from_u64(seed)
    }

    #[test]
    fn test_sample_empty_model_errors() {
        let mut r = rng(0);
        let err = sample(&[], &["the".into()], 5, &mut r).unwrap_err();
        assert_eq!(err, SampleError::EmptyModel);
    }

    #[test]
    fn test_sample_prompt_too_short_for_trigram() -> io::Result<()> {
        let f = write_corpus("the cat sat on the mat the cat sat")?;
        let (entries, _, _) = process_file(f.path(), 3)?;

        let mut r = rng(0);
        let err = sample(&entries, &["the".into()], 5, &mut r).unwrap_err();
        assert_eq!(err, SampleError::PromptTooShort { needed: 2, got: 1 });
        Ok(())
    }

    #[test]
    fn test_sample_prompt_context_not_found() -> io::Result<()> {
        let f = write_corpus("alpha beta gamma alpha beta delta")?;
        let (entries, _, _) = process_file(f.path(), 2)?;

        let mut r = rng(0);
        let err = sample(&entries, &["zzznotaword".into()], 5, &mut r).unwrap_err();
        match err {
            SampleError::PromptContextNotFound { context } => {
                assert_eq!(context, vec!["zzznotaword".to_string()]);
            }
            other => panic!("expected PromptContextNotFound, got {other:?}"),
        }
        Ok(())
    }

    #[test]
    fn test_sample_dead_end_returns_partial() -> io::Result<()> {
        // "alpha beta gamma" gives previous-words {alpha->beta, beta->gamma}.
        // "gamma" has no entry as a previous-word, so sampling from "alpha"
        // for 3 tokens must hit a dead-end after producing 2.
        let f = write_corpus("alpha beta gamma")?;
        let (entries, _, _) = process_file(f.path(), 2)?;

        let mut r = rng(0);
        let err = sample(&entries, &["alpha".into()], 5, &mut r).unwrap_err();
        match err {
            SampleError::DeadEnd { context, generated } => {
                assert_eq!(context, vec!["gamma".to_string()]);
                assert_eq!(generated, vec!["beta".to_string(), "gamma".to_string()]);
            }
            other => panic!("expected DeadEnd, got {other:?}"),
        }
        Ok(())
    }

    #[test]
    fn test_sample_deterministic_with_same_seed() -> io::Result<()> {
        // Cyclic corpus: every token has a successor (the -> {cat, dog, bird},
        // each animal -> the), so a 10-token walk can never dead-end on any RNG
        // sampling path. Keeps the test robust across rand versions.
        let f = write_corpus(
            "the cat the dog the bird the cat the dog the bird the cat the dog the bird",
        )?;
        let (entries, _, _) = process_file(f.path(), 2)?;
        let prompt = vec!["the".to_string()];

        let mut r1 = rng(12345);
        let mut r2 = rng(12345);
        let a = sample(&entries, &prompt, 10, &mut r1).unwrap();
        let b = sample(&entries, &prompt, 10, &mut r2).unwrap();
        assert_eq!(a, b);
        assert_eq!(a.len(), 10);
        Ok(())
    }

    #[test]
    fn test_sample_uses_only_tail_of_prompt() -> io::Result<()> {
        // Bigram model: only the last token of the prompt should be used as context.
        // Cyclic corpus so every sampled token has a known successor.
        let f = write_corpus("alpha beta gamma alpha beta gamma alpha beta gamma alpha")?;
        let (entries, _, _) = process_file(f.path(), 2)?;

        let mut r1 = rng(99);
        let mut r2 = rng(99);
        let a = sample(
            &entries,
            &["completely".into(), "unrelated".into(), "beta".into()],
            3,
            &mut r1,
        )
        .unwrap();
        let b = sample(&entries, &["beta".into()], 3, &mut r2).unwrap();
        assert_eq!(a, b);
        Ok(())
    }

    #[test]
    fn test_sample_trigram_with_two_word_prompt() -> io::Result<()> {
        // Cyclic trigram corpus: "the cat" -> {sat, ran, ate}, and every 2-word
        // context leads back to "the cat" (… on the cat …), so a 5-token walk
        // never dead-ends on any RNG path. Robust across rand versions.
        let f = write_corpus(
            "the cat sat on the cat ran on the cat ate on the cat sat on the cat ran on the cat ate on the cat",
        )?;
        let (entries, _, _) = process_file(f.path(), 3)?;

        let mut r = rng(2026);
        let generated = sample(&entries, &["the".into(), "cat".into()], 5, &mut r).unwrap();
        assert_eq!(generated.len(), 5);
        // First sampled token must be one of the recorded successors of "the cat".
        assert!(
            ["sat", "ran", "ate"].contains(&generated[0].as_str()),
            "unexpected first token: {}",
            generated[0]
        );
        Ok(())
    }

    #[test]
    fn test_sample_prompt_normalised_through_counter() -> io::Result<()> {
        // Mixed case in corpus: lowercase "the" appears more often, so it's the canonical form.
        let f = write_corpus("the cat sat. The cat sat. the dog ran.")?;
        let mut counter = NGramCounter::new(2, default_punctuation());
        counter.process_file(f.path())?;
        let entries = counter.get_entries();

        // Prompt in uppercase should be normalised to the canonical "the".
        let normalised = counter.normalize("THE");
        assert_eq!(normalised, vec!["the".to_string()]);

        let mut r = rng(0);
        let generated = sample(&entries, &normalised, 3, &mut r).unwrap();
        assert_eq!(generated.len(), 3);
        Ok(())
    }

    #[test]
    fn test_sample_weighted_distribution_favours_common_successor() -> io::Result<()> {
        // "the" is followed by "cat" 9 times and "dog" 1 time. Over many trials,
        // "cat" should dominate as the first sampled token.
        let f = write_corpus(
            "the cat the cat the cat the cat the cat the cat the cat the cat the cat the dog",
        )?;
        let (entries, _, _) = process_file(f.path(), 2)?;

        let prompt = vec!["the".to_string()];
        let mut cat = 0;
        let mut dog = 0;
        for seed in 0..200u64 {
            let mut r = rng(seed);
            let g = sample(&entries, &prompt, 1, &mut r).unwrap();
            match g[0].as_str() {
                "cat" => cat += 1,
                "dog" => dog += 1,
                other => panic!("unexpected successor: {other}"),
            }
        }
        assert!(
            cat > dog * 3,
            "expected `cat` to dominate (got cat={cat}, dog={dog})"
        );
        Ok(())
    }
}
