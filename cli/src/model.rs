use std::collections::{BTreeMap, BTreeSet};

use rand::Rng;
use rand::distr::{Distribution, weighted::WeightedIndex};
use serde::Serialize;

use crate::error::{Error, Result};
use crate::text::{Normalizer, sort_key};

/// Context (the n-1 previous words) → next word → count. Both levels are
/// ordered maps so every derived view (entries, statistics, sampling) is
/// deterministic.
pub type ContextTable = BTreeMap<Vec<String>, BTreeMap<String, usize>>;

/// An n-gram model: the count table plus the `n` it was built with. Every
/// other representation --- the sorted entries the booklet prints, the
/// statistics on its title page, the samples --- is derived from this one
/// by a method, so nothing has to be kept in step by hand.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Model {
    n: usize,
    /// How many tokens the model was built from. Kept because it is not
    /// recoverable from the table once a corpus is shorter than `n`.
    total_tokens: usize,
    contexts: ContextTable,
}

/// Helper function to get model type string (e.g., "bigram", "trigram")
pub fn model_type_str(n: usize) -> String {
    match n {
        1 => "unigram".to_string(),
        2 => "bigram".to_string(),
        3 => "trigram".to_string(),
        _ => format!("{n}-gram"),
    }
}

impl Model {
    /// Count every n-gram in a token sequence. Callers (clap, the wasm entry
    /// points) validate `n` at the edges; the model needs at least one word
    /// of context.
    pub fn from_tokens(n: usize, tokens: &[String]) -> Self {
        assert!(n >= 2, "Model requires n >= 2 (got {n})");
        let mut contexts = ContextTable::new();
        for window in tokens.windows(n) {
            let (context, next) = window.split_at(n - 1);
            *contexts
                .entry(context.to_vec())
                .or_default()
                .entry(next[0].clone())
                .or_default() += 1;
        }
        Self {
            n,
            total_tokens: tokens.len(),
            contexts,
        }
    }

    /// Tokenise `lines` with `normalizer` (see [`Normalizer::tokenize`]) and
    /// count the kept tokens.
    pub fn from_lines<S: AsRef<str>>(n: usize, normalizer: &Normalizer, lines: &[S]) -> Self {
        let tokens: Vec<String> = normalizer
            .tokenize(lines)
            .into_iter()
            .filter(|token| token.keep)
            .map(|token| token.text)
            .collect();
        Self::from_tokens(n, &tokens)
    }

    /// Wrap a table built elsewhere (the multi-document sheets path counts
    /// each document's cutouts separately so no n-gram crosses a seam).
    pub fn from_table(n: usize, total_tokens: usize, contexts: ContextTable) -> Self {
        assert!(n >= 2, "Model requires n >= 2 (got {n})");
        Self {
            n,
            total_tokens,
            contexts,
        }
    }

    pub fn n(&self) -> usize {
        self.n
    }

    /// Words of context per entry: `n - 1`.
    pub fn context_size(&self) -> usize {
        self.n - 1
    }

    pub fn total_tokens(&self) -> usize {
        self.total_tokens
    }

    pub fn contexts(&self) -> &ContextTable {
        &self.contexts
    }

    pub fn is_empty(&self) -> bool {
        self.contexts.is_empty()
    }

    /// The model as the booklet prints it: contexts in dictionary order
    /// (pinyin for Chinese, case-insensitive alphabetical otherwise), each
    /// with its next words by count (largest first) then dictionary order.
    pub fn entries(&self) -> Vec<WordFollowEntry> {
        let mut entries: Vec<WordFollowEntry> = self
            .contexts
            .iter()
            .map(|(previous_words, next_word_counts)| {
                let mut next_words: Vec<(String, usize)> = next_word_counts
                    .iter()
                    .map(|(word, count)| (word.clone(), *count))
                    .collect();
                next_words.sort_by(|a, b| {
                    b.1.cmp(&a.1)
                        .then_with(|| sort_key(&a.0).cmp(&sort_key(&b.0)))
                });
                WordFollowEntry {
                    previous_words: previous_words.clone(),
                    next_words,
                }
            })
            .collect();

        entries.sort_by_cached_key(|e| {
            e.previous_words
                .iter()
                .map(|w| sort_key(w))
                .collect::<Vec<_>>()
        });
        entries
    }

