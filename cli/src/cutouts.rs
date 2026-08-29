//! The cutouts family: every token of a corpus (kept or discarded) tagged
//! with its n-1 words of context, to be printed as cut-up slips or dealt
//! onto per-participant search sheets.

use std::collections::HashMap;

use rand::Rng;
use serde::Serialize;

use crate::corpus::Corpus;
use crate::error::{Error, Result};
use crate::model::{ContextTable, Model, ModelSummary};
use crate::text::{Normalizer, NormalizerConfig, RawToken, sort_key};

/// Metadata for a cutouts or sheets set.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CutoutsMetadata {
    pub title: String,
    pub author: String,
    /// How many source texts this corpus was built from. One for a single
    /// file; more when several were combined, which the sheets brief says out
    /// loud because generation crossing between texts is the point of doing it.
    pub documents: usize,
    pub total_tokens: usize,
    pub kept_tokens: usize,
    #[serde(flatten)]
    pub summary: ModelSummary,
}

/// A corpus tokenised for the cutouts activities: the wire shape of
/// `cutouts.json`, and the input to the sheets deal.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CutoutSet {
    pub metadata: CutoutsMetadata,
    pub tokens: Vec<RawToken>,
}

impl CutoutSet {
    /// Tokenise a loaded corpus, with statistics for the model its usable
    /// cutouts make up.
    pub fn from_corpus(corpus: &Corpus, config: NormalizerConfig, n: usize) -> Self {
        Self::from_text(
            corpus.frontmatter.title.clone(),
            corpus.frontmatter.author.clone(),
            &corpus.lines,
            config,
            n,
        )
    }

    /// Tokenise content lines under a caller-supplied title and author.
    pub fn from_text<S: AsRef<str>>(
        title: String,
        author: String,
        lines: &[S],
        config: NormalizerConfig,
        n: usize,
    ) -> Self {
        let normalizer = Normalizer::for_corpus(config, lines);
        let tokens = tokenize_cutouts(&normalizer, n, lines);
        Self::build(title, author, 1, tokens, n)
    }

    /// Concatenate independently tokenised sets without creating an n-gram
    /// at any seam: each token already carries its within-document context.
    /// Titles and authors are joined with " + ".
    pub fn combine(sets: Vec<CutoutSet>, n: usize) -> Self {
        if sets.len() == 1 {
            return sets.into_iter().next().expect("one set");
        }
        let join = |field: fn(&CutoutsMetadata) -> &str| {
            sets.iter()
                .map(|set| field(&set.metadata))
                .collect::<Vec<_>>()
                .join(" + ")
        };
        let title = join(|m| &m.title);
        let author = join(|m| &m.author);
        let documents = sets.len();
        let tokens: Vec<RawToken> = sets.into_iter().flat_map(|set| set.tokens).collect();
        Self::build(title, author, documents, tokens, n)
    }

    fn build(
        title: String,
        author: String,
        documents: usize,
        mut tokens: Vec<RawToken>,
        n: usize,
    ) -> Self {
        for (index, token) in tokens.iter_mut().enumerate() {
            token.index = index + 1;
        }
        let model = cutouts_model(n, &tokens);
        Self {
            metadata: CutoutsMetadata {
                title,
                author,
                documents,
                total_tokens: tokens.len(),
                kept_tokens: tokens.iter().filter(|t| t.keep).count(),
                summary: model.summary(),
            },
            tokens,
        }
    }
}

/// The wire shape of `sheets.json`: the same metadata as a cutouts set, with
/// the usable cutouts dealt into one list per participant.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SheetSet {
    pub metadata: CutoutsMetadata,
    pub sheets: Vec<Vec<RawToken>>,
}

/// The model a token list represents: one count per usable (non-tool)
/// cutout, keyed by its context. Shared by the single- and multi-document
/// paths so their statistics can never drift.
pub fn cutouts_model(n: usize, tokens: &[RawToken]) -> Model {
    let mut contexts = ContextTable::new();
    for token in tokens.iter().filter(|t| is_usable_cutout(t) && !t.is_tool) {
        *contexts
            .entry(token.previous_words.clone())
            .or_default()
            .entry(token.text.clone())
            .or_default() += 1;
    }
    let kept = tokens.iter().filter(|t| t.keep && !t.is_tool).count();
    Model::from_table(n, kept, contexts)
}

