use std::fs::File;
use std::io::{self, BufReader, Write};
use std::process::Command;
use tempfile::TempDir;

#[test]
fn test_cli_end_to_end() -> io::Result<()> {
    // Create a temporary directory for test files
    let temp_dir = TempDir::new()?;

    // Create a temporary input file
    let input_path = temp_dir.path().join("input.txt");
    let mut input_file = File::create(&input_path)?;
    writeln!(input_file, "The quick, Brown fox jumps over the lazy dog.")?;
    writeln!(input_file, "The FOX is quick and the dog is lazy?")?;
    writeln!(input_file, "Quick brown foxes jump! 123 456")?;
    writeln!(input_file, "Ignore---these words ###")?;
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

    // Run the CLI tool (using default n=2 for bigrams)
    let status = Command::new(exe_path)
        .arg(&input_path)
        .arg(&output_path)
        // .arg("--n") // Optional: Add this line to test different N values
        // .arg("3")
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

    // --- Start verification for N-gram structure, normalization, and filtering ---
    let mut found_prefix_the = false;
    let mut found_prefix_quick = false;
    let mut found_invalid_chars_word = false; // Flag if any word (prefix or follower) has invalid chars
    let mut the_followed_by_quick_count = 0;
    let mut quick_followed_by_brown_count = 0;

    // Verify structure (each entry should be an array: [prefix_array, follower_pair, ...])
    for entry in &json {
        assert!(
            entry.len() >= 2,
            "Entry should have at least a prefix array and one follower pair: {:?}",
            entry
        );

        // Verify prefix array
        let prefix_val = &entry[0];
        assert!(
            prefix_val.is_array(),
            "First element should be the prefix array: {:?}",
            prefix_val
        );
        let prefix_arr = prefix_val.as_array().unwrap();
        assert_eq!(
            prefix_arr.len(),
            1,
            "Prefix array should have size 1 for n=2 (bigrams): {:?}",
            prefix_arr
        ); // n=2 means prefix size 1

        let prefix_word = prefix_arr[0].as_str().unwrap_or("");
        assert!(!prefix_word.is_empty(), "Prefix word should not be empty");

        // Check prefix word normalization (should be all lowercase alphabetic)
        if prefix_word.chars().any(|c| !c.is_lowercase()) {
            found_invalid_chars_word = true;
        }

        // Track specific prefixes
        if prefix_word == "the" {
            found_prefix_the = true;
        }
        if prefix_word == "quick" {
            found_prefix_quick = true;
        }

        // Check follower pairs
        let mut prev_follower = String::new();
        for i in 1..entry.len() {
            let follower_pair = &entry[i];
            assert!(
                follower_pair.is_array(),
                "Follower entry should be an array [word, count]: {:?}",
                follower_pair
            );
            let follower_arr = follower_pair.as_array().unwrap();
            assert_eq!(
                follower_arr.len(),
                2,
                "Follower pair should have 2 elements [word, count]: {:?}",
                follower_arr
            );

            let follower_word = follower_arr[0].as_str().unwrap_or("");
            assert!(
                !follower_word.is_empty(),
                "Follower word should not be empty"
            );
            assert!(
                follower_arr[1].is_number(),
                "Follower count should be a number: {:?}",
                follower_arr[1]
            );

            // Check follower word normalization (should be all lowercase alphabetic)
            if follower_word.chars().any(|c| !c.is_lowercase()) {
                found_invalid_chars_word = true;
            }

            // Check follower sorting
            if !prev_follower.is_empty() {
                assert!(
                    follower_word > prev_follower.as_str(),
                    "Followers not sorted for prefix '{}': '{}' should come after '{}'",
                    prefix_word,
                    follower_word,
                    prev_follower
                );
            }
            prev_follower = follower_word.to_string();

            // Count specific follow occurrences
            if prefix_word == "the" && follower_word == "quick" {
                the_followed_by_quick_count += follower_arr[1].as_u64().unwrap_or(0) as usize;
            }
            if prefix_word == "quick" && follower_word == "brown" {
                quick_followed_by_brown_count += follower_arr[1].as_u64().unwrap_or(0) as usize;
            }
        }
    }

    // Verify overall prefix sorting
    let mut prev_prefix: Option<Vec<String>> = None;
    for entry in &json {
        let current_prefix: Vec<String> = entry[0]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap_or("").to_string())
            .collect();

        if let Some(ref prev) = prev_prefix {
            assert!(
                current_prefix > *prev,
                "Prefixes not sorted: {:?} should come after {:?}",
                current_prefix,
                prev
            );
        }
        prev_prefix = Some(current_prefix);
    }

    // --- Final assertions for normalization/filtering and counts ---
    assert!(found_prefix_the, "Prefix ['the'] not found");
    assert!(
        found_prefix_quick,
        "Prefix ['quick'] (from 'quick'/'Quick') not found"
    );
    assert!(
        !found_invalid_chars_word,
        "Found word (prefix or follower) containing non-lowercase-alphabetic characters"
    );

    // Based on input:
    // "the quick" -> count 1 (cumulative)
    // "the fox" -> count 1 (cumulative)
    // "the dog" -> count 1 (cumulative)
    // "the lazy" -> count 1 (cumulative)
    // "quick brown" -> count 2 (from "quick, Brown" and "Quick brown") (cumulative)
    assert!(
        the_followed_by_quick_count >= 1,
        "Expected prefix ['the'] to be followed by 'quick' at least once, found {}",
        the_followed_by_quick_count
    );
    assert!(
        quick_followed_by_brown_count >= 2,
        "Expected prefix ['quick'] to be followed by 'brown' at least twice, found {}",
        quick_followed_by_brown_count
    );

    Ok(())
}