    /// Vocabulary size and the entropy family of statistics.
    pub fn summary(&self) -> ModelSummary {
        let mut vocab: BTreeSet<&str> = BTreeSet::new();
        for (context, next_words) in &self.contexts {
            vocab.extend(context.iter().map(String::as_str));
            vocab.extend(next_words.keys().map(String::as_str));
        }

        let total_occurrences = self.total_ngram_occurrences();

        // Weighted average conditional entropy: Σ (context_total / total) * H(context)
        let mut entropy = 0.0;
        if total_occurrences > 0 {
            for next_word_counts in self.contexts.values() {
                let context_total = next_word_counts.values().sum::<usize>() as f64;
                let context_entropy: f64 = next_word_counts
                    .values()
                    .map(|&count| {
                        let p = count as f64 / context_total;
                        -p * p.log2()
                    })
                    .sum();
                entropy += (context_total / total_occurrences as f64) * context_entropy;
            }
        }

        // Unweighted mean of distinct continuations per context.
        let branching_factor = if self.contexts.is_empty() {
            0.0
        } else {
            self.contexts.values().map(BTreeMap::len).sum::<usize>() as f64
                / self.contexts.len() as f64
        };

        ModelSummary {
            unique_tokens: vocab.len(),
            entropy,
            perplexity: entropy.exp2(),
            branching_factor,
        }
    }

    fn total_ngram_occurrences(&self) -> usize {
        self.contexts.values().flat_map(BTreeMap::values).sum()
    }

    /// The full statistics block the booklet's title page prints.
    pub fn stats(&self) -> ProcessingStats {
        let most_common_ngram = self
            .contexts
            .iter()
            .flat_map(|(context, next_words)| {
                next_words
                    .iter()
                    .map(move |(next_word, count)| MostCommonNgram {
                        context: context.clone(),
                        next_word: next_word.clone(),
                        count: *count,
                    })
            })
            // `max_by_key` keeps the last maximum; the first in table order is
            // the conventional tie-break, so compare with `>` by hand.
            .fold(None::<MostCommonNgram>, |best, candidate| match best {
                Some(b) if b.count >= candidate.count => Some(b),
                _ => Some(candidate),
            });

        let most_popular_context = self
            .contexts
            .iter()
            .map(|(context, next_words)| MostPopularContext {
                context: context.clone(),
                count: next_words.values().sum(),
            })
            .fold(None::<MostPopularContext>, |best, candidate| match best {
                Some(b) if b.count >= candidate.count => Some(b),
                _ => Some(candidate),
            });

        ProcessingStats {
            total_tokens: self.total_tokens,
            unique_contexts: self.contexts.len(),
            total_ngram_occurrences: self.total_ngram_occurrences(),
            most_common_ngram,
            most_popular_context,
            summary: self.summary(),
        }
    }

    /// Sample `n_tokens` tokens, continuing from `prompt`.
    ///
    /// `prompt` must contain at least `n - 1` tokens, already normalised to
    /// match the model's vocabulary (use the same [`Normalizer`] the model
    /// was built with). Returns only the newly generated tokens.
    ///
    /// Errors:
    /// - [`SampleError::EmptyModel`] if the model has no entries.
    /// - [`SampleError::PromptTooShort`] if the prompt has fewer than `n - 1` tokens.
    /// - [`SampleError::PromptContextNotFound`] if the prompt's tail context is unseen.
    /// - [`SampleError::DeadEnd`] if generation hits a context with no successors;
    ///   the partially-generated tokens are returned inside the error.
    pub fn sample<R: Rng + ?Sized>(
        &self,
        prompt: &[String],
        n_tokens: usize,
        rng: &mut R,
    ) -> std::result::Result<Vec<String>, SampleError> {
        if self.contexts.is_empty() {
            return Err(SampleError::EmptyModel);
        }
        let context_size = self.context_size();
        if prompt.len() < context_size {
            return Err(SampleError::PromptTooShort {
                needed: context_size,
                got: prompt.len(),
            });
        }

        let mut context: Vec<String> = prompt[prompt.len() - context_size..].to_vec();
        if !self.contexts.contains_key(&context) {
            return Err(SampleError::PromptContextNotFound { context });
        }

        let mut generated = Vec::with_capacity(n_tokens);
        for _ in 0..n_tokens {
            let Some(next_words) = self.contexts.get(&context).filter(|nw| !nw.is_empty()) else {
                return Err(SampleError::DeadEnd { context, generated });
            };
            let dist = WeightedIndex::new(next_words.values().copied())
                .expect("counts are positive and non-empty");
            let chosen = next_words
                .keys()
                .nth(dist.sample(rng))
                .expect("index from the same iterator")
                .clone();

            generated.push(chosen.clone());
            context.remove(0);
            context.push(chosen);
        }

        Ok(generated)
    }