/// Tokenise lines for the cutouts variant, backfilling each kept token's
/// previous words (its n-1 preceding kept tokens). Indices run from 1 across
/// the whole list.
pub fn tokenize_cutouts<S: AsRef<str>>(
    normalizer: &Normalizer,
    n: usize,
    lines: &[S],
) -> Vec<RawToken> {
    let mut tokens = Vec::new();
    for line in lines {
        let line_tokens = normalizer.tokenize_line_raw(line.as_ref(), tokens.len() + 1);
        tokens.extend(line_tokens);
    }

    let context_size = n - 1;
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

/// True for a cutout that can actually take part in the matching game: a kept
/// token carrying a full n-1-word context. The leading run of tokens with no
/// context can never be matched against, and discarded tokens aren't meant to
/// be used at all --- the cutouts template renders both dimmed.
pub fn is_usable_cutout(token: &RawToken) -> bool {
    token.keep && !token.previous_words.is_empty()
}

/// Multiply the usable cutouts in a token list by `factor`. Discarded tokens
/// and the leading run that has no context stay at their original count
/// because they're rendered dimmed and aren't meant to be cut out.
/// Duplicates are emitted adjacently so the printed sheet shows repeated
/// cutouts together, easy to grab as a batch when cutting.
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
        if is_usable_cutout(&token) {
            for _ in 0..(factor - 1) {
                expanded.push(token.clone());
            }
        }
        expanded.push(token);
    }
    *tokens = expanded;
}

/// Shuffle a token list in place.
///
/// Cutout pages are emitted in corpus order by default, which means an uncut
/// page is simply the source text with boxes drawn around it --- reading down
/// the next-word column reproduces the original. Cutting destroys that
/// ordering; shuffling destroys it at generation time instead, which is what
/// makes the uncut [`deal_into_sheets`] variant a model rather than a
/// transcript. It's harmless for the cut-up variant too, so `cutouts
/// --shuffle` uses the same function.
pub fn shuffle_cutout_tokens<R: Rng + ?Sized>(tokens: &mut [RawToken], rng: &mut R) {
    use rand::seq::SliceRandom;
    tokens.shuffle(rng);
}

