use clap::{Args, Parser, Subcommand};
use llms_unplugged::{
    CutoutsMetadata, Metadata, NGramCounter, ProcessingStats, RawToken, WordFollowEntry,
    process_file, process_file_for_cutouts, render_bigram_tsv, save_to_json,
    split_entries_into_books,
};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

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
    #[arg(short, long, default_value_t = 2)]
    n: usize,

    /// Number of books to split the output into (default 1 = no splitting)
    #[arg(short = 'b', long = "books", default_value_t = 1)]
    num_books: usize,

    /// Output raw counts without scaling
    #[arg(long = "raw")]
    raw: bool,

    /// Punctuation characters to preserve as separate tokens (default: ",.")
    #[arg(short = 'p', long = "punctuation", default_value = ",.")]
    punctuation: String,
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
    #[arg(short, long, default_value_t = 2)]
    n: usize,

    /// Number of books to split the output into (default 1 = no splitting)
    #[arg(short = 'b', long = "books", default_value_t = 1)]
    num_books: usize,

    /// Output directory for generated assets (expects json/ and pdf/ inside)
    #[arg(long, default_value = "out")]
    out_dir: PathBuf,

    /// Path to the Typst template (defaults to book.typ)
    #[arg(long, default_value = "book.typ")]
    template: PathBuf,

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

    /// Punctuation characters to preserve as separate tokens (default: ",.")
    #[arg(short = 'p', long = "punctuation", default_value = ",.")]
    punctuation: String,

    /// Add blank pages for book binding (recto/verso layout)
    #[arg(long)]
    book_binding: bool,
}

#[derive(Args, Debug, Clone)]
struct TsvArgs {
    /// Input text file to process
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// Optional output path (defaults to stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Punctuation characters to preserve as separate tokens (default: ",.")
    #[arg(short = 'p', long = "punctuation", default_value = ",.")]
    punctuation: String,
}

#[derive(Args, Debug, Clone)]
struct CutoutsArgs {
    /// Input text file to process
    #[arg(short = 'i', long = "input", value_name = "INPUT")]
    input: PathBuf,

    /// Output directory for generated files (default: current directory)
    #[arg(short, long, default_value = ".")]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2)]
    n: usize,

    /// Paper size for PDF (default: a4)
    #[arg(long, default_value = "a4")]
    paper_size: String,

    /// Punctuation characters to preserve as separate tokens (default: ",.")
    #[arg(short = 'p', long = "punctuation", default_value = ",.")]
    punctuation: String,

    /// Only generate JSON; skip Typst PDF compilation
    #[arg(long)]
    json_only: bool,

    /// Generate a duplex (double-sided) PDF: each cutout page is paired with a
    /// mirrored back so the same cutouts appear on both faces of each sheet.
    /// Print with "flip on short edge" binding. Currently assumes a4 landscape.
    #[arg(long)]
    duplex: bool,
}

fn main() {
    let cli = Cli::parse();
    let result = match &cli.command {
        Commands::Build(args) => run_build_command(args),
        Commands::Pdf(args) => run_pdf_command(args),
        Commands::Tsv(args) => run_tsv_command(args),
        Commands::Cutouts(args) => run_cutouts_command(args),
    };

    match result {
        Ok(_) => {}
        Err(CliError::Processing(err)) => {
            if err.kind() == io::ErrorKind::InvalidData {
                eprintln!("Error: {}", err);
                eprintln!("\nYour input file must begin with valid YAML frontmatter.");
                eprintln!("Frontmatter format:");
                eprintln!("---");
                eprintln!("title: Your Document Title");
                eprintln!("author: Author Name");
                eprintln!("url: https://example.com/document-url");
                eprintln!("---");
                eprintln!("\nThe frontmatter must appear at the beginning of the file.");
                std::process::exit(1);
            } else {
                eprintln!("Error processing input file: {}", err);
                std::process::exit(1);
            }
        }
        Err(CliError::Typst(err)) | Err(CliError::InvalidArgs(err)) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    }
}

#[derive(Debug)]
enum CliError {
    Processing(io::Error),
    Typst(String),
    InvalidArgs(String),
}

#[derive(Debug, Clone)]
struct BuildConfig {
    input: PathBuf,
    output: PathBuf,
    n: usize,
    num_books: usize,
    raw: bool,
    punctuation: Vec<char>,
}

