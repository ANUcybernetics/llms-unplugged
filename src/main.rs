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
}

fn main() {
    let args = Args::parse();

    match process_file(&args.input) {
        Ok(entries) => {
            match save_to_json(&entries, &args.output) {
                Ok(_) => println!("Successfully wrote word statistics to '{}'", args.output.display()),
                Err(e) => eprintln!("Error writing output file: {}", e),
            }
        },
        Err(e) => eprintln!("Error processing input file: {}", e),
    }
}