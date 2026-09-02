use clap::{Args, Parser, Subcommand, ValueEnum};
use llms_unplugged::{
    Book, BookletJson, CjkMode, Corpus, CutoutSet, LedgerSet, LedgerSheet, Metadata, Model,
    Normalizer, NormalizerConfig, ProcessingStats, SampleError, SheetSet, append_tool_tokens,
    deal_into_ledgers, deal_into_sheets, ledger_entries, repeat_cutout_tokens,
    shuffle_cutout_tokens, split_entries_into_books, write_json,
};
use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

mod typst;

/// A simple language model builder that processes text files and outputs word following statistics
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Generate JSON model files.
    Build(BuildArgs),
    /// Generate PDFs (and JSON if needed).
    Pdf(PdfArgs),
    /// Export a bigram TSV matrix for spreadsheets.
    Tsv(TsvArgs),
    /// Generate printable token cutouts for the cutouts lesson variant.
    Cutouts(CutoutsArgs),
    /// Generate per-participant search sheets (the cutouts activity, minus the
    /// cutting).
    Sheets(SheetsArgs),
    /// Generate ledger sheets: one row per prefix with tally strips, for
    /// training by hand and generating with counters drawn from a bag.
    Ledger(LedgerArgs),
    /// Sample text from an N-gram model built in-memory from a corpus.
    Sample(SampleArgs),
}

/// The labels a set carries. Shared by the three activity subcommands so a
/// source reveal can be held back the same way whichever one is printing.
#[derive(Args, Debug, Clone)]
struct LabelArgs {
    /// Override the corpus title printed on the brief and the sheets. Useful
    /// when source names are meant to remain a reveal.
    #[arg(long, value_name = "TITLE")]
    title: Option<String>,

    /// Override the corpus author printed on the brief and the sheets.
    #[arg(long, value_name = "AUTHOR")]
    author: Option<String>,
}

/// The tokeniser settings every subcommand shares.
#[derive(Args, Debug, Clone)]
struct TokenizerArgs {
    /// Punctuation characters to preserve as separate tokens
    #[arg(long, default_value = llms_unplugged::DEFAULT_PUNCTUATION)]
    punctuation: String,

    /// How to segment Chinese: `word` (jieba words) or `char` (per character)
    #[arg(long, value_enum, default_value_t = CjkMode::Words)]
    cjk: CjkMode,

    /// Read only the first N tokens of the text (of each text, when several
    /// are given). The activities scale with the text, so this sizes them
    /// without editing the corpus file.
    #[arg(long, value_name = "N", value_parser = clap::value_parser!(u64).range(1..))]
    max_tokens: Option<u64>,
}

impl TokenizerArgs {
    fn config(&self) -> NormalizerConfig {
        NormalizerConfig::new(self.punctuation.chars(), self.cjk)
            .with_max_tokens(self.max_tokens.map(|n| n as usize))
    }
}

#[derive(Args, Debug, Clone)]
struct BuildArgs {
    /// Input text file to process
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// Output JSON file for results (defaults to "model.json")
    #[arg(short, long, default_value = "model.json")]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Number of books to split the output into (default 1 = no splitting)
    #[arg(short = 'b', long = "books", default_value_t = 1)]
    num_books: usize,

    /// Output raw counts without scaling
    #[arg(long = "raw")]
    raw: bool,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

#[derive(Args, Debug, Clone)]
struct PdfArgs {
    /// Input text file to process
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// Name-N-books triple (e.g. frankenstein-3-2) to match Makefile targets
    #[arg(long)]
    target: Option<String>,

    /// Override base name for outputs (defaults to input stem)
    #[arg(long)]
    base_name: Option<String>,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams)
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Number of books to split the output into (default 1 = no splitting)
    #[arg(short = 'b', long = "books", default_value_t = 1)]
    num_books: usize,

    /// Output directory for generated assets (expects json/ and pdf/ inside)
    #[arg(long, default_value = "out")]
    out_dir: PathBuf,

    /// Path to a Typst template to use instead of the bundled book.typ
    #[arg(long)]
    template: Option<PathBuf>,

    /// Paper size passed to Typst (e.g. a4, a5)
    #[arg(long, default_value = "a4")]
    paper_size: String,

    /// Number of columns passed to Typst
    #[arg(long, default_value_t = 4)]
    columns: usize,

    /// Force a subtitle instead of using metadata subtitle from JSON
    #[arg(long)]
    subtitle: Option<String>,

    /// Only run Typst; expect JSON to already exist
    #[arg(long)]
    pdf_only: bool,

    /// Only generate JSON; skip Typst
    #[arg(long)]
    json_only: bool,

    /// Output raw counts without scaling
    #[arg(long = "raw")]
    raw: bool,

    /// Add blank pages for book binding (recto/verso layout)
    #[arg(long)]
    book_binding: bool,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

#[derive(Args, Debug, Clone)]
struct TsvArgs {
    /// Input text file to process
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// Optional output path (defaults to stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

#[derive(Args, Debug, Clone)]
struct CutoutsArgs {
    /// Input text file to process. Repeat for a multi-document corpus; document
    /// boundaries are preserved, so no artificial cross-document N-grams are
    /// introduced.
    #[arg(short = 'i', long = "input", value_name = "INPUT", required = true)]
    input: Vec<PathBuf>,

    #[command(flatten)]
    labels: LabelArgs,

    /// Output directory for generated files (default: current directory)
    #[arg(short, long, default_value = ".")]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Paper size for PDF (default: a4)
    #[arg(long, default_value = "a4")]
    paper_size: String,

