use std::path::PathBuf;
use clap::Parser;
use my_first_lm::{save_to_json, NGramCounter};

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
    
    /// Optional value 'd' to scale counts.
    /// If present, for prefixes with <= d followers, counts are scaled to [1, d].
    /// For prefixes with > d followers (or if this arg is not passed),
    /// counts are scaled to [0, 10^n - 1] (smallest n-digit number range).
    #[arg(long = "scale-d")]
    scale_d: Option<u32>,
}

fn main() {
    let args = Args::parse();

    // Create an NGramCounter and process the file
    let mut counter = NGramCounter::new(args.n);
    match counter.process_file(&args.input) {
        Ok(()) => {
            let entries = counter.get_entries();
            let stats = counter.get_stats();
            let metadata = counter.get_metadata();
            
            match save_to_json(&entries, &args.output, args.scale_d, metadata) {
                Ok(_) => {
                    println!("Successfully wrote word statistics to '{}'", args.output.display());
                    if let Some(d) = args.scale_d {
                        println!("Applied count scaling with d={}", d);
                    } else {
                        println!("Applied default count scaling to [0, 10^n-1] range");
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
                    println!("Unique {}-gram prefixes: {}", args.n-1, stats.unique_ngrams);
                    println!("Total {}-gram occurrences: {}", args.n, stats.total_ngram_occurrences);
                    
                    // Print most common n-gram if available
                    if let Some((prefix, follower, count)) = &stats.most_common_ngram {
                        let prefix_str = prefix.join(" ");
                        println!("Most common {}-gram: '{}' followed by '{}' ({} occurrences)", 
                                args.n, prefix_str, follower, count);
                    }
                    
                    // Print prefix with most cumulative followers if available
                    if let Some((prefix, count)) = &stats.most_popular_prefix {
                        let prefix_str = prefix.join(" ");
                        println!("Prefix with most followers: '{}' ({} total followers)", 
                                prefix_str, count);
                    }
                    

                },
                Err(e) => eprintln!("Error writing output file: {}", e),
            }
        },
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
        },
    }
}