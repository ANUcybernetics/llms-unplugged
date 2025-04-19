use std::fs::File;
use std::io::{self, Write, BufReader};
use std::process::Command;
use tempfile::TempDir;

#[test]
fn test_cli_end_to_end() -> io::Result<()> {
    // Create a temporary directory for test files
    let temp_dir = TempDir::new()?;
    
    // Create a temporary input file
    let input_path = temp_dir.path().join("input.txt");
    let mut input_file = File::create(&input_path)?;
    writeln!(input_file, "The quick brown fox jumps over the lazy dog.")?;
    writeln!(input_file, "The fox is quick and the dog is lazy.")?;
    writeln!(input_file, "Quick brown foxes jump.")?;
    input_file.flush()?;
    
    // Create a path for the output file
    let output_path = temp_dir.path().join("output.json");
    
    // Get the path to the binary directory
    let mut exe_path = std::env::current_dir()?;
    exe_path.push("target");
    exe_path.push("debug");
    exe_path.push("my_first_lm"); // Add the binary name
    
    // On Windows, add .exe extension
    if cfg!(windows) {
        exe_path.set_extension("exe");
    }
    
    // Skip the test if the binary doesn't exist yet
    if !exe_path.exists() {
        println!("Skipping test: Binary not found at {:?}", exe_path);
        return Ok(());
    }
    
    // Run the CLI tool
    let status = Command::new(exe_path)
        .arg("--input")
        .arg(&input_path)
        .arg("--output")
        .arg(&output_path)
        .status()?;
    
    assert!(status.success(), "CLI command failed");
    assert!(output_path.exists(), "Output file was not created");
    
    // Parse the output JSON
    let output_file = File::open(&output_path)?;
    let reader = BufReader::new(output_file);
    let json: Vec<Vec<serde_json::Value>> = serde_json::from_reader(reader)?;
    
    // Verify structure and content
    assert!(!json.is_empty(), "JSON output is empty");
    
    // Verify we have some entries
    assert!(!json.is_empty(), "JSON output is empty");
    
    // Verify structure (each entry should be an array with at least one element)
    for entry in &json {
        assert!(entry.len() >= 1, "Entry does not have the expected structure");
        assert!(entry[0].is_string(), "First element of entry is not a string");
        
        // Check follower pairs (if any)
        for i in 1..entry.len() {
            if let serde_json::Value::Array(follower_pair) = &entry[i] {
                assert_eq!(follower_pair.len(), 2, "Follower pair does not have exactly 2 elements");
                assert!(follower_pair[0].is_string(), "Follower word is not a string");
                assert!(follower_pair[1].is_number(), "Follower count is not a number");
            } else {
                panic!("Expected follower pair to be an array");
            }
        }
    }
    
    // Verify all entries are properly alphabetically sorted
    let mut prev_word = String::new();
    for entry in &json {
        let current_word = entry[0].as_str().unwrap_or_default();
        if !prev_word.is_empty() {
            assert!(
                current_word > prev_word.as_str(),
                "Words not sorted: '{}' should come after '{}'",
                current_word,
                prev_word
            );
        }
        prev_word = current_word.to_string();
        
        // Verify followers are alphabetically sorted
        let mut prev_follower = String::new();
        for i in 1..entry.len() {
            if let serde_json::Value::Array(follower_entry) = &entry[i] {
                let follower = follower_entry[0].as_str().unwrap_or_default();
                if !prev_follower.is_empty() {
                    assert!(
                        follower > prev_follower.as_str(),
                        "Followers not sorted: '{}' should come after '{}'",
                        follower,
                        prev_follower
                    );
                }
                prev_follower = follower.to_string();
            }
        }
    }
    
    Ok(())
}