    /// Only generate JSON; skip Typst PDF compilation
    #[arg(long)]
    json_only: bool,

    /// Generate a duplex (double-sided) PDF: each cutout page is paired with a
    /// mirrored back so the same cutouts appear on both faces of each sheet.
    /// Print with "flip on short edge" binding. Currently assumes a4 landscape.
    #[arg(long)]
    duplex: bool,

    /// Inject a tool-trigger cutout (e.g. --tool VOTE or --tool ACTION:5).
    /// Format: NAME[:COUNT]. Default COUNT is 3, placed at the top COUNT most
    /// common (n-1)-token previous-word contexts in the corpus. Repeat the
    /// flag to add multiple tools. Triggers render in black/gold so they stay
    /// visually distinct even when the corpus contains the same word.
    #[arg(long = "tool", value_name = "TOOL", action = clap::ArgAction::Append)]
    tools: Vec<String>,

    /// Emit every usable cutout this many times. Useful for short curated
    /// corpora (e.g. sycophancy.txt) that would otherwise be swamped by a
    /// much larger pool of base-corpus cutouts on the workshop table.
    /// Discarded tokens and tool-trigger cutouts are not multiplied — tool
    /// counts have their own knob via --tool NAME:COUNT.
    #[arg(long, default_value_t = 1)]
    repeat: usize,

    /// Shuffle the cutouts instead of emitting them in corpus order. Harmless
    /// for the cut-up activity (cutting destroys the order anyway) and useful
    /// if the uncut sheets will be read before they're cut.
    #[arg(long)]
    shuffle: bool,

    /// RNG seed for --shuffle, for a reproducible print run.
    #[arg(long)]
    seed: Option<u64>,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

#[derive(Args, Debug, Clone)]
struct SheetsArgs {
    /// Input text file to process. Repeat for a multi-document corpus; document
    /// boundaries are preserved, so no artificial cross-document N-grams are
    /// introduced.
    #[arg(short = 'i', long = "input", value_name = "INPUT", required = true)]
    input: Vec<PathBuf>,

    #[command(flatten)]
    labels: LabelArgs,

    /// Output directory for generated files (default: current directory)
    #[arg(short, long, default_value = ".")]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Number of participants: the corpus is dealt into this many sheets, one
    /// page each. Omit it and the count is derived from `--rows` instead ---
    /// the sheets keep a fixed density and a longer corpus simply needs more
    /// of them.
    #[arg(short = 's', long = "sheets", value_name = "N")]
    sheets: Option<usize>,

    /// Order each sheet by context instead of shuffling it, turning the sheet
    /// into a lookup table. Useful as a second round, after the class has felt
    /// how slow an unsorted search is.
    #[arg(long)]
    sort: bool,

    /// RNG seed, for a reproducible deal.
    #[arg(long)]
    seed: Option<u64>,

    /// Number of token-pair columns on each sheet. Defaults to 4 for bigrams,
    /// narrowing as n grows because each pair carries n-1 context tokens.
    #[arg(long)]
    columns: Option<usize>,

    /// Rows of token pairs on a sheet (default 18). Rows stretch to fill the
    /// page, so this is the density knob: ask for fewer and they sit further
    /// apart. Unless `--sheets` pins the count, it also decides how many
    /// sheets there are --- as many as the corpus needs at this density.
    #[arg(long, default_value_t = 18)]
    rows: usize,

    /// Token-pair font size on the sheets (any Typst length, e.g. 11pt)
    #[arg(long, default_value = "16pt")]
    font_size: String,

    /// Paper size for PDF (default: a4)
    #[arg(long, default_value = "a4")]
    paper_size: String,

    /// Only generate JSON; skip Typst PDF compilation
    #[arg(long)]
    json_only: bool,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

/// What a ledger sheet comes printed with, each level adding to the one
/// before it. `prefixes` keeps the "which words follow *the*?" discovery and
/// drops the bookkeeping of where a new row goes; `followers` reduces
/// training to pure tallying, the right level for the youngest groups;
/// `tallies` is the trained model itself, for a session that skips training
/// and generates, and for the facilitator's answer key. (A wholly blank sheet
/// is `--blank`: rows sized for a corpus but unlabelled would be no use,
/// since nobody could tell which block was whose.)
#[derive(ValueEnum, Debug, Clone, Copy, PartialEq, Eq)]
enum Prefill {
    /// The prefix column filled in; followers and tallies left to write.
    Prefixes,
    /// Prefixes and followers filled in; only the tallies left to make.
    Followers,
    /// The whole sheet filled in: the tally marks the text produced, drawn in
    /// the strips. Nothing left to train.
    Tallies,
}

impl Prefill {
    fn as_str(self) -> &'static str {
        match self {
            Prefill::Prefixes => "prefixes",
            Prefill::Followers => "followers",
            Prefill::Tallies => "tallies",
        }
    }
}

#[derive(Args, Debug, Clone)]
struct LedgerArgs {
    /// Input text file to process. Repeat for a multi-document corpus; document
    /// boundaries are preserved, so no artificial cross-document N-grams are
    /// introduced. Omit it with --blank for sheets that carry no corpus at all.
    #[arg(
        short = 'i',
        long = "input",
        value_name = "INPUT",
        required_unless_present = "blank",
        conflicts_with = "blank"
    )]
    input: Vec<PathBuf>,

    /// Blank sheets: every row empty, for a group to train on a text of their
    /// own by hand. Without --sheets this prints one.
    #[arg(long)]
    blank: bool,