/// Deal the usable cutouts of a corpus into `num_sheets` per-participant
/// search sheets for the no-cutting variant of the activity.
///
/// Every usable cutout lands on exactly one sheet, so the room as a whole
/// holds the corpus statistics exactly: when a context comes up, the number of
/// participants who can answer with a given next word is that word's corpus
/// count. Unusable cutouts are dropped rather than dimmed --- on a search
/// sheet they're only noise.
///
/// Two properties matter for the activity to work, and both come from the
/// dealing order:
///
/// - **One match per person, as far as possible.** Entries are grouped by
///   context and dealt consecutively, so a context occurring `k` times lands on
///   `k` distinct sheets whenever `k <= num_sheets`. This matters because a
///   participant holding several matches for the same context can only answer
///   with one of them, which flattens the distribution the room samples;
///   spreading a context as thinly as it will go makes that as rare as the
///   corpus allows. It cannot be eliminated: when a context occurs more often
///   than there are participants, somebody must hold more than one. Round-robin
///   at least holds every sheet to the floor of `ceil(k / num_sheets)` rather
///   than letting chance pile four or five onto one person. Grouping by context
///   subsumes grouping by the whole (context, next word) pair, so duplicate
///   pairs are spread too.
/// - **Common contexts spread evenly.** Contexts are Zipfian, so dealing
///   contiguous slices of the corpus would hand one participant a passage of
///   rare words and leave them idle all session. Shuffling before the deal
///   mixes frequent and rare contexts across every sheet.
///
/// Within a sheet the entries are shuffled again unless `sort` is set, in
/// which case they're ordered by context (then by next word) --- the "now
/// organise your data" round, which makes each sheet a lookup table and shows
/// the distribution at a glance.
///
/// Returns one `Vec<RawToken>` per sheet. Sheets differ in length by at most
/// one entry. Sheets beyond the number of available cutouts come back empty.
pub fn deal_into_sheets<R: Rng + ?Sized>(
    tokens: &[RawToken],
    num_sheets: usize,
    sort: bool,
    rng: &mut R,
) -> Vec<Vec<RawToken>> {
    if num_sheets == 0 {
        return Vec::new();
    }

    let mut usable: Vec<RawToken> = tokens
        .iter()
        .filter(|t| is_usable_cutout(t))
        .cloned()
        .collect();
    shuffle_cutout_tokens(&mut usable, rng);

    // Group every entry sharing a context together, keeping the shuffled order
    // of first appearance so the groups themselves stay in random order.
    // Dealing this flattened list round-robin is what spreads a context across
    // as many separate sheets as it has occurrences.
    let mut groups: Vec<Vec<RawToken>> = Vec::new();
    let mut group_index: HashMap<Vec<String>, usize> = HashMap::new();
    for token in usable {
        match group_index.get(&token.previous_words) {
            Some(&i) => groups[i].push(token),
            None => {
                group_index.insert(token.previous_words.clone(), groups.len());
                groups.push(vec![token]);
            }
        }
    }

    let mut sheets: Vec<Vec<RawToken>> = vec![Vec::new(); num_sheets];
    for (i, token) in groups.into_iter().flatten().enumerate() {
        sheets[i % num_sheets].push(token);
    }

    for sheet in &mut sheets {
        if sort {
            sheet.sort_by_cached_key(|t| {
                (
                    t.previous_words
                        .iter()
                        .map(|w| sort_key(w))
                        .collect::<Vec<_>>(),
                    sort_key(&t.text),
                )
            });
        } else {
            shuffle_cutout_tokens(sheet, rng);
        }
    }

    sheets
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
) -> Result<usize> {
    if specs.is_empty() {
        return Ok(0);
    }
    let context_size = n - 1;

    let mut context_counts: HashMap<&[String], usize> = HashMap::new();
    for t in tokens
        .iter()
        .filter(|t| is_usable_cutout(t) && !t.is_tool && t.previous_words.len() == context_size)
    {
        *context_counts.entry(&t.previous_words).or_insert(0) += 1;
    }
    let mut ranked: Vec<(&[String], usize)> = context_counts.into_iter().collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(b.0)));

    let mut next_index = tokens.iter().map(|t| t.index).max().unwrap_or(0) + 1;
    let mut appended = Vec::new();

    for (name, count) in specs {
        if name.trim().is_empty() {
            return Err(Error::EmptyToolName);
        }
        if *count == 0 {
            continue;
        }
        if ranked.is_empty() {
            return Err(Error::NoContextsForTool {
                name: name.clone(),
                context_size,
            });
        }
        for (context, _) in ranked.iter().take(*count) {
            appended.push(RawToken {
                index: next_index,
                text: name.clone(),
                keep: true,
                previous_words: context.to_vec(),
                is_tool: true,
            });
            next_index += 1;
        }
    }

    let injected = appended.len();
    tokens.extend(appended);
    Ok(injected)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tokens_for(n: usize, text: &str) -> Vec<RawToken> {
        let lines: Vec<&str> = text.lines().collect();
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &lines);
        tokenize_cutouts(&normalizer, n, &lines)
    }

    /// Build a usable cutout (kept, with a one-word context).
    fn cutout(index: usize, previous: &str, text: &str) -> RawToken {
        RawToken {
            index,
            text: text.to_string(),
            keep: true,
            previous_words: vec![previous.to_string()],
            is_tool: false,
        }
    }

    fn rng(seed: u64) -> rand_chacha::ChaCha8Rng {
        use rand::SeedableRng;
        rand_chacha::ChaCha8Rng::seed_from_u64(seed)
    }

    fn contexts(tokens: &[RawToken]) -> Vec<Vec<&str>> {
        tokens
            .iter()
            .map(|t| t.previous_words.iter().map(String::as_str).collect())
            .collect()
    }

    #[test]
    fn bigram_previous_words() {
        let tokens = tokens_for(2, "one two three four");
        assert_eq!(
            contexts(&tokens),
            vec![vec![], vec!["one"], vec!["two"], vec!["three"]]
        );
    }

    #[test]
    fn trigram_and_fourgram_previous_words() {
        let tokens = tokens_for(3, "one two three four five");
        assert_eq!(
            contexts(&tokens),
            vec![
                vec![],
                vec![],
                vec!["one", "two"],
                vec!["two", "three"],
                vec!["three", "four"]
            ]
        );

        let tokens = tokens_for(4, "a b c d e f");
        assert_eq!(
            contexts(&tokens)[3..],
            [
                vec!["a", "b", "c"],
                vec!["b", "c", "d"],
                vec!["c", "d", "e"]
            ]
        );
    }

    #[test]
    fn previous_words_skip_discarded_tokens() {
        // IV is a roman numeral: shown, but not context for what follows.
        let tokens = tokens_for(2, "chapter IV begins here");
        let summary: Vec<(&str, bool, Vec<&str>)> = tokens
            .iter()
            .map(|t| {
                (
                    t.text.as_str(),
                    t.keep,
                    t.previous_words.iter().map(String::as_str).collect(),
                )
            })
            .collect();
        assert_eq!(
            summary,
            vec![
                ("chapter", true, vec![]),
                ("IV", false, vec![]),
                ("begins", true, vec!["chapter"]),
                ("here", true, vec!["begins"]),
            ]
        );
    }

    #[test]
    fn previous_words_include_punctuation() {
        let tokens = tokens_for(2, "hello, world. yes");
        let texts: Vec<&str> = tokens.iter().map(|t| t.text.as_str()).collect();
        assert_eq!(texts, vec!["hello", ",", "world", ".", "yes"]);
        assert_eq!(
            contexts(&tokens),
            vec![vec![], vec!["hello"], vec![","], vec!["world"], vec!["."]]
        );
    }

    #[test]
    fn indices_run_across_lines() {
        let tokens = tokens_for(2, "one two\nthree");
        assert_eq!(
            tokens.iter().map(|t| t.index).collect::<Vec<_>>(),
            vec![1, 2, 3]
        );
    }

    #[test]
    fn cutout_set_statistics_match_the_model_of_its_kept_tokens() {
        let corpus = Corpus::parse(
            "---\ntitle: T\nauthor: A\n---\nI do not like green eggs and ham I do not like them",
        )
        .unwrap();
        let set = CutoutSet::from_corpus(&corpus, NormalizerConfig::default(), 2);
        assert_eq!(set.metadata.title, "T");
        assert_eq!(set.metadata.documents, 1);
        assert_eq!(set.metadata.total_tokens, 13);
        assert_eq!(set.metadata.kept_tokens, 13);

        let lines = ["I do not like green eggs and ham I do not like them"];
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &lines);
        let expected = Model::from_lines(2, &normalizer, &lines).summary();
        assert_eq!(set.metadata.summary, expected);
        assert!(set.metadata.summary.entropy > 0.0);
    }

    #[test]
    fn combine_keeps_document_boundaries_and_joins_labels() {
        let one = CutoutSet::from_text(
            "A".into(),
            "X".into(),
            &["alpha beta"],
            NormalizerConfig::default(),
            2,
        );
        let two = CutoutSet::from_text(
            "B".into(),
            "Y".into(),
            &["gamma delta"],
            NormalizerConfig::default(),
            2,
        );
        let combined = CutoutSet::combine(vec![one, two], 2);

        assert_eq!(combined.metadata.title, "A + B");
        assert_eq!(combined.metadata.author, "X + Y");
        assert_eq!(combined.metadata.documents, 2);
        assert_eq!(combined.metadata.total_tokens, 4);
        // "beta" → "gamma" never becomes a bigram.
        assert_eq!(
            contexts(&combined.tokens),
            vec![vec![], vec!["alpha"], vec![], vec!["gamma"]]
        );
        // Indices are renumbered across the combined list.
        assert_eq!(
            combined.tokens.iter().map(|t| t.index).collect::<Vec<_>>(),
            vec![1, 2, 3, 4]
        );
        assert_eq!(combined.metadata.summary.unique_tokens, 4);
    }

    #[test]
    fn serialises_the_wire_shape() {
        let set = CutoutSet::from_text(
            "T".into(),
            "A".into(),
            &["a b"],
            NormalizerConfig::default(),
            2,
        );
        let json = serde_json::to_value(&set).unwrap();
        assert_eq!(json["metadata"]["entropy"], 0.0);
        assert_eq!(
            json["tokens"][0],
            serde_json::json!({"index": 1, "text": "a", "keep": true})
        );
        assert_eq!(
            json["tokens"][1],
            serde_json::json!({"index": 2, "text": "b", "keep": true, "previous_words": ["a"]})
        );
    }

    #[test]
    fn repeat_multiplies_only_usable_tokens() {
        let mut tokens = vec![
            RawToken {
                index: 1,
                text: "alpha".into(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            },
            cutout(2, "alpha", "beta"),
            RawToken {
                index: 3,
                text: "IV".into(),
                keep: false,
                previous_words: vec![],
                is_tool: false,
            },
            cutout(4, "beta", "gamma"),
        ];

        repeat_cutout_tokens(&mut tokens, 3);

        let texts: Vec<&str> = tokens.iter().map(|t| t.text.as_str()).collect();
        // Duplicates land adjacent so a printed sheet shows a batch per word.
        assert_eq!(
            texts,
            vec![
                "alpha", "beta", "beta", "beta", "IV", "gamma", "gamma", "gamma"
            ]
        );
    }

    #[test]
    fn repeat_factor_one_is_noop() {
        let original = vec![cutout(1, "start", "alpha"), cutout(2, "alpha", "beta")];
        for factor in [0, 1] {
            let mut tokens = original.clone();
            repeat_cutout_tokens(&mut tokens, factor);
            assert_eq!(tokens, original);
        }
    }

    #[test]
    fn append_tool_tokens_seeds_top_contexts() {
        // "a b a b a c": context [a] occurs 3 times, [b] twice.
        let mut tokens = tokens_for(2, "a b a b a c");
        let injected = append_tool_tokens(&mut tokens, &[("VOTE".to_string(), 2)], 2).unwrap();
        assert_eq!(injected, 2);

        let tools: Vec<&RawToken> = tokens.iter().filter(|t| t.is_tool).collect();
        assert_eq!(tools.len(), 2);
        assert!(tools.iter().all(|t| t.text == "VOTE" && t.keep));
        assert_eq!(
            contexts(
                &tokens
                    .iter()
                    .filter(|t| t.is_tool)
                    .cloned()
                    .collect::<Vec<_>>()
            ),
            vec![vec!["a"], vec!["b"]]
        );
        // Indices continue past the corpus.
        assert_eq!(tools[0].index, 7);
    }

    #[test]
    fn append_tool_tokens_errors_when_corpus_has_no_contexts() {
        let mut tokens = tokens_for(2, "only");
        let err = append_tool_tokens(&mut tokens, &[("VOTE".to_string(), 1)], 2).unwrap_err();
        assert!(matches!(err, Error::NoContextsForTool { .. }), "got: {err}");
    }

    #[test]
    fn deal_into_sheets_partitions_every_usable_cutout() {
        let tokens: Vec<RawToken> = (0..50)
            .map(|i| cutout(i + 1, &format!("w{}", i % 7), &format!("x{}", i % 11)))
            .collect();

        let sheets = deal_into_sheets(&tokens, 6, false, &mut rng(1));

        assert_eq!(sheets.len(), 6);
        // A partition, not a sample: every cutout appears exactly once across
        // the room, so the sheets together carry the corpus statistics.
        let mut dealt: Vec<usize> = sheets.iter().flatten().map(|t| t.index).collect();
        dealt.sort_unstable();
        assert_eq!(dealt, (1..=50).collect::<Vec<_>>());

        // Sheets are balanced to within one entry.
        let min = sheets.iter().map(Vec::len).min().unwrap();
        let max = sheets.iter().map(Vec::len).max().unwrap();
        assert!(max - min <= 1, "sheets unbalanced: {min}..{max}");
    }

    #[test]
    fn deal_into_sheets_drops_unusable_cutouts() {
        let tokens = vec![
            // No context: unreachable by the matching game.
            RawToken {
                index: 1,
                text: "alpha".into(),
                keep: true,
                previous_words: vec![],
                is_tool: false,
            },
            // Discarded by the tokeniser.
            RawToken {
                index: 2,
                text: "IV".into(),
                keep: false,
                previous_words: vec!["alpha".into()],
                is_tool: false,
            },
            cutout(3, "alpha", "beta"),
        ];

        let sheets = deal_into_sheets(&tokens, 2, false, &mut rng(7));
        let dealt: Vec<&str> = sheets.iter().flatten().map(|t| t.text.as_str()).collect();
        assert_eq!(dealt, vec!["beta"]);
    }

    #[test]
    fn deal_into_sheets_spreads_duplicates_across_participants() {
        // "the cat" five times over, plus filler. All five copies must land
        // on different sheets: two on one participant would under-represent
        // the corpus's most common continuation.
        let mut tokens: Vec<RawToken> = (0..5).map(|i| cutout(i + 1, "the", "cat")).collect();
        tokens.extend((0..25).map(|i| cutout(i + 6, &format!("w{i}"), &format!("x{i}"))));

        for seed in 0..25u64 {
            let sheets = deal_into_sheets(&tokens, 8, false, &mut rng(seed));
            let holders = sheets
                .iter()
                .filter(|s| {
                    s.iter()
                        .any(|t| t.previous_words[0] == "the" && t.text == "cat")
                })
                .count();
            assert_eq!(holders, 5, "seed {seed}: duplicates piled onto one sheet");
        }
    }

    /// A participant holding several entries for one context can only answer
    /// with one of them, which flattens the distribution. Entries sharing a
    /// context must therefore spread as thinly as the corpus allows: with
    /// `k <= num_sheets` occurrences, onto `k` distinct sheets.
    #[test]
    fn deal_into_sheets_spreads_a_shared_context_across_participants() {
        let mut tokens: Vec<RawToken> = ["cat", "hat", "mat", "rat", "bat", "sat"]
            .iter()
            .enumerate()
            .map(|(i, w)| cutout(i + 1, "the", w))
            .collect();
        tokens.extend((0..30).map(|i| cutout(i + 7, &format!("w{i}"), &format!("x{i}"))));

        for seed in 0..25u64 {
            let sheets = deal_into_sheets(&tokens, 8, false, &mut rng(seed));
            let holders = sheets
                .iter()
                .filter(|s| s.iter().any(|t| t.previous_words[0] == "the"))
                .count();
            assert_eq!(holders, 6, "seed {seed}: a context piled onto one sheet");
        }
    }

    /// When a context occurs more often than there are participants, somebody
    /// must hold more than one --- but round-robin holds everybody to the
    /// minimum possible, `ceil(k / num_sheets)`.
    #[test]
    fn deal_into_sheets_caps_unavoidable_context_collisions_at_the_minimum() {
        // "the" occurs 20 times across 6 sheets: ceil(20 / 6) = 4.
        let mut tokens: Vec<RawToken> = (0..20)
            .map(|i| cutout(i + 1, "the", &format!("w{i}")))
            .collect();
        tokens.extend((0..40).map(|i| cutout(i + 21, &format!("c{i}"), &format!("x{i}"))));

        for seed in 0..25u64 {
            let sheets = deal_into_sheets(&tokens, 6, false, &mut rng(seed));
            let worst = sheets
                .iter()
                .map(|s| s.iter().filter(|t| t.previous_words[0] == "the").count())
                .max()
                .unwrap();
            assert_eq!(worst, 4, "seed {seed}: uneven spread of a hot context");
        }
    }

    #[test]
    fn deal_into_sheets_is_deterministic_for_a_seed() {
        let tokens: Vec<RawToken> = (0..40)
            .map(|i| cutout(i + 1, &format!("w{}", i % 5), &format!("x{}", i % 9)))
            .collect();

        let a = deal_into_sheets(&tokens, 5, false, &mut rng(99));
        let b = deal_into_sheets(&tokens, 5, false, &mut rng(99));
        let c = deal_into_sheets(&tokens, 5, false, &mut rng(100));

        assert_eq!(a, b);
        assert_ne!(a, c, "different seeds should deal differently");
    }

    #[test]
    fn deal_into_sheets_shuffles_within_a_sheet_unless_sorted() {
        // Corpus order is "a b", "b c", "c d", ...: if a sheet kept it, reading
        // down the next-word column would reproduce the source text.
        let words: Vec<String> = (0..60).map(|i| format!("w{i:02}")).collect();
        let tokens: Vec<RawToken> = words
            .windows(2)
            .enumerate()
            .map(|(i, w)| cutout(i + 1, &w[0], &w[1]))
            .collect();

        let shuffled = deal_into_sheets(&tokens, 3, false, &mut rng(3));
        assert!(
            shuffled
                .iter()
                .any(|sheet| sheet.windows(2).any(|w| w[0].index > w[1].index)),
            "shuffled sheets should not preserve corpus order"
        );

        let sorted = deal_into_sheets(&tokens, 3, true, &mut rng(3));
        for sheet in &sorted {
            let keys: Vec<&str> = sheet.iter().map(|t| t.previous_words[0].as_str()).collect();
            let mut expected = keys.clone();
            expected.sort_unstable();
            assert_eq!(keys, expected, "--sort should order a sheet by context");
        }
    }

    #[test]
    fn deal_into_sheets_handles_more_sheets_than_cutouts() {
        let tokens = vec![cutout(1, "the", "cat"), cutout(2, "the", "hat")];
        let sheets = deal_into_sheets(&tokens, 5, false, &mut rng(2));

        assert_eq!(sheets.len(), 5);
        assert_eq!(sheets.iter().filter(|s| s.is_empty()).count(), 3);
        assert_eq!(sheets.iter().flatten().count(), 2);

        assert!(deal_into_sheets(&tokens, 0, false, &mut rng(2)).is_empty());
    }
}
