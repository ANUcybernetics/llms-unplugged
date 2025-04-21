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

    /// Output JSON file for results
    #[arg(index = 2)]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2)]
    n: usize,
    
    /// Optimise count values for dice rolling:
    /// If the total count divides 24 cleanly (e.g., 1, 2, 3, 4, 6, 8, 12, 24),
    /// scale all counts to make the total reach exactly 24
    #[arg(short, long, default_value_t = false)]
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
                        println!("Applied count optimisation for dice rolling");
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
                    
                    // Print count distribution percentages
                    if stats.unique_ngrams > 0 {
                        println!("\nPrefix Count Distribution:");
                        println!("-------------------------");
                        let total = stats.unique_ngrams as f64;
                        
                        // Display individual counts 1-24
                        for i in 0..24 {
                            let count = i + 1; // Convert 0-indexed to 1-indexed
                            let percentage = stats.count_histogram[i] as f64 / total * 100.0;
                            
                            // Only display counts that have at least one occurrence
                            if stats.count_histogram[i] > 0 {
                                println!("Count = {:<2}: {:.1}%", count, percentage);
                            }
                        }
                        
                        // Display 25+ if there are any
                        if stats.count_25_plus > 0 {
                            println!("Count ≥ 25:  {:.1}%", (stats.count_25_plus as f64 / total * 100.0));
                        }
                        
                        // Calculate and display percentages for counts that divide 24 cleanly
                        println!("\nCounts that divide 24 cleanly (optimisable):");
                        println!("------------------------------------------");
                        let divisors = [1, 2, 3, 4, 6, 8, 12, 24];
                        let mut total_optimisable = 0;
                        
                        for &div in &divisors {
                            let idx = div - 1; // Convert to 0-indexed
                            if idx < 24 { // Only count up to 24
                                let count = stats.count_histogram[idx];
                                let percentage = count as f64 / total * 100.0;
                                total_optimisable += count;
                                println!("Count = {:<2}: {:.1}%", div, percentage);
                            }
                        }
                        
                        // Display total percentage for optimisable counts
                        let total_percentage = total_optimisable as f64 / total * 100.0;
                        println!("Total optimisable: {:.1}%", total_percentage);
                    }
                },
                Err(e) => eprintln!("Error writing output file: {}", e),
            }
        },
        Err(e) => eprintln!("Error processing input file: {}", e),
    }
}