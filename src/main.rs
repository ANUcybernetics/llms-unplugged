use std::path::PathBuf;
use clap::Parser;
use my_first_lm::{process_file, save_to_json};

/// A simple language model builder that processes text files and outputs word following statistics
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Input text file to process
    #[arg(short, long)]
    input: PathBuf,

    /// Output JSON file for results
    #[arg(short, long)]
    output: PathBuf,

    /// The size of the N-gram (e.g., 2 for bigrams, 3 for trigrams).
    #[arg(short, long, default_value_t = 2)]
    n: usize,
}

fn main() {
    let args = Args::parse();

    match process_file(&args.input, args.n) {
        Ok(entries) => {
            match save_to_json(&entries, &args.output) {
                Ok(_) => println!("Successfully wrote word statistics to '{}'", args.output.display()),
                Err(e) => eprintln!("Error writing output file: {}", e),
            }
        },
        Err(e) => eprintln!("Error processing input file: {}", e),
    }
}