    #[command(flatten)]
    labels: LabelArgs,

    /// Output directory for generated files (default: current directory)
    #[arg(short, long, default_value = ".")]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Number of sheets, i.e. the group size: the prefixes are dealt across
    /// this many sheets in alphabetical runs. Omit it and the count follows
    /// the corpus at the density `--rows` sets, one page per sheet.
    #[arg(short = 's', long = "sheets", value_name = "N")]
    sheets: Option<usize>,

    /// Follower cells on a row (default 4, the most the palettes allow). A
    /// prefix with more followers than this continues onto the rows below,
    /// whose tally strips take the next of three palettes, so three rows give
    /// twelve distinct colours. A fourth row repeats the first row's colours:
    /// the command warns about any prefix that needs one.
    #[arg(long, default_value_t = 4)]
    columns: usize,

    /// Rows on a page (default 12). Rows share the page height, so this is
    /// how much room a hand gets to write in; it also decides the sheet count
    /// unless `--sheets` pins it.
    #[arg(long, default_value_t = 12)]
    rows: usize,

    /// What the sheets come printed with. There is nothing to prefill without
    /// a corpus, so this and --blank are mutually exclusive.
    #[arg(long, value_enum, default_value_t = Prefill::Prefixes, conflicts_with = "blank")]
    prefill: Prefill,

    /// Paper size for PDF (default: a4); the sheets are always landscape
    #[arg(long, default_value = "a4")]
    paper_size: String,

    /// Only generate JSON; skip Typst PDF compilation
    #[arg(long)]
    json_only: bool,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

#[derive(Args, Debug, Clone)]
struct SampleArgs {
    /// Input text file (with YAML frontmatter) to build the model from
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// N-gram size (2 for bigrams, 3 for trigrams). Prompt must contain at
    /// least N-1 normalised tokens.
    #[arg(short, long, default_value_t = 2, value_parser = parse_ngram_size)]
    n: usize,

    /// Prompt to start sampling from. Normalised the same way as the corpus.
    #[arg(short = 'p', long = "prompt")]
    prompt: String,

    /// Number of tokens to sample after the prompt
    #[arg(short = 't', long = "tokens", default_value_t = 50)]
    tokens: usize,

    /// Optional RNG seed for reproducible output
    #[arg(long)]
    seed: Option<u64>,