    /// Render a bigram frequency matrix as TSV, matching the legacy Python
    /// script. Rows and columns share the same sorted vocabulary; cells hold
    /// cumulative counts across the row, empty for zero.
    pub fn bigram_tsv(&self) -> Result<String> {
        if self.n != 2 {
            return Err(Error::TsvRequiresBigrams);
        }

        let mut vocab: Vec<&str> = self
            .contexts
            .iter()
            .flat_map(|(context, next_words)| {
                context.iter().chain(next_words.keys()).map(String::as_str)
            })
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect();
        vocab.sort_by(|a, b| sort_key(a).cmp(&sort_key(b)).then_with(|| a.cmp(b)));

        let mut output = format!("\t{}\n", vocab.join("\t"));
        for first in &vocab {
            output.push_str(first);
            let row = self.contexts.get(&vec![(*first).to_string()]);
            let mut cumulative = 0usize;
            for second in &vocab {
                output.push('\t');
                if let Some(count) = row.and_then(|r| r.get(*second)) {
                    cumulative += count;
                    output.push_str(&cumulative.to_string());
                }
            }
            output.push('\n');
        }

        Ok(output)
    }
}

/// One entry in the printed model: the n-1 previous words and the next-word
/// counts that follow them, in display order (see [`Model::entries`]).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WordFollowEntry {
    pub previous_words: Vec<String>,
    pub next_words: Vec<(String, usize)>,
}

impl WordFollowEntry {
    pub fn total(&self) -> usize {
        self.next_words.iter().map(|(_, count)| count).sum()
    }
}

/// Vocabulary size and the entropy family of statistics. Flattened into both
/// the booklet and cutouts metadata, so the two can never define them
/// differently.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub struct ModelSummary {
    /// Number of distinct word types: every word that appears as a context
    /// word or as a next-word continuation (the model's vocabulary size).
    pub unique_tokens: usize,
    /// Weighted average conditional entropy (bits per token)
    pub entropy: f64,
    /// Perplexity (2^entropy) --- effective number of choices per generation step
    pub perplexity: f64,
    /// Mean number of distinct next-word continuations per context
    /// (unweighted by frequency). Differs from perplexity by ignoring the
    /// probability distribution over continuations.
    pub branching_factor: f64,
}

/// The n-gram with the highest count.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MostCommonNgram {
    pub context: Vec<String>,
    pub next_word: String,
    pub count: usize,
}

/// The context with the most next-word occurrences in total.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MostPopularContext {
    pub context: Vec<String>,
    pub count: usize,
}

/// Summary statistics for a processed corpus, as printed on the booklet's
/// title page and by the CLI.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProcessingStats {
    /// Total number of tokens in the text
    pub total_tokens: usize,
    /// Number of distinct (n-1)-word contexts
    pub unique_contexts: usize,
    /// Total number of n-gram occurrences
    pub total_ngram_occurrences: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_common_ngram: Option<MostCommonNgram>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_popular_context: Option<MostPopularContext>,
    #[serde(flatten)]
    pub summary: ModelSummary,
}