#[derive(Debug, Clone)]
struct BookArtifact {
    range: String,
    json_path: PathBuf,
    subtitle: Option<String>,
}

#[derive(Debug, Clone)]
struct BuildOutcome {
    written: Vec<BookArtifact>,
    stats: ProcessingStats,
    metadata: Option<Metadata>,
    entries: Vec<WordFollowEntry>,
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
    let config = BuildConfig {
        input: args.input.clone(),
        output: args.output.clone(),
        n: args.n,
        num_books: args.num_books,
        raw: args.raw,
        punctuation: args.punctuation.chars().collect(),
    };

    let outcome = build_model(&config)?;
    print_summary(&outcome.stats, outcome.metadata.as_ref(), args.n, args.raw);
    Ok(())
}

fn run_cutouts_command(args: &CutoutsArgs) -> Result<(), CliError> {
    let punctuation: Vec<char> = args.punctuation.chars().collect();
    let (tokens, mut metadata) =
        process_file_for_cutouts(&args.input, punctuation, args.n).map_err(CliError::Processing)?;

    let (_entries, stats, _ngram_meta) =
        process_file(&args.input, args.n).map_err(CliError::Processing)?;
    metadata.entropy = stats.entropy;
    metadata.perplexity = stats.perplexity;

    fs::create_dir_all(&args.output).map_err(CliError::Processing)?;

    let json_path = args.output.join("cutouts.json");
    save_cutouts_json(&tokens, &metadata, &json_path)?;

    println!("Processed '{}' by {}", metadata.title, metadata.author);
    println!(
        "Total tokens: {} ({} kept, {} discarded)",
        metadata.total_tokens,
        metadata.kept_tokens,
        metadata.total_tokens - metadata.kept_tokens
    );
    println!("Wrote JSON to {}", json_path.display());

    if args.json_only {
        return Ok(());
    }

    let typst_bin = typst_command_path();
    let template_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tokenized-cutouts.typ");

    if !template_path.exists() {
        return Err(CliError::Typst(format!(
            "Typst template not found at {}",
            template_path.display()
        )));
    }

    let pdf_path = args.output.join("cutouts.pdf");
    let json_path_abs = fs::canonicalize(&json_path).unwrap_or(json_path.clone());

    let mut typst_cmd = Command::new(&typst_bin);
    typst_cmd.arg("compile");
    typst_cmd.arg("--root");
    typst_cmd.arg("/");
    typst_cmd.arg("--input");
    typst_cmd.arg(format!("paper_size={}", args.paper_size));
    typst_cmd.arg("--input");
    typst_cmd.arg(format!("json_path={}", json_path_abs.display()));
    if args.duplex {
        typst_cmd.arg("--input");
        typst_cmd.arg("duplex=true");
    }
    typst_cmd.arg(&template_path);
    typst_cmd.arg(&pdf_path);

    let output = typst_cmd.output().map_err(|e| {
        if e.kind() == io::ErrorKind::NotFound {
            CliError::Typst(format!(
                "Typst binary not found at '{}'. Install typst or set TYPST_BIN to the binary path.",
                typst_bin.display()
            ))
        } else {
            CliError::Typst(format!("Failed to run typst: {}", e))
        }
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(CliError::Typst(format!("Typst compile failed: {}", stderr)));
    }

    println!("Wrote PDF to {}", pdf_path.display());

    Ok(())
}

fn save_cutouts_json(
    tokens: &[RawToken],
    metadata: &CutoutsMetadata,
    path: &Path,
) -> Result<(), CliError> {
    let output = serde_json::json!({
        "metadata": metadata,
        "tokens": tokens,
    });

    let file = fs::File::create(path).map_err(CliError::Processing)?;
    serde_json::to_writer_pretty(file, &output)
        .map_err(|e| CliError::Processing(io::Error::new(io::ErrorKind::Other, e)))?;

    Ok(())
}

fn run_tsv_command(args: &TsvArgs) -> Result<(), CliError> {
    let config = BuildConfig {
        input: args.input.clone(),
        output: PathBuf::from("tsv-output.json"), // unused placeholder
        n: 2,
        num_books: 1,
        raw: true,
        punctuation: args.punctuation.chars().collect(),
    };

    let outcome = build_model(&config)?;
    if outcome.metadata.as_ref().map(|m| m.n != 2).unwrap_or(false) {
        return Err(CliError::InvalidArgs(
            "TSV export only supports bigrams (n=2).".to_string(),
        ));
    }

    let tsv = render_bigram_tsv(&outcome.entries).map_err(CliError::InvalidArgs)?;
    if let Some(path) = &args.output {
        fs::write(path, tsv).map_err(CliError::Processing)?;
        println!("Wrote TSV to {}", path.display());
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

    let mut written = if args.pdf_only {
        existing_book_artifacts(&base_json, books)?
    } else {
        let config = BuildConfig {
            input: args.input.clone(),
            output: base_json.clone(),
            n,
            num_books: books,
            raw: args.raw,
            punctuation: args.punctuation.chars().collect(),
        };
        let outcome = build_model(&config)?;
        print_summary(&outcome.stats, outcome.metadata.as_ref(), n, args.raw);
        outcome.written
    };

    if args.json_only {
        return Ok(());
    }

    let opts = TypstOptions {
        template: args.template.clone(),
        paper_size: args.paper_size.clone(),
        columns: args.columns,
        subtitle_override: args.subtitle.clone(),
        book_binding: args.book_binding,
    };

    for book in &mut written {
        if book.subtitle.is_none() {
            book.subtitle = load_subtitle_from_json(&book.json_path)?;
        }
    }

    run_typst_for_books(&written, &pdf_dir, &opts)?;

    Ok(())
}

fn build_model(config: &BuildConfig) -> Result<BuildOutcome, CliError> {
    let mut counter = NGramCounter::new(config.n, config.punctuation.clone());
    counter
        .process_file(&config.input)
        .map_err(CliError::Processing)?;

    let entries = counter.get_entries();
    let stats = counter.get_stats().clone();
    let metadata = counter.get_metadata().cloned();
    let books = split_entries_into_books(&entries, config.num_books);

    let written = write_books(
        &books,
        &config.output,
        metadata.as_ref(),
        &stats,
        config.raw,
    )
    .map_err(|err| {
        if err.kind() == io::ErrorKind::NotFound {
            CliError::Processing(io::Error::new(
                io::ErrorKind::NotFound,
                format!("Output directory not found for {}", config.output.display()),
            ))
        } else {
            CliError::Processing(err)
        }
    })?;

    Ok(BuildOutcome {
        written,
        stats,
        metadata,
        entries,
    })
}

fn write_books(
    books: &[(String, Vec<WordFollowEntry>)],
    output: &Path,
    metadata: Option<&Metadata>,
    stats: &ProcessingStats,
    raw: bool,
) -> io::Result<Vec<BookArtifact>> {
    let output_stem = output
        .file_stem()
        .unwrap_or_default()
        .to_str()
        .unwrap_or("model");
    let output_dir = output.parent().unwrap_or(Path::new("."));

    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut written = Vec::new();

    for (index, (range, entries)) in books.iter().enumerate() {
        let output_file = if books.len() == 1 {
            output.to_path_buf()
        } else {
            output_dir.join(format!("{}_book_{}.json", output_stem, index + 1))
        };

        if let Some(parent) = output_file.parent() {
            fs::create_dir_all(parent)?;
        }

        let book_metadata = if books.len() > 1 {
            metadata.map(|m| multi_book_metadata(m, range, index, books.len()))
        } else {
            metadata.cloned()
        };

        let subtitle = book_metadata.as_ref().map(|m| m.subtitle.clone());

        save_to_json(
            entries,
            &output_file,
            book_metadata.as_ref(),
            Some(stats),
            raw,
        )?;

        if books.len() > 1 {
            println!(
                "Successfully wrote book {} ({}) to '{}'",
                index + 1,
                range,
                output_file.display()
            );
        } else {
            println!(
                "Successfully wrote word statistics to '{}'",
                output_file.display()
            );
        }

        written.push(BookArtifact {
            range: range.clone(),
            json_path: output_file,
            subtitle,
        });
    }

    if raw {
        println!("Output raw counts without scaling");
    } else {
        println!("Applied count scaling with d10");
    }

    Ok(written)
}

fn multi_book_metadata(base: &Metadata, range: &str, index: usize, total_books: usize) -> Metadata {
    let mut clone = base.clone();
    let formatted_range = range.replace('-', "–");
    clone.subtitle = format!(
        "A {} language model: {} (Book {} of {})",
        llms_unplugged::model_type_str(base.n),
        formatted_range,
        index + 1,
        total_books
    );
    clone
}

fn run_typst_for_books(
    written: &[BookArtifact],
    pdf_dir: &Path,
    opts: &TypstOptions,
) -> Result<(), CliError> {
    println!("\nRunning typst compile...");

    let typst_bin = typst_command_path();
    let template_dir = opts
        .template
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let template_dir_canon = fs::canonicalize(&template_dir).unwrap_or(template_dir.clone());
    let template_name = opts
        .template
        .file_name()
        .ok_or_else(|| CliError::InvalidArgs("Invalid template path".to_string()))?;

    for (index, book) in written.iter().enumerate() {
        let json_path = fs::canonicalize(&book.json_path).unwrap_or(book.json_path.clone());
        let json_for_typst = json_path
            .strip_prefix(&template_dir_canon)
            .map(Path::to_path_buf)
            .unwrap_or(json_path.clone());
        let pdf_path = pdf_name_for(&book.json_path, pdf_dir);
        if let Some(parent) = pdf_path.parent() {
            fs::create_dir_all(parent).map_err(CliError::Processing)?;
        }

        let mut typst_cmd = Command::new(&typst_bin);
        typst_cmd.arg("compile");
        typst_cmd.arg("--input");
        typst_cmd.arg(format!("paper_size={}", opts.paper_size));
        typst_cmd.arg("--input");
        typst_cmd.arg(format!("columns={}", opts.columns));
        typst_cmd.arg("--input");
        typst_cmd.arg(format!("json_path={}", json_for_typst.display()));

        if let Some(subtitle) = opts
            .subtitle_override
            .clone()
            .or_else(|| book.subtitle.clone())
        {
            typst_cmd.arg("--input");
            typst_cmd.arg(format!("subtitle={}", subtitle));
        }

        if opts.book_binding {
            typst_cmd.arg("--input");
            typst_cmd.arg("book_binding=true");
        }

        typst_cmd.arg(template_name);
        typst_cmd.arg(&pdf_path);
        typst_cmd.current_dir(&template_dir);

        let output = typst_cmd.output().map_err(|e| {
            if e.kind() == io::ErrorKind::NotFound {
                CliError::Typst(format!(
                    "Typst binary not found at '{}'. Install typst or set TYPST_BIN to the binary path.",
                    typst_bin.display()
                ))
            } else {
                CliError::Typst(format!(
                    "Failed to run typst for {}: {}",
                    json_path.display(),
                    e
                ))
            }
        })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(CliError::Typst(format!(
                "Typst compile failed for {}: {}",
                pdf_path.display(),
                stderr
            )));
        }

        log_pdf_pages(&pdf_path);
        let range_label = if book.range.is_empty() {
            String::new()
        } else {
            format!(" ({})", book.range)
        };
        println!(
            "Successfully created PDF {} of {}{} at {}",
            index + 1,
            written.len(),
            range_label,
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

fn log_pdf_pages(pdf_path: &Path) {
    if let Ok(output) = Command::new("pdfinfo").arg(pdf_path).output() {
        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                if line.starts_with("Pages:") {
                    println!(
                        "Pages in {}: {}",
                        pdf_path.display(),
                        line.trim_start_matches("Pages:").trim()
                    );
                }
            }
        }
    }
}

fn typst_command_path() -> PathBuf {
    if let Ok(path) = std::env::var("TYPST_BIN") {
        PathBuf::from(path)
    } else {
        PathBuf::from("typst")
    }
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
    let mut artifacts = Vec::new();
    if books == 1 {
        if !base_json.exists() {
            return Err(CliError::InvalidArgs(format!(
                "Expected JSON at {} but it does not exist",
                base_json.display()
            )));
        }
        artifacts.push(BookArtifact {
            range: String::new(),
            json_path: base_json.to_path_buf(),
            subtitle: load_subtitle_from_json(base_json)?,
        });
    } else {
        for i in 0..books {
            let path = base_json.parent().unwrap_or(Path::new(".")).join(format!(
                "{}_book_{}.json",
                base_json.file_stem().unwrap_or_default().to_string_lossy(),
                i + 1
            ));
            if !path.exists() {
                return Err(CliError::InvalidArgs(format!(
                    "Expected JSON at {} but it does not exist",
                    path.display()
                )));
            }
            artifacts.push(BookArtifact {
                range: String::new(),
                json_path: path.clone(),
                subtitle: load_subtitle_from_json(&path)?,
            });
        }
    }
    Ok(artifacts)
}

fn load_subtitle_from_json(path: &Path) -> Result<Option<String>, CliError> {
    let file = fs::File::open(path).map_err(CliError::Processing)?;
    let json: serde_json::Value =
        serde_json::from_reader(file).map_err(|e| CliError::InvalidArgs(e.to_string()))?;
    let subtitle = json
        .get("metadata")
        .and_then(|m| m.get("subtitle"))
        .and_then(|s| s.as_str())
        .map(|s| s.to_string());
    Ok(subtitle)
}

fn print_summary(stats: &ProcessingStats, metadata: Option<&Metadata>, n: usize, raw: bool) {
    if let Some(meta) = metadata {
        println!("\nDocument Metadata:");
        println!("------------------");
        println!("Title: {}", meta.title);
        println!("Author: {}", meta.author);
        println!("URL: {}", meta.url);
    }

    println!("\nSummary Statistics:");
    println!("-------------------");
    println!("Total tokens in text: {}", stats.total_tokens);
    println!(
        "Unique {}-word previous-words contexts: {}",
        n - 1,
        stats.unique_ngrams
    );
    println!(
        "Total {}-gram occurrences: {}",
        n, stats.total_ngram_occurrences
    );

    if let Some((previous_words, next_word, count)) = &stats.most_common_ngram {
        let previous_words_str = previous_words.join(" ");
        println!(
            "Most common {}-gram: '{}' followed by '{}' ({} occurrences)",
            n, previous_words_str, next_word, count
        );
    }

    if let Some((previous_words, count)) = &stats.most_popular_previous_words {
        let previous_words_str = previous_words.join(" ");
        println!(
            "Previous-words context with most next-words: '{}' ({} total next-word occurrences)",
            previous_words_str, count
        );
    }

    println!(
        "Entropy: {:.2} bits/token (perplexity: {:.1})",
        stats.entropy, stats.perplexity
    );

    if raw {
        println!("\nRaw counts emitted (no dice scaling).");
    } else {
        println!("\nCounts scaled for d10 dice (10^k - 1).");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::TempDir;

    fn stub_metadata() -> Metadata {
        Metadata {
            title: "Test".to_string(),
            author: "Author".to_string(),
            url: "https://example.com".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        }
    }

    fn stub_stats() -> ProcessingStats {
        ProcessingStats {
            total_tokens: 0,
            unique_ngrams: 0,
            total_ngram_occurrences: 0,
            most_common_ngram: None,
            most_popular_previous_words: None,
            entropy: 0.0,
            perplexity: 1.0,
        }
    }

    #[test]
    fn formats_multi_book_metadata() {
        let meta = stub_metadata();
        let updated = multi_book_metadata(&meta, "A-C", 1, 3);
        assert!(updated.subtitle.contains("A–C"));
        assert!(updated.subtitle.contains("Book 2 of 3"));
    }

    #[test]
    fn write_books_creates_expected_files() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("model.json");

        let books = vec![
            (
                "A-C".to_string(),
                vec![WordFollowEntry {
                    previous_words: vec!["a".into()],
                    next_words: vec![("b".into(), 1)],
                }],
            ),
            (
                "D-F".to_string(),
                vec![WordFollowEntry {
                    previous_words: vec!["d".into()],
                    next_words: vec![("e".into(), 1)],
                }],
            ),
        ];

        let meta = stub_metadata();
        let written = write_books(&books, &output_path, Some(&meta), &stub_stats(), true).unwrap();

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

    #[test]
    fn renders_bigram_tsv() {
        let entries = vec![
            WordFollowEntry {
                previous_words: vec!["a".into()],
                next_words: vec![("b".into(), 2), ("c".into(), 1)],
            },
            WordFollowEntry {
                previous_words: vec!["b".into()],
                next_words: vec![("c".into(), 3)],
            },
        ];

        let tsv = render_bigram_tsv(&entries).unwrap();
        // header: a b c
        assert!(tsv.lines().next().unwrap().contains("\ta\tb\tc"));
        // cumulative row for a: b=2, c=3
        assert!(tsv.contains("a\t\t2\t3"));
        // cumulative row for b: c=3
        assert!(tsv.contains("b\t\t\t3"));
    }
}