    #[command(flatten)]
    tokenizer: TokenizerArgs,
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    let result = match &cli.command {
        Commands::Build(args) => run_build_command(args),
        Commands::Pdf(args) => run_pdf_command(args),
        Commands::Tsv(args) => run_tsv_command(args),
        Commands::Cutouts(args) => run_cutouts_command(args),
        Commands::Sheets(args) => run_sheets_command(args),
        Commands::Ledger(args) => run_ledger_command(args),
        Commands::Sample(args) => run_sample_command(args),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(CliError::Model(err)) if err.is_frontmatter() => {
            eprintln!("Error: {err}");
            eprintln!("\nYour input file must begin with valid YAML frontmatter.");
            eprintln!("Frontmatter format:");
            eprintln!("---");
            eprintln!("title: Your Document Title");
            eprintln!("author: Author Name");
            eprintln!("url: https://example.com/document-url");
            eprintln!("---");
            eprintln!("\nThe frontmatter must appear at the beginning of the file.");
            ExitCode::FAILURE
        }
        Err(CliError::Model(err)) => {
            eprintln!("Error processing input file: {err}");
            ExitCode::FAILURE
        }
        Err(err @ (CliError::Typst(_) | CliError::InvalidArgs(_))) => {
            eprintln!("{err}");
            ExitCode::FAILURE
        }
    }
}

#[derive(Debug, thiserror::Error)]
enum CliError {
    #[error(transparent)]
    Model(#[from] llms_unplugged::Error),
    #[error(transparent)]
    Typst(#[from] typst::Error),
    #[error("{0}")]
    InvalidArgs(String),
}

impl From<io::Error> for CliError {
    fn from(err: io::Error) -> Self {
        CliError::Model(err.into())
    }
}

/// A corpus, the normaliser built for it, and the model counted from it.
struct BuiltModel {
    corpus: Corpus,
    normalizer: Normalizer,
    model: Model,
}

fn build_model(input: &Path, n: usize, config: NormalizerConfig) -> Result<BuiltModel, CliError> {
    let corpus = Corpus::load(input)?;
    let normalizer = Normalizer::for_corpus(config, &corpus.lines);
    let model = Model::from_lines(n, &normalizer, &corpus.lines);
    report_budget(
        &corpus.frontmatter.title,
        model.total_tokens(),
        normalizer.config().max_tokens(),
    );
    Ok(BuiltModel {
        corpus,
        normalizer,
        model,
    })
}

impl BuiltModel {
    fn metadata(&self) -> Metadata {
        Metadata::new(
            &self.corpus.frontmatter,
            self.model.n(),
            self.normalizer.config().punctuation(),
            Some(self.model.stats()),
        )
    }
}

/// One volume's JSON on disk, and what the PDF step needs to know about it.
#[derive(Debug, Clone)]
struct BookArtifact {
    range: String,
    json_path: PathBuf,
    subtitle: Option<String>,
}

#[derive(Debug, Clone)]
struct TypstOptions {
    template: PathBuf,
    paper_size: String,
    columns: usize,
    subtitle_override: Option<String>,
    book_binding: bool,
}

fn run_build_command(args: &BuildArgs) -> Result<(), CliError> {
    let built = build_model(&args.input, args.n, args.tokenizer.config())?;
    write_books(&built, &args.output, args.num_books, args.raw)?;
    print_summary(&built.metadata(), args.raw);
    Ok(())
}

fn run_cutouts_command(args: &CutoutsArgs) -> Result<(), CliError> {
    if args.repeat == 0 {
        return Err(CliError::InvalidArgs(
            "--repeat must be at least 1".to_string(),
        ));
    }

    let mut set = load_cutout_set(
        &args.input,
        &args.tokenizer.config(),
        args.n,
        args.labels.title.as_deref(),
        args.labels.author.as_deref(),
    )?;

    repeat_cutout_tokens(&mut set.tokens, args.repeat);

    let tool_specs = args
        .tools
        .iter()
        .map(|s| parse_tool_spec(s))
        .collect::<Result<Vec<_>, _>>()
        .map_err(CliError::InvalidArgs)?;
    let injected = append_tool_tokens(&mut set.tokens, &tool_specs, args.n)?;

    if args.shuffle {
        shuffle_cutout_tokens(&mut set.tokens, &mut seeded_rng(args.seed));
    }

    fs::create_dir_all(&args.output)?;
    let json_path = args.output.join("cutouts.json");
    write_json(&set, &json_path)?;

    let metadata = &set.metadata;
    eprintln!("Processed '{}' by {}", metadata.title, metadata.author);
    eprintln!(
        "Total tokens: {} ({} kept, {} discarded)",
        metadata.total_tokens,
        metadata.kept_tokens,
        metadata.total_tokens - metadata.kept_tokens
    );
    if args.repeat > 1 {
        eprintln!("Repeating every usable cutout {} times", args.repeat);
    }
    if injected > 0 {
        let names: Vec<&str> = tool_specs.iter().map(|(n, _)| n.as_str()).collect();
        eprintln!(
            "Injected {injected} tool-trigger cutout(s) for: {}",
            names.join(", ")
        );
    }
    eprintln!("Wrote JSON to {}", json_path.display());

    if args.json_only {
        return Ok(());
    }

    let mut inputs = vec![
        ("paper_size".to_string(), args.paper_size.clone()),
        ("json_path".to_string(), typst::abs_path_string(&json_path)),
    ];
    if args.duplex {
        inputs.push(("duplex".to_string(), "true".to_string()));
    }

    typst::compile_template(
        "tokenized-cutouts.typ",
        &inputs,
        &args.output.join("cutouts.pdf"),
    )?;
    Ok(())
}

// The first guess at how many sheets this corpus needs at the requested
// density. A pair too wide for its column takes two of them, so a sheet
// needs a few per cent more slots than it holds pairs --- how many more
// depends on how long the corpus's words are, which only the typesetter
// knows. The margin covers the usual case and the loop below corrects the
// rest against Typst's own layout.
const WIDE_PAIR_MARGIN: f64 = 1.08;

// Deal, typeset, and check that every sheet came out one page. The wide
// pairs that make a sheet overflow are only knowable from the typesetting,
// so when the count is ours to choose we take Typst's page count as the
// answer and deal again with one more sheet. Each attempt reseeds, so the
// deal that ships depends only on the seed and the sheet count it settled
// on, not on how many attempts it took to get there.
//
// A pinned `--sheets` is the participant count and not ours to change, so
// that path warns instead of retrying.
const MAX_ATTEMPTS: usize = 5;

fn run_sheets_command(args: &SheetsArgs) -> Result<(), CliError> {
    if args.sheets == Some(0) {
        return Err(CliError::InvalidArgs(
            "--sheets must be at least 1".to_string(),
        ));
    }
    // A token pair is n tokens wide, so wider n-grams need fewer columns to stay on
    // one line: 4 for bigrams, 3 for trigrams, 2 beyond that.
    let columns = args.columns.unwrap_or_else(|| (6 - args.n.min(4)).max(2));
    if columns == 0 {
        return Err(CliError::InvalidArgs(
            "--columns must be at least 1".to_string(),
        ));
    }
    if args.rows == 0 {
        return Err(CliError::InvalidArgs(
            "--rows must be at least 1".to_string(),
        ));
    }

    let CutoutSet { metadata, tokens } = load_cutout_set(
        &args.input,
        &args.tokenizer.config(),
        args.n,
        args.labels.title.as_deref(),
        args.labels.author.as_deref(),
    )?;

    let usable = tokens.iter().filter(|t| t.is_usable()).count();
    let capacity = (args.rows * columns) as f64 / WIDE_PAIR_MARGIN;
    let derived = ((usable as f64 / capacity).ceil() as usize).max(1);
    let mut num_sheets = args.sheets.unwrap_or(derived);

    fs::create_dir_all(&args.output)?;

    let json_path = args.output.join("sheets.json");
    let pdf_path = args.output.join("sheets.pdf");
    eprintln!("Processed '{}' by {}", metadata.title, metadata.author);

    let mut sheets;
    let mut attempt = 1;
    loop {
        sheets = deal_into_sheets(&tokens, num_sheets, args.sort, &mut seeded_rng(args.seed));

        write_json(
            &SheetSet {
                metadata: metadata.clone(),
                sheets: sheets.clone(),
            },
            &json_path,
        )?;

        if args.json_only {
            break;
        }

        let inputs = vec![
            ("paper_size".to_string(), args.paper_size.clone()),
            ("json_path".to_string(), typst::abs_path_string(&json_path)),
            ("columns".to_string(), columns.to_string()),
            ("rows".to_string(), args.rows.to_string()),
            ("font_size".to_string(), args.font_size.clone()),
        ];
        typst::compile_template("tokenized-sheets.typ", &inputs, &pdf_path)?;

        // The brief in front is one page, and the template is laid out to keep
        // it there, but a corpus wordy enough to push it to two must not be
        // read as a spilled sheet --- so the allowance stays at `sheets + 2`.
        let Some(pages) = typst::page_count(&pdf_path) else {
            eprintln!(
                "Warning: pdfinfo (poppler) not available --- skipping the check that no sheet \
                 spilled onto a second page."
            );
            break;
        };
        let spilled = pages.saturating_sub(num_sheets + 2);
        if spilled == 0 {
            break;
        }
        if args.sheets.is_some() {
            eprintln!(
                "Warning: {pages} pages for {num_sheets} sheets --- some sheets spill onto a \
                 second page. Try a smaller --font-size, more --columns, more --rows, or drop \
                 --sheets and let the count follow the corpus.",
            );
            break;
        }
        if attempt >= MAX_ATTEMPTS {
            eprintln!(
                "Warning: still {pages} pages for {num_sheets} sheets after {attempt} attempts \
                 --- some sheets spill onto a second page.",
            );
            break;
        }
        num_sheets += spilled;
        attempt += 1;
    }

    let dealt: usize = sheets.iter().map(Vec::len).sum();
    let smallest = sheets.iter().map(Vec::len).min().unwrap_or(0);
    let largest = sheets.iter().map(Vec::len).max().unwrap_or(0);

    eprintln!(
        "Dealt {dealt} cutouts across {num_sheets} sheets ({smallest}--{largest} token pairs \
         per sheet, {}), {} rows a page",
        if args.sort {
            "sorted by context"
        } else {
            "shuffled"
        },
        args.rows,
    );
    if args.sheets.is_none() {
        eprintln!(
            "Sheet count follows the corpus at this density --- pass --sheets to pin it, or \
             --rows to change it."
        );
    }
    if smallest == 0 {
        eprintln!(
            "Warning: {} sheet(s) came out empty --- the corpus has fewer usable cutouts than participants.",
            sheets.iter().filter(|s| s.is_empty()).count()
        );
    }
    eprintln!("Wrote JSON to {}", json_path.display());

    Ok(())
}

/// Tokenise one or more corpus files into a single cutout set, each document
/// on its own so no n-gram spans a seam, with the printed title and author
/// overridable (to keep a source a reveal). Shared by every subcommand that
/// takes a multi-document corpus.
fn load_cutout_set(
    inputs: &[PathBuf],
    config: &NormalizerConfig,
    n: usize,
    title: Option<&str>,
    author: Option<&str>,
) -> Result<CutoutSet, CliError> {
    let documents = inputs
        .iter()
        .map(|input| {
            Ok(CutoutSet::from_corpus(
                &Corpus::load(input)?,
                config.clone(),
                n,
            ))
        })
        .collect::<Result<Vec<_>, CliError>>()?;
    for document in &documents {
        report_budget(
            &document.metadata.title,
            document.metadata.kept_tokens,
            config.max_tokens(),
        );
    }
    let mut set = CutoutSet::combine(documents, n);
    if let Some(title) = title {
        set.metadata.title = title.to_string();
    }
    if let Some(author) = author {
        set.metadata.author = author.to_string();
    }
    Ok(set)
}

/// Say what `--max-tokens` did to a text: cut it, or nothing, because the
/// text was shorter than the budget --- which is worth hearing about, since
/// the flag was presumably set to make a set smaller.
fn report_budget(title: &str, kept_tokens: usize, budget: Option<usize>) {
    let Some(budget) = budget else {
        return;
    };
    if kept_tokens >= budget {
        eprintln!("Reading the first {budget} tokens of '{title}'");
    } else {
        eprintln!(
            "Warning: '{title}' has only {kept_tokens} tokens, fewer than --max-tokens {budget}; \
             read it whole"
        );
    }
}

fn run_ledger_command(args: &LedgerArgs) -> Result<(), CliError> {
    if args.sheets == Some(0) {
        return Err(CliError::InvalidArgs(
            "--sheets must be at least 1".to_string(),
        ));
    }
    if args.columns == 0 {
        return Err(CliError::InvalidArgs(
            "--columns must be at least 1".to_string(),
        ));
    }
    if args.rows == 0 {
        return Err(CliError::InvalidArgs(
            "--rows must be at least 1".to_string(),
        ));
    }

    let set = if args.blank {
        LedgerSet {
            metadata: None,
            title: args.labels.title.clone().unwrap_or_default(),
            columns: args.columns,
            rows_per_page: args.rows,
            sheets: vec![LedgerSheet::blank(); args.sheets.unwrap_or(1)],
        }
    } else {
        let CutoutSet { metadata, tokens } = load_cutout_set(
            &args.input,
            &args.tokenizer.config(),
            args.n,
            args.labels.title.as_deref(),
            args.labels.author.as_deref(),
        )?;
        eprintln!("Processed '{}' by {}", metadata.title, metadata.author);

        let entries = ledger_entries(&tokens);
        let total_rows: usize = entries.iter().map(|e| e.rows(args.columns)).sum();
        let num_sheets = args
            .sheets
            .unwrap_or_else(|| total_rows.div_ceil(args.rows).max(1));
        let sheets = deal_into_ledgers(&entries, num_sheets, args.columns, args.rows)?;

        // The tall prefixes are the corpus's commonest, so the list is
        // Zipfian too: name the worst few and count the rest.
        let mut tall: Vec<&llms_unplugged::LedgerEntry> = entries
            .iter()
            .filter(|e| e.rows(args.columns) > 3)
            .collect();
        tall.sort_by_key(|e| std::cmp::Reverse(e.followers.len()));
        if !tall.is_empty() {
            let named: Vec<String> = tall
                .iter()
                .take(5)
                .map(|e| format!("'{}' ({})", e.prefix.join(" "), e.followers.len()))
                .collect();
            let more = tall.len().saturating_sub(named.len());
            eprintln!(
                "Warning: {} prefix(es) have more than {} followers and spill onto a fourth row, \
                 where the tally colours repeat those of the first: {}{}. A shorter text \
                 (--max-tokens) keeps every prefix to three rows.",
                tall.len(),
                3 * args.columns,
                named.join(", "),
                if more > 0 {
                    format!(" and {more} more")
                } else {
                    String::new()
                }
            );
        }

        let rows: Vec<usize> = sheets.iter().map(|s| s.rows(args.columns)).collect();
        eprintln!(
            "Dealt {} prefixes ({total_rows} rows) across {num_sheets} sheet(s), {}--{} rows \
             each, {} rows a page",
            entries.len(),
            rows.iter().min().unwrap_or(&0),
            rows.iter().max().unwrap_or(&0),
            args.rows
        );
        if args.sheets.is_none() {
            eprintln!(
                "Sheet count follows the corpus at this density --- pass --sheets to pin it, or \
                 --rows to change it."
            );
        }
        let empty = sheets.iter().filter(|s| s.range.is_none()).count();
        if empty > 0 {
            eprintln!(
                "Warning: {empty} sheet(s) came out empty --- the corpus has fewer prefixes than \
                 sheets."
            );
        }

        LedgerSet {
            title: metadata.title.clone(),
            metadata: Some(metadata),
            columns: args.columns,
            rows_per_page: args.rows,
            sheets,
        }
    };

    fs::create_dir_all(&args.output)?;
    let json_path = args.output.join("ledger.json");
    write_json(&set, &json_path)?;
    eprintln!("Wrote JSON to {}", json_path.display());

    if args.json_only {
        return Ok(());
    }

    let inputs = vec![
        ("paper_size".to_string(), args.paper_size.clone()),
        ("json_path".to_string(), typst::abs_path_string(&json_path)),
        ("prefill".to_string(), args.prefill.as_str().to_string()),
    ];
    typst::compile_template("ledger.typ", &inputs, &args.output.join("ledger.pdf"))?;

    // The counters to cut up and draw from the bag: two identical pages laid
    // out symmetrically, so printing the file double-sided --- on either
    // binding --- puts every square's colour on both of its faces.
    typst::compile_template(
        "ledger-counters.typ",
        &inputs[..1],
        &args.output.join("counters.pdf"),
    )?;
    eprintln!("  print counters.pdf double-sided, one copy per sheet of counters wanted");
    Ok(())
}

/// An RNG seeded from `seed`, or from system entropy when no seed is given.
fn seeded_rng(seed: Option<u64>) -> ChaCha8Rng {
    match seed {
        Some(s) => ChaCha8Rng::seed_from_u64(s),
        None => ChaCha8Rng::from_rng(&mut rand::rng()),
    }
}

fn run_sample_command(args: &SampleArgs) -> Result<(), CliError> {
    let built = build_model(&args.input, args.n, args.tokenizer.config())?;
    let prompt_tokens = built.normalizer.normalize_line(&args.prompt);

    if prompt_tokens.is_empty() {
        return Err(CliError::InvalidArgs(
            "Prompt produced no tokens after normalisation.".to_string(),
        ));
    }

    let mut rng = seeded_rng(args.seed);
    match built.model.sample(&prompt_tokens, args.tokens, &mut rng) {
        Ok(generated) => {
            println!("{}", [prompt_tokens, generated].concat().join(" "));
            Ok(())
        }
        Err(e) => {
            if let SampleError::DeadEnd { generated, .. } = &e {
                println!("{}", [prompt_tokens, generated.clone()].concat().join(" "));
            }
            Err(CliError::InvalidArgs(e.to_string()))
        }
    }
}

fn run_tsv_command(args: &TsvArgs) -> Result<(), CliError> {
    // Build the model in memory only: the TSV (on stdout by default) is the
    // sole output, so nothing may be written or printed besides it.
    let built = build_model(&args.input, 2, args.tokenizer.config())?;
    let tsv = built.model.bigram_tsv()?;
    if let Some(path) = &args.output {
        fs::write(path, tsv)?;
        eprintln!("Wrote TSV to {}", path.display());
    } else {
        print!("{tsv}");
    }

    Ok(())
}

fn run_pdf_command(args: &PdfArgs) -> Result<(), CliError> {
    if args.pdf_only && args.json_only {
        return Err(CliError::InvalidArgs(
            "Cannot combine --pdf-only and --json-only.".to_string(),
        ));
    }

    let (base_name, n, books) = if let Some(target) = &args.target {
        parse_target(target)?
    } else {
        (
            args.base_name
                .clone()
                .unwrap_or_else(|| derive_base_name(&args.input)),
            args.n,
            args.num_books,
        )
    };

    let json_dir = args.out_dir.join("json");
    let pdf_dir = args.out_dir.join("pdf");
    let base_json = json_dir.join(format!("{base_name}.json"));

    let written = if args.pdf_only {
        existing_book_artifacts(&base_json, books)?
    } else {
        let built = build_model(&args.input, n, args.tokenizer.config())?;
        let written = write_books(&built, &base_json, books, args.raw)?;
        print_summary(&built.metadata(), args.raw);
        written
    };

    if args.json_only {
        return Ok(());
    }

    let template = match &args.template {
        Some(template) => template.clone(),
        None => typst::template_path("book.typ")?,
    };
    let opts = TypstOptions {
        template,
        paper_size: args.paper_size.clone(),
        columns: args.columns,
        subtitle_override: args.subtitle.clone(),
        book_binding: args.book_binding,
    };

    run_typst_for_books(&written, &pdf_dir, &opts)
}

/// Where volume `index` of `total` books goes: `output` itself for a single
/// book, `<stem>_book_<i>.json` beside it otherwise.
fn book_json_path(output: &Path, index: usize, total: usize) -> PathBuf {
    if total == 1 {
        return output.to_path_buf();
    }
    let stem = output.file_stem().unwrap_or_default().to_string_lossy();
    output
        .parent()
        .unwrap_or(Path::new("."))
        .join(format!("{stem}_book_{}.json", index + 1))
}

/// Split the model into `num_books` volumes and write each one's JSON.
fn write_books(
    built: &BuiltModel,
    output: &Path,
    num_books: usize,
    raw: bool,
) -> Result<Vec<BookArtifact>, CliError> {
    let books = split_entries_into_books(&built.model.entries(), num_books);
    let metadata = built.metadata();

    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut written = Vec::new();
    for (index, Book { range, entries }) in books.iter().enumerate() {
        let json_path = book_json_path(output, index, books.len());
        let book_metadata = if books.len() > 1 {
            metadata.for_book(index, books.len(), range)
        } else {
            metadata.clone()
        };
        let subtitle = book_metadata.subtitle.clone();

        BookletJson::new(book_metadata, entries, raw).write(&json_path)?;

        if books.len() > 1 {
            eprintln!(
                "Successfully wrote book {} ({range}) to '{}'",
                index + 1,
                json_path.display()
            );
        } else {
            eprintln!(
                "Successfully wrote word statistics to '{}'",
                json_path.display()
            );
        }

        written.push(BookArtifact {
            range: range.clone(),
            json_path,
            subtitle: Some(subtitle),
        });
    }

    if raw {
        eprintln!("Output raw counts without scaling");
    } else {
        eprintln!("Applied count scaling with d10");
    }

    Ok(written)
}

fn run_typst_for_books(
    written: &[BookArtifact],
    pdf_dir: &Path,
    opts: &TypstOptions,
) -> Result<(), CliError> {
    eprintln!("\nRunning typst compile...");

    for (index, book) in written.iter().enumerate() {
        let pdf_path = pdf_name_for(&book.json_path, pdf_dir);

        let mut inputs = vec![
            ("paper_size".to_string(), opts.paper_size.clone()),
            ("columns".to_string(), opts.columns.to_string()),
            (
                "json_path".to_string(),
                typst::abs_path_string(&book.json_path),
            ),
        ];
        if let Some(subtitle) = opts
            .subtitle_override
            .clone()
            .or_else(|| book.subtitle.clone())
        {
            inputs.push(("subtitle".to_string(), subtitle));
        }
        if opts.book_binding {
            inputs.push(("book_binding".to_string(), "true".to_string()));
        }

        typst::compile(&opts.template, &inputs, &pdf_path)?;

        if let Some(pages) = typst::page_count(&pdf_path) {
            eprintln!("Pages in {}: {pages}", pdf_path.display());
        }
        let range_label = if book.range.is_empty() {
            String::new()
        } else {
            format!(" ({})", book.range)
        };
        eprintln!(
            "Successfully created PDF {} of {}{range_label} at {}",
            index + 1,
            written.len(),
            pdf_path.display()
        );
    }

    Ok(())
}

fn pdf_name_for(json_path: &Path, pdf_dir: &Path) -> PathBuf {
    let stem = json_path
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .replace("_book_", "-book");
    pdf_dir.join(format!("{stem}.pdf"))
}

/// Validate the `-n` flag: the model needs at least one word of context.
fn parse_ngram_size(s: &str) -> Result<usize, String> {
    let n: usize = s
        .parse()
        .map_err(|_| format!("'{s}' is not a valid number"))?;
    if n < 2 {
        return Err("n must be at least 2 (bigrams)".to_string());
    }
    Ok(n)
}

/// Parse a `--tool` spec like `VOTE` or `VOTE:5` into a `(name, count)` pair.
/// Default count is 3 when no `:N` suffix is given.
fn parse_tool_spec(spec: &str) -> Result<(String, usize), String> {
    let (name, count) = match spec.split_once(':') {
        Some((n, c)) => {
            let parsed = c
                .trim()
                .parse::<usize>()
                .map_err(|_| format!("Invalid count in tool spec '{spec}': expected an integer"))?;
            (n.trim().to_string(), parsed)
        }
        None => (spec.trim().to_string(), 3),
    };
    if name.is_empty() {
        return Err(format!("Empty tool name in '{spec}'"));
    }
    Ok((name, count))
}

fn parse_target(target: &str) -> Result<(String, usize, usize), CliError> {
    let parts: Vec<&str> = target.rsplitn(3, '-').collect();
    if parts.len() != 3 {
        return Err(CliError::InvalidArgs(format!(
            "Invalid target format: {target}"
        )));
    }
    let books = parts[0]
        .parse::<usize>()
        .map_err(|_| CliError::InvalidArgs(format!("Invalid books value in target: {target}")))?;
    let n = parts[1]
        .parse::<usize>()
        .map_err(|_| CliError::InvalidArgs(format!("Invalid n value in target: {target}")))?;
    let name = parts[2].to_string();
    Ok((name, n, books))
}

fn derive_base_name(input: &Path) -> String {
    input
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}

fn existing_book_artifacts(base_json: &Path, books: usize) -> Result<Vec<BookArtifact>, CliError> {
    (0..books)
        .map(|index| {
            let path = book_json_path(base_json, index, books);
            if !path.exists() {
                return Err(CliError::InvalidArgs(format!(
                    "Expected JSON at {} but it does not exist",
                    path.display()
                )));
            }
            Ok(BookArtifact {
                range: String::new(),
                subtitle: load_subtitle_from_json(&path)?,
                json_path: path,
            })
        })
        .collect()
}

fn load_subtitle_from_json(path: &Path) -> Result<Option<String>, CliError> {
    let file = fs::File::open(path)?;
    let json: serde_json::Value =
        serde_json::from_reader(file).map_err(|e| CliError::InvalidArgs(e.to_string()))?;
    let subtitle = json
        .get("metadata")
        .and_then(|m| m.get("subtitle"))
        .and_then(|s| s.as_str())
        .map(std::string::ToString::to_string);
    Ok(subtitle)
}

fn print_summary(metadata: &Metadata, raw: bool) {
    let n = metadata.n;
    eprintln!("\nDocument Metadata:");
    eprintln!("------------------");
    eprintln!("Title: {}", metadata.title);
    eprintln!("Author: {}", metadata.author);
    eprintln!("URL: {}", metadata.url);

    let Some(stats) = &metadata.stats else {
        return;
    };
    print_stats(stats, n);

    if raw {
        eprintln!("\nRaw counts emitted (no dice scaling).");
    } else {
        eprintln!("\nCounts scaled for d10 dice (faces 0 to 10^k - 1).");
    }
}

fn print_stats(stats: &ProcessingStats, n: usize) {
    eprintln!("\nSummary Statistics:");
    eprintln!("-------------------");
    eprintln!("Total tokens in text: {}", stats.total_tokens);
    eprintln!(
        "Unique {}-word previous-words contexts: {}",
        n - 1,
        stats.unique_contexts
    );
    eprintln!(
        "Total {n}-gram occurrences: {}",
        stats.total_ngram_occurrences
    );

    if let Some(ngram) = &stats.most_common_ngram {
        eprintln!(
            "Most common {n}-gram: '{}' followed by '{}' ({} occurrences)",
            ngram.context.join(" "),
            ngram.next_word,
            ngram.count
        );
    }

    if let Some(context) = &stats.most_popular_context {
        eprintln!(
            "Previous-words context with most next-words: '{}' ({} total next-word occurrences)",
            context.context.join(" "),
            context.count
        );
    }

    eprintln!(
        "Entropy: {:.2} bits/token (perplexity: {:.1})",
        stats.summary.entropy, stats.summary.perplexity
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn write_books_creates_expected_files() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("model.json");

        let corpus = Corpus::parse("---\ntitle: T\nauthor: A\n---\na b c d e f g h").unwrap();
        let normalizer = Normalizer::for_corpus(NormalizerConfig::default(), &corpus.lines);
        let model = Model::from_lines(2, &normalizer, &corpus.lines);
        let built = BuiltModel {
            corpus,
            normalizer,
            model,
        };

        let written = write_books(&built, &output_path, 2, true).unwrap();

        assert_eq!(written.len(), 2);
        assert!(written[0].json_path.exists());
        assert!(written[1].json_path.exists());
        assert!(
            written[0].json_path.to_string_lossy().contains("_book_1"),
            "Multi-book outputs should get numbered filenames"
        );
        assert!(
            written[0]
                .subtitle
                .as_ref()
                .is_some_and(|s| s.contains("Book 1 of 2")),
            "Per-book subtitle should include book index"
        );
        // --pdf-only finds the same files again.
        let found = existing_book_artifacts(&output_path, 2).unwrap();
        assert_eq!(found[1].json_path, written[1].json_path);
        assert_eq!(found[1].subtitle, written[1].subtitle);
    }

    #[test]
    fn parses_tool_specs() {
        assert_eq!(parse_tool_spec("VOTE").unwrap(), ("VOTE".to_string(), 3));
        assert_eq!(
            parse_tool_spec("ACTION:5").unwrap(),
            ("ACTION".to_string(), 5)
        );
        assert!(parse_tool_spec(":3").is_err());
        assert!(parse_tool_spec("X:lots").is_err());
    }

    #[test]
    fn parses_makefile_target_names() {
        let (name, n, books) = parse_target("TinyStories-20k-3-3").unwrap();
        assert_eq!(name, "TinyStories-20k");
        assert_eq!(n, 3);
        assert_eq!(books, 3);
    }

    #[test]
    fn pdf_names_replace_underscores_for_books() {
        let pdf_dir = PathBuf::from("out/pdf");
        let json = PathBuf::from("out/json/frankenstein-3-2_book_1.json");
        let pdf = pdf_name_for(&json, &pdf_dir);
        assert!(pdf.ends_with("frankenstein-3-2-book1.pdf"));
    }
}