/// Errors returned by [`Model::sample`].
#[derive(Debug, PartialEq, Eq, thiserror::Error)]
pub enum SampleError {
    /// The model has no entries to sample from.
    #[error("model has no entries")]
    EmptyModel,
    /// Prompt has fewer normalised tokens than the model's context size (n - 1).
    #[error("prompt too short: need at least {needed} normalised token(s) for context, got {got}")]
    PromptTooShort { needed: usize, got: usize },
    /// The prompt's tail context does not appear as a key in the model.
    #[error("prompt context not found in model: `{}`", context.join(" "))]
    PromptContextNotFound { context: Vec<String> },
    /// Sampling produced `generated` tokens, then hit a context with no successors.
    #[error(
        "dead-end context `{}` has no successors; stopped after generating {} token(s)",
        context.join(" "),
        generated.len()
    )]
    DeadEnd {
        context: Vec<String>,
        generated: Vec<String>,
    },
}

/// Format model entries as the booklet JSON "data" rows:
/// `["joined previous words", total, ["next word", cumulative], ...]`.
/// Without `raw`, cumulative counts are rescaled onto the 10^k faces of k d10
/// dice (k = digits of the true total), so each stored number is the last face
/// of that word's band and the entry's total is 10^k - 1.
pub fn format_entries(entries: &[WordFollowEntry], raw: bool) -> Vec<Vec<serde_json::Value>> {
    entries
        .iter()
        .map(|entry| {
            let mut row = vec![serde_json::Value::String(entry.previous_words.join(" "))];
            let total = entry.total();

            // Next words are already sorted by count (largest to smallest);
            // cumulative counts follow that order.
            let cumulative = entry.next_words.iter().scan(0, |sum, (word, count)| {
                *sum += count;
                Some((word, *sum))
            });

            if total == 0 {
                // No next-word occurrences: total is 0, no next-word data.
                row.push(serde_json::json!(0));
            } else if raw {
                row.push(serde_json::json!(total));
                row.extend(cumulative.map(|(w, c)| serde_json::json!([w, c])));
            } else {
                // 10^k scaling for d10 dice: k dice have 10^k faces, numbered
                // 0 to 10^k - 1 (e.g. total 75 -> k=2 -> faces 0-99). Each
                // threshold is the *last* face of that word's band, so it is
                // the rescaled cumulative count minus one, and the final word
                // always ends on the top face. Scaling onto 10^k - 1 instead
                // would hand every word but the last an extra face.
                //
                // u64 with a checked pow: a u32 overflows at a 10-digit total
                // (a billion-token context is far-fetched but not impossible
                // with a large corpus), and wrapping would silently corrupt
                // every dice range in the booklet.
                let k_digits = total.to_string().len() as u32;
                let faces = 10_u64.checked_pow(k_digits).unwrap_or(u64::MAX);
                let factor = faces as f64 / total as f64;

                row.push(serde_json::json!(faces - 1));
                row.extend(cumulative.map(|(w, c)| {
                    let scaled = (c as f64 * factor).round() as u64;
                    serde_json::json!([w, scaled.clamp(1, faces) - 1])
                }));
            }

            row
        })
        .collect()
}

/// One volume of a model split across several booklets.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Book {
    /// First-letter range label such as `A-K`, or empty for a single book.
    pub range: String,
    pub entries: Vec<WordFollowEntry>,
}

/// Split entries into `num_books` volumes of roughly equal printed length.
/// An entry's printed length is one line per distinct next word plus its
/// heading, so that is the weight balanced across books.
pub fn split_entries_into_books(entries: &[WordFollowEntry], num_books: usize) -> Vec<Book> {
    if num_books <= 1 || entries.is_empty() {
        return vec![Book {
            range: String::new(),
            entries: entries.to_vec(),
        }];
    }

    let entry_weight = |entry: &WordFollowEntry| (entry.next_words.len() + 1) as f64;
    let total_weight: f64 = entries.iter().map(entry_weight).sum();
    let target_per_book = total_weight / num_books as f64;

    let mut books = Vec::new();
    let mut start_idx = 0usize;
    let mut running_weight = 0f64;

    for (idx, entry) in entries.iter().enumerate() {
        running_weight += entry_weight(entry);

        let remaining_books = num_books.saturating_sub(books.len() + 1);
        if running_weight >= target_per_book && remaining_books > 0 {
            books.push(build_book(&entries[start_idx..=idx]));
            start_idx = idx + 1;
            running_weight = 0.0;
        }
    }

    if start_idx < entries.len() {
        books.push(build_book(&entries[start_idx..]));
    }

    books
}

