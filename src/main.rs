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
    
    /// Optimise count values for a 120-sided die:
    /// Scales the counts so they sum to 120, using ceiling rounding to ensure
    /// counts of at least 1. For prefixes with more than 120 followers,
    /// the counts are left unchanged.
    #[arg(long = "scale-to-d120", default_value_t = false)]
    optimise: bool,
}

fn main() {
    let args = Args::parse();

    // Create an NGramCounter and process the file
    let mut counter = NGramCounter::new(args.n);
    match counter.process_file(&args.input) {
        Ok(()) => {
            let entries = counter.get_entries();
            let stats = counter.get_stats();
            
            match save_to_json(&entries, &args.output, args.optimise) {
                Ok(_) => {
                    println!("Successfully wrote word statistics to '{}'", args.output.display());
                    if args.optimise {
                        println!("Applied count scaling for d120 dice rolling");
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
        Err(e) => eprintln!("Error processing input file: {}", e),
    }
}