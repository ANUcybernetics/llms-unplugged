use clap::Parser;
use llms_unplugged::{
    Metadata, NGramCounter, ProcessingStats, WordFollowEntry, save_to_json,
    split_entries_into_books,
};
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

/// A simple language model builder that processes text files and outputs word following statistics
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Input text file to process
    #[arg(index = 1)]
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

    /// Run typst compile on the generated JSON files to create PDFs
    #[arg(long = "typst")]
    run_typst: bool,

    /// Output raw counts without scaling
    #[arg(long = "raw")]
    raw: bool,

    /// Punctuation characters to preserve as separate tokens (default: ",.")
    #[arg(short = 'p', long = "punctuation", default_value = ",.")]
    punctuation: String,
}

fn main() {
    let args = Args::parse();
    match run(&args) {
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
        Err(CliError::Typst(err)) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    }
}

#[derive(Debug)]
enum CliError {
    Processing(io::Error),
    Typst(String),
}

fn run(args: &Args) -> Result<(), CliError> {
    let punctuation: Vec<char> = args.punctuation.chars().collect();
    let mut counter = NGramCounter::new(args.n, punctuation);
    counter
        .process_file(&args.input)
        .map_err(CliError::Processing)?;

    let entries = counter.get_entries();
    let stats = counter.get_stats().clone();
    let metadata = counter.get_metadata().cloned();
    let books = split_entries_into_books(&entries, args.num_books);

    let written = write_books(&books, &args.output, metadata.as_ref(), &stats, args.raw)
        .map_err(CliError::Processing)?;

    print_summary(&stats, metadata.as_ref(), args.n, args.raw);

    if args.run_typst {
        run_typst(&written, args.num_books).map_err(CliError::Typst)?;
    }

    Ok(())
}

fn write_books(
    books: &[(String, Vec<WordFollowEntry>)],
    output: &Path,
    metadata: Option<&Metadata>,
    stats: &ProcessingStats,
    raw: bool,
) -> io::Result<Vec<(String, PathBuf)>> {
    let output_stem = output
        .file_stem()
        .unwrap_or_default()
        .to_str()
        .unwrap_or("model");
    let output_dir = output.parent().unwrap_or(Path::new("."));

    let mut written = Vec::new();

    for (index, (range, entries)) in books.iter().enumerate() {
        let output_file = if books.len() == 1 {
            output.to_path_buf()
        } else {
            output_dir.join(format!("{}_book_{}.json", output_stem, index + 1))
        };

        let book_metadata = if books.len() > 1 {
            metadata.map(|m| multi_book_metadata(m, range, index, books.len()))
        } else {
            metadata.cloned()
        };

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

        written.push((range.clone(), output_file));
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

fn run_typst(written: &[(String, PathBuf)], num_books: usize) -> Result<(), String> {
    println!("\nRunning typst compile...");

    for (index, (range, json_file)) in written.iter().enumerate() {
        let output_dir = json_file.parent().unwrap_or(Path::new("."));
        let pdf_file = json_file.with_extension("pdf");

        let subtitle = if num_books > 1 {
            format!("{} (book {} of {})", range, index + 1, num_books)
        } else {
            String::new()
        };

        let model_json_path = output_dir.join("model.json");
        if json_file != &model_json_path {
            std::fs::copy(json_file, &model_json_path).map_err(|e| {
                format!("Error copying {} to model.json: {}", json_file.display(), e)
            })?;
        }

        let mut typst_cmd = Command::new("typst");
        typst_cmd.arg("compile");

        if !subtitle.is_empty() {
            typst_cmd.arg("--input");
            typst_cmd.arg(format!("subtitle={}", subtitle));
        }

        typst_cmd.arg("book.typ");
        typst_cmd.arg(&pdf_file);

        let output = typst_cmd
            .output()
            .map_err(|e| format!("Failed to run typst for {}: {}", json_file.display(), e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "Typst compile failed for {}: {}",
                pdf_file.display(),
                stderr
            ));
        }

        if json_file != &model_json_path && model_json_path.exists() {
            let _ = std::fs::remove_file(&model_json_path);
        }

        println!("Successfully created PDF: {}", pdf_file.display());
    }

    Ok(())
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
    println!("Unique {}-gram prefixes: {}", n - 1, stats.unique_ngrams);
    println!(
        "Total {}-gram occurrences: {}",
        n, stats.total_ngram_occurrences
    );

    if let Some((prefix, follower, count)) = &stats.most_common_ngram {
        let prefix_str = prefix.join(" ");
        println!(
            "Most common {}-gram: '{}' followed by '{}' ({} occurrences)",
            n, prefix_str, follower, count
        );
    }

    if let Some((prefix, count)) = &stats.most_popular_prefix {
        let prefix_str = prefix.join(" ");
        println!(
            "Prefix with most followers: '{}' ({} total followers)",
            prefix_str, count
        );
    }

    if raw {
        println!("\nRaw counts emitted (no dice scaling).");
    } else {
        println!("\nCounts scaled for d10 dice (10^k - 1).");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
            most_popular_prefix: None,
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
                    prefix: vec!["a".into()],
                    followers: vec![("b".into(), 1)],
                }],
            ),
            (
                "D-F".to_string(),
                vec![WordFollowEntry {
                    prefix: vec!["d".into()],
                    followers: vec![("e".into(), 1)],
                }],
            ),
        ];

        let meta = stub_metadata();
        let written = write_books(&books, &output_path, Some(&meta), &stub_stats(), true).unwrap();

        assert_eq!(written.len(), 2);
        assert!(written[0].1.exists());
        assert!(written[1].1.exists());
        assert!(
            written[0].1.to_string_lossy().contains("_book_1"),
            "Multi-book outputs should get numbered filenames"
        );
    }
}