fn build_book(entries: &[WordFollowEntry]) -> Book {
    let start_label = previous_words_label(&entries[0]);
    let end_label = previous_words_label(&entries[entries.len() - 1]);

    let range = if start_label == end_label {
        start_label
    } else {
        format!("{start_label}-{end_label}")
    };

    Book {
        range,
        entries: entries.to_vec(),
    }
}

fn previous_words_label(entry: &WordFollowEntry) -> String {
    entry
        .previous_words
        .first()
        .and_then(|p| p.chars().next())
        .map_or_else(|| "?".to_string(), |c| c.to_ascii_uppercase().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::text::NormalizerConfig;

    fn model(n: usize, text: &str) -> Model {
        let lines: Vec<&str> = text.lines().collect();
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &lines);
        Model::from_lines(n, &normalizer, &lines)
    }

    fn entry(previous: &[&str], next: &[(&str, usize)]) -> WordFollowEntry {
        WordFollowEntry {
            previous_words: previous.iter().map(|s| (*s).to_string()).collect(),
            next_words: next.iter().map(|(w, c)| ((*w).to_string(), *c)).collect(),
        }
    }

    fn rng(seed: u64) -> rand_chacha::ChaCha8Rng {
        use rand::SeedableRng;
        rand_chacha::ChaCha8Rng::seed_from_u64(seed)
    }

    #[test]
    fn counts_bigrams_and_applies_corpus_casing() {
        // "Hello" is consistently capitalised so it stays; "Number123" loses
        // its digits; "!" is a token under the default punctuation set.
        let m = model(
            2,
            "Hello world. Hello again world! Number123 will be ignored.",
        );
        let entries = m.entries();

        // Hello, world, ., again, !, Number, will, be, ignored
        assert_eq!(entries.len(), 9, "{entries:?}");
        assert_eq!(
            entries
                .iter()
                .find(|e| e.previous_words == ["Hello"])
                .unwrap()
                .next_words,
            vec![("again".to_string(), 1), ("world".to_string(), 1)]
        );
        let world = entries
            .iter()
            .find(|e| e.previous_words == ["world"])
            .unwrap();
        assert_eq!(
            world.next_words,
            vec![("!".to_string(), 1), (".".to_string(), 1)]
        );

        let stats = m.stats();
        assert_eq!(stats.total_tokens, 12);
        assert_eq!(stats.unique_contexts, 9);
        assert_eq!(stats.total_ngram_occurrences, 11);
        assert_eq!(stats.summary.unique_tokens, 9);
    }

    #[test]
    fn counts_trigrams_with_two_word_contexts() {
        let m = model(3, "The quick brown fox jumps over the lazy dog");
        let entries = m.entries();
        assert_eq!(
            entries
                .iter()
                .find(|e| e.previous_words == ["the", "quick"])
                .unwrap()
                .next_words,
            vec![("brown".to_string(), 1)]
        );
        assert_eq!(
            entries
                .iter()
                .find(|e| e.previous_words == ["quick", "brown"])
                .unwrap()
                .next_words,
            vec![("fox".to_string(), 1)]
        );
        let stats = m.stats();
        assert_eq!(stats.total_tokens, 9);
        // 8 word types; "dog" only ever appears as a next word, so it is in
        // the vocabulary but not a context.
        assert_eq!(stats.summary.unique_tokens, 8);
        assert_eq!(stats.unique_contexts, 7);
    }

    #[test]
    fn window_runs_across_lines() {
        let m = model(2, "one two\nthree four");
        assert!(m.contexts().contains_key(&vec!["two".to_string()]));
    }

    #[test]
    fn corpus_shorter_than_n_has_no_entries_but_counts_tokens() {
        let m = model(3, "one two");
        assert!(m.is_empty());
        assert_eq!(m.total_tokens(), 2);
        assert_eq!(m.stats().total_ngram_occurrences, 0);
        assert!(m.summary().entropy.abs() < 1e-12);
    }

    #[test]
    fn next_words_sort_by_count_then_dictionary_order() {
        let m = model(2, "the cat sat on the mat and the cat ate");
        let the = m
            .entries()
            .into_iter()
            .find(|e| e.previous_words == ["the"])
            .unwrap();
        assert_eq!(the.next_words[0], ("cat".to_string(), 2));
        assert_eq!(the.next_words[1], ("mat".to_string(), 1));

        let m = model(2, "he no test he yes test");
        let he = m
            .entries()
            .into_iter()
            .find(|e| e.previous_words == ["he"])
            .unwrap();
        assert_eq!(
            he.next_words,
            vec![("no".to_string(), 1), ("yes".to_string(), 1)]
        );
    }

    #[test]
    fn contexts_sort_case_insensitively() {
        // ASCII order would put "Zebra" before "apple".
        let m = model(2, "Apple pie. Zebra stripes. apple tart. banana split.");
        let order: Vec<String> = m
            .entries()
            .into_iter()
            .map(|e| e.previous_words[0].to_lowercase())
            .collect();
        let pos = |w: &str| order.iter().position(|o| o == w).unwrap();
        assert!(pos("apple") < pos("banana"));
        assert!(pos("banana") < pos("zebra"));
    }

    #[test]
    fn stats_pick_the_most_common_ngram_and_context() {
        let m = model(2, "the cat the cat the cat a dog the fox");
        let stats = m.stats();
        assert_eq!(
            stats.most_common_ngram,
            Some(MostCommonNgram {
                context: vec!["the".into()],
                next_word: "cat".into(),
                count: 3,
            })
        );
        assert_eq!(
            stats.most_popular_context,
            Some(MostPopularContext {
                context: vec!["the".into()],
                count: 4,
            })
        );
    }

    #[test]
    fn stats_serialise_flat() {
        let json = serde_json::to_value(model(2, "a b a c").stats()).unwrap();
        assert_eq!(json["total_tokens"], 4);
        assert_eq!(json["unique_contexts"], 2);
        assert_eq!(
            json["most_common_ngram"]["context"],
            serde_json::json!(["a"])
        );
        // ModelSummary is flattened, not nested.
        assert!(json["entropy"].is_number());
        assert!(json.get("summary").is_none());
    }

    #[test]
    fn entropy_zero_for_deterministic_model() {
        let s = model(2, "a b c d e").summary();
        assert!(s.entropy.abs() < 1e-10);
        assert!((s.perplexity - 1.0).abs() < 1e-10);
    }

    #[test]
    fn entropy_positive_for_nondeterministic_model() {
        let s = model(2, "the cat the dog").summary();
        assert!(s.entropy > 0.0);
        assert!(s.perplexity > 1.0);
    }

    #[test]
    fn entropy_known_value() {
        // Bigrams: go→left, left→go, go→right. "go" has two equally likely
        // continuations (1 bit) with weight 2/3; "left" is deterministic.
        let s = model(2, "go left go right").summary();
        assert!((s.entropy - 2.0 / 3.0).abs() < 1e-6, "{}", s.entropy);
        // "go" branches to 2, "left" to 1 ("right" is never a context).
        assert!((s.branching_factor - 1.5).abs() < 1e-6);
        assert!((s.perplexity - s.entropy.exp2()).abs() < 1e-10);
    }

    // --- format_entries -------------------------------------------------

    #[test]
    fn format_entries_scales_to_dice_range() {
        let entries = vec![entry(&["hello"], &[("world", 2), ("there", 1)])];

        let rows = format_entries(&entries, false);
        assert_eq!(
            rows,
            vec![vec![
                serde_json::json!("hello"),
                serde_json::json!(9),            // total 3 -> k=1 -> faces 0-9
                serde_json::json!(["world", 6]), // round(2 * 10/3) - 1
                serde_json::json!(["there", 9]),
            ]]
        );

        let raw_rows = format_entries(&entries, true);
        assert_eq!(raw_rows[0][1], serde_json::json!(3));
        assert_eq!(raw_rows[0][2], serde_json::json!(["world", 2]));
        assert_eq!(raw_rows[0][3], serde_json::json!(["there", 3]));
    }

    #[test]
    fn format_entries_cumulative_counts_with_two_digit_total() {
        // total 10 -> k=2 -> faces 0-99, factor 10: a 5/3/2 split of the
        // tallies gets 50/30/20 of the hundred faces.
        let entries = vec![entry(&["the"], &[("dog", 5), ("cat", 3), ("bird", 2)])];
        let rows = format_entries(&entries, false);
        assert_eq!(rows[0][1], serde_json::json!(99));
        assert_eq!(rows[0][2], serde_json::json!(["dog", 49]));
        assert_eq!(rows[0][3], serde_json::json!(["cat", 79]));
        assert_eq!(rows[0][4], serde_json::json!(["bird", 99]));
    }

    #[test]
    fn format_entries_splits_equal_counts_evenly() {
        // Two equally-likely words split the ten faces 5/5, not 6/4: the
        // thresholds are the last face of each band.
        let entries = vec![entry(&["spot"], &[("run", 1), ("stop", 1)])];
        let rows = format_entries(&entries, false);
        assert_eq!(rows[0][2], serde_json::json!(["run", 4]));
        assert_eq!(rows[0][3], serde_json::json!(["stop", 9]));
    }

    #[test]
    fn format_entries_joins_multi_word_contexts() {
        let rows = format_entries(&[entry(&["the", "quick"], &[("brown", 1)])], false);
        assert_eq!(rows[0][0], serde_json::json!("the quick"));
        assert_eq!(rows[0][2], serde_json::json!(["brown", 9]));
    }

    // --- books -------------------------------------------------------------

    #[test]
    fn split_entries_into_books_preserves_every_entry() {
        let entries: Vec<WordFollowEntry> = [
            "apple",
            "banana",
            "cherry",
            "date",
            "elderberry",
            "fig",
            "grape",
            "honeydew",
        ]
        .iter()
        .map(|w| entry(&[w], &[("x", 1)]))
        .collect();

        let one = split_entries_into_books(&entries, 1);
        assert_eq!(one.len(), 1);
        assert_eq!(one[0].range, "");
        assert_eq!(one[0].entries.len(), 8);

        for num_books in [2, 3] {
            let books = split_entries_into_books(&entries, num_books);
            assert_eq!(books.len(), num_books);
            let flattened: Vec<&WordFollowEntry> = books.iter().flat_map(|b| &b.entries).collect();
            assert_eq!(flattened.len(), 8);
            assert!(flattened.iter().zip(&entries).all(|(a, b)| *a == b));
        }
    }

    #[test]
    fn split_entries_balances_by_printed_length() {
        // "a" prints as six lines (five next words), the rest as two each:
        // twelve lines over two books, so the heavy entry fills book one.
        let entries = vec![
            entry(&["a"], &[("v", 1), ("w", 1), ("x", 1), ("y", 1), ("z", 1)]),
            entry(&["b"], &[("y", 1)]),
            entry(&["c"], &[("z", 1)]),
            entry(&["d"], &[("w", 1)]),
        ];
        let books = split_entries_into_books(&entries, 2);
        assert_eq!(books.len(), 2);
        assert_eq!(books[0].range, "A");
        assert_eq!(books[0].entries.len(), 1);
        assert_eq!(books[1].range, "B-D");
    }

    // --- sampling ----------------------------------------------------------

    #[test]
    fn sample_empty_model_errors() {
        let err = model(2, "")
            .sample(&["the".into()], 5, &mut rng(0))
            .unwrap_err();
        assert_eq!(err, SampleError::EmptyModel);
    }

    #[test]
    fn sample_prompt_too_short_for_trigram() {
        let m = model(3, "the cat sat on the mat the cat sat");
        let err = m.sample(&["the".into()], 5, &mut rng(0)).unwrap_err();
        assert_eq!(err, SampleError::PromptTooShort { needed: 2, got: 1 });
    }

    #[test]
    fn sample_prompt_context_not_found() {
        let m = model(2, "alpha beta gamma alpha beta delta");
        let err = m
            .sample(&["zzznotaword".into()], 5, &mut rng(0))
            .unwrap_err();
        assert_eq!(
            err,
            SampleError::PromptContextNotFound {
                context: vec!["zzznotaword".into()]
            }
        );
    }

    #[test]
    fn sample_dead_end_returns_partial() {
        // "gamma" is never a context, so sampling from "alpha" dead-ends
        // after producing two tokens.
        let m = model(2, "alpha beta gamma");
        let err = m.sample(&["alpha".into()], 5, &mut rng(0)).unwrap_err();
        assert_eq!(
            err,
            SampleError::DeadEnd {
                context: vec!["gamma".into()],
                generated: vec!["beta".into(), "gamma".into()],
            }
        );
    }

    #[test]
    fn sample_deterministic_with_same_seed() {
        // Cyclic corpus, so no walk can dead-end.
        let m = model(
            2,
            "the cat the dog the bird the cat the dog the bird the cat the dog the bird",
        );
        let prompt = vec!["the".to_string()];
        let a = m.sample(&prompt, 10, &mut rng(12345)).unwrap();
        let b = m.sample(&prompt, 10, &mut rng(12345)).unwrap();
        assert_eq!(a, b);
        assert_eq!(a.len(), 10);
    }

    #[test]
    fn sample_uses_only_tail_of_prompt() {
        let m = model(
            2,
            "alpha beta gamma alpha beta gamma alpha beta gamma alpha",
        );
        let a = m
            .sample(
                &["completely".into(), "unrelated".into(), "beta".into()],
                3,
                &mut rng(99),
            )
            .unwrap();
        let b = m.sample(&["beta".into()], 3, &mut rng(99)).unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn sample_trigram_with_two_word_prompt() {
        let m = model(
            3,
            "the cat sat on the cat ran on the cat ate on the cat sat on the cat ran on the cat ate on the cat",
        );
        let generated = m
            .sample(&["the".into(), "cat".into()], 5, &mut rng(2026))
            .unwrap();
        assert_eq!(generated.len(), 5);
        assert!(["sat", "ran", "ate"].contains(&generated[0].as_str()));
    }

    #[test]
    fn sample_weighted_distribution_favours_common_successor() {
        // "the" → "cat" 9 times, "dog" once.
        let m = model(
            2,
            "the cat the cat the cat the cat the cat the cat the cat the cat the cat the dog",
        );
        let prompt = vec!["the".to_string()];
        let (mut cat, mut dog) = (0, 0);
        for seed in 0..200u64 {
            match m.sample(&prompt, 1, &mut rng(seed)).unwrap()[0].as_str() {
                "cat" => cat += 1,
                "dog" => dog += 1,
                other => panic!("unexpected successor: {other}"),
            }
        }
        assert!(cat > dog * 3, "cat={cat}, dog={dog}");
    }

    // --- tsv ---------------------------------------------------------------

    #[test]
    fn renders_bigram_tsv() {
        let m = model(2, "a b a b a c b c b c b c");
        let tsv = m.bigram_tsv().unwrap();
        assert_eq!(tsv.lines().next().unwrap(), "\ta\tb\tc");
        // cumulative row for a: b=2, c=3
        assert!(tsv.contains("\na\t\t2\t3\n"), "{tsv}");
        // cumulative row for b: a=2, c=5
        assert!(tsv.contains("\nb\t2\t\t5\n"), "{tsv}");
    }

    #[test]
    fn tsv_rejects_trigrams() {
        assert!(matches!(
            model(3, "a b c").bigram_tsv(),
            Err(Error::TsvRequiresBigrams)
        ));
    }
}
