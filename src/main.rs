use clap::Parser;
use my_first_lm::{NGramCounter, save_to_json, split_entries_into_books};
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

    /// Value 'd' to scale counts (default: 10).
    /// For prefixes with <= d followers, counts are scaled to [1, d].
    /// For prefixes with > d followers, counts are scaled to [0, 10^n - 1] (smallest n-digit number range).
    #[arg(long = "scale-d", default_value_t = 10)]
    scale_d: u32,

    /// Number of books to split the output into (default 1 = no splitting)
    #[arg(short = 'b', long = "books", default_value_t = 1)]
    num_books: usize,

    /// Run typst compile on the generated JSON files to create PDFs
    #[arg(long = "typst")]
    run_typst: bool,

    /// Output raw counts without scaling
    #[arg(long = "raw")]
    raw: bool,
}

fn main() {
    let args = Args::parse();

    // No need to check for incompatible flags - if raw is specified, it overrides scale_d

    // Create an NGramCounter and process the file
    let mut counter = NGramCounter::new(args.n);
    match counter.process_file(&args.input) {
        Ok(()) => {
            let entries = counter.get_entries();
            let stats = counter.get_stats();
            let metadata = counter.get_metadata();

            // Split entries into books if requested
            let books = split_entries_into_books(&entries, args.num_books);
            
            // Save each book to a separate file
            let mut all_success = true;
            let output_stem = args.output.file_stem().unwrap_or_default().to_str().unwrap_or("model");
            let output_dir = args.output.parent().unwrap_or(Path::new("."));
            
            for (i, (book_range, book_entries)) in books.iter().enumerate() {
                let output_file = if args.num_books == 1 {
                    args.output.clone()
                } else {
                    let filename = format!("{}_book_{}.json", output_stem, i + 1);
                    output_dir.join(filename)
                };
                
                // Create metadata with appropriate subtitle for multi-book scenarios
                let book_metadata = if args.num_books > 1 {
                    metadata.map(|m| {
                        let mut m_clone = m.clone();
                        // Update subtitle to include book range info with en dash
                        let range_parts: Vec<&str> = book_range.split('-').collect();
                        let formatted_range = if range_parts.len() == 2 {
                            format!("{}–{}", range_parts[0], range_parts[1])
                        } else {
                            book_range.clone()
                        };
                        m_clone.subtitle = format!(
                            "A {} language model: {} (Book {} of {})",
                            my_first_lm::model_type_str(m.n),
                            formatted_range,
                            i + 1,
                            books.len()
                        );
                        m_clone
                    })
                } else {
                    metadata.cloned()
                };
                
                // Pass scale_d only if not in raw mode
                let scale_d_param = if args.raw { None } else { Some(args.scale_d) };
                match save_to_json(book_entries, &output_file, scale_d_param, book_metadata.as_ref(), args.raw) {
                    Ok(_) => {
                        if args.num_books > 1 {
                            println!(
                                "Successfully wrote book {} ({}) to '{}'",
                                i + 1,
                                book_range,
                                output_file.display()
                            );
                        } else {
                            println!(
                                "Successfully wrote word statistics to '{}'",
                                output_file.display()
                            );
                        }
                    }
                    Err(e) => {
                        eprintln!("Error writing output file '{}': {}", output_file.display(), e);
                        all_success = false;
                    }
                }
            }
            
            if all_success {
                if args.raw {
                    println!("Output raw counts without scaling");
                } else {
                    println!("Applied count scaling with d={}", args.scale_d);
                }

                    // Print metadata information
                    if let Some(meta) = metadata {
                        println!("\nDocument Metadata:");
                        println!("------------------");
                        println!("Title: {}", meta.title);
                        println!("Author: {}", meta.author);
                        println!("URL: {}", meta.url);
                    }

                    // Print summary statistics
                    println!("\nSummary Statistics:");
                    println!("-------------------");
                    println!("Total tokens in text: {}", stats.total_tokens);
                    println!(
                        "Unique {}-gram prefixes: {}",
                        args.n - 1,
                        stats.unique_ngrams
                    );
                    println!(
                        "Total {}-gram occurrences: {}",
                        args.n, stats.total_ngram_occurrences
                    );

                    // Print most common n-gram if available
                    if let Some((prefix, follower, count)) = &stats.most_common_ngram {
                        let prefix_str = prefix.join(" ");
                        println!(
                            "Most common {}-gram: '{}' followed by '{}' ({} occurrences)",
                            args.n, prefix_str, follower, count
                        );
                    }

                    // Print prefix with most cumulative followers if available
                    if let Some((prefix, count)) = &stats.most_popular_prefix {
                        let prefix_str = prefix.join(" ");
                        println!(
                            "Prefix with most followers: '{}' ({} total followers)",
                            prefix_str, count
                        );
                    }
                
                // Run typst if requested
                if args.run_typst && all_success {
                    println!("\nRunning typst compile...");
                    for (i, (book_range, _)) in books.iter().enumerate() {
                        let json_file = if args.num_books == 1 {
                            args.output.clone()
                        } else {
                            let filename = format!("{}_book_{}.json", output_stem, i + 1);
                            output_dir.join(filename)
                        };
                        
                        let pdf_file = json_file.with_extension("pdf");
                        
                        // Prepare the subtitle for multi-book outputs
                        let subtitle = if args.num_books > 1 {
                            format!("{} (book {} of {})", book_range, i + 1, args.num_books)
                        } else {
                            String::new()
                        };
                        
                        // Copy JSON file to model.json temporarily (required by book.typ)
                        let model_json_path = output_dir.join("model.json");
                        if json_file != model_json_path {
                            if let Err(e) = std::fs::copy(&json_file, &model_json_path) {
                                eprintln!("Error copying {} to model.json: {}", json_file.display(), e);
                                continue;
                            }
                        }
                        
                        // Run typst with the subtitle parameter
                        let mut typst_cmd = Command::new("typst");
                        typst_cmd.arg("compile");
                        
                        if !subtitle.is_empty() {
                            typst_cmd.arg("--input");
                            typst_cmd.arg(format!("subtitle={}", subtitle));
                        }
                        
                        typst_cmd.arg("book.typ");
                        typst_cmd.arg(&pdf_file);
                        
                        match typst_cmd.output() {
                            Ok(output) => {
                                if output.status.success() {
                                    println!("Successfully created PDF: {}", pdf_file.display());
                                } else {
                                    eprintln!("Typst compile failed for {}", pdf_file.display());
                                    if !output.stderr.is_empty() {
                                        eprintln!("Error: {}", String::from_utf8_lossy(&output.stderr));
                                    }
                                }
                            }
                            Err(e) => {
                                eprintln!("Failed to run typst: {}", e);
                                eprintln!("Make sure typst is installed and in your PATH");
                            }
                        }
                        
                        // Clean up temporary model.json if it was created
                        if json_file != model_json_path && model_json_path.exists() {
                            let _ = std::fs::remove_file(&model_json_path);
                        }
                    }
                }
            } else {
                eprintln!("Error writing output files");
            }
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::InvalidData {
                eprintln!("Error: {}", e);
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
                eprintln!("Error processing input file: {}", e);
            }
        }
    }
}
