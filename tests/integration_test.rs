use std::fs::File;
use std::io::{self, BufReader, Write};
use std::path::Path; // Import Path
use std::process::Command;
use tempfile::TempDir;

// Helper function to run the full pipeline for a given n
fn run_cli_and_typst_test(n: usize, exe_path: &Path, temp_dir: &TempDir) -> io::Result<()> {
    let input_path = temp_dir.path().join(format!("input_n{}.txt", n));
    let model_path = temp_dir.path().join("model.json"); // CLI output, in temp_dir
    let book_pdf_path = temp_dir.path().join("book.pdf"); // Typst output, in temp_dir

    // Determine path to the actual book.typ relative to crate root
    let mut crate_root = std::env::current_dir()?;
    // Assuming tests are run from the 'my_first_lm' directory
    if !crate_root.ends_with("my_first_lm") {
        // If tests run from workspace root, adjust the path
        if crate_root.join("my_first_lm").is_dir() {
            crate_root.push("my_first_lm");
        } else {
            panic!("Could not determine crate root for test. CWD: {:?}", crate_root);
        }
    }
    let actual_book_typ_path = crate_root.join("book.typ");

    assert!(
        actual_book_typ_path.exists(),
        "Actual book.typ not found at: {:?}",
        actual_book_typ_path
    );

    // --- 1. Create test input file ---
    {
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "Test line for n={}.", n)?;
        writeln!(input_file, "Another test line. Quick brown fox.")?;
        input_file.flush()?;
    }

    // --- 2. Run my_first_lm CLI to generate model.json in temp_dir ---
    let cli_status = Command::new(exe_path)
        .arg(&input_path) // Use the full path to input
        .arg("--n")
        .arg(n.to_string())
        .current_dir(temp_dir.path()) // IMPORTANT: Run CLI in temp_dir to output model.json here
        .status()?;

    assert!(cli_status.success(), "CLI command failed for n={}", n);
    assert!(
        model_path.exists(),
        "model.json was not created in temp_dir for n={}",
        n
    );

    // --- 3. Run typst compile using the actual book.typ ---
    // Run typst in temp_dir so it finds the model.json created there.
    let typst_status = Command::new("typst")
        .arg("compile")
        .arg(&actual_book_typ_path) // Path to the *actual* book.typ
        .arg(&book_pdf_path) // Explicitly specify output path in temp_dir
        .current_dir(temp_dir.path()) // IMPORTANT: Run Typst in temp_dir to find model.json
        .output()?; // Use output() to capture stderr if needed

    // Check Typst command success via status code and stderr
    assert!(
        typst_status.status.success(),
        "typst compile failed for n={}. Stderr:\n{}",
        n,
        String::from_utf8_lossy(&typst_status.stderr)
    );
    assert!(
        book_pdf_path.exists(),
        "book.pdf was not created in temp_dir for n={}",
        n
    );

    Ok(())
}

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

    // Create paths for the output files
    let output_path = temp_dir.path().join("output.json");
    let output_path_optimized = temp_dir.path().join("output_optimized.json");

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

    // Test with both default output filename and no scaling
    let default_pure_output_path = temp_dir.path().join("model.json");
    // Clean up any existing model.json from previous test
    if default_pure_output_path.exists() {
        std::fs::remove_file(&default_pure_output_path)?;
    }
    
    let status_pure_default = Command::new(&exe_path)
        .arg(&input_path) // Use the full path to input within the temp dir
        .current_dir(temp_dir.path()) // Set CWD to temp dir
        .status()?;
    
    assert!(status_pure_default.success(), "CLI command with completely default settings failed");
    assert!(default_pure_output_path.exists(), "Default output file (model.json) was not created with default settings");
    
    // Test the default output filename behavior with scaling enabled
    let default_output_path = temp_dir.path().join("model.json");
    let status_default = Command::new(&exe_path)
        .arg(&input_path) // Use the full path to input within the temp dir
        .arg("--scale-to-d120")
        .current_dir(temp_dir.path()) // Set CWD to temp dir
        .status()?;
    
    assert!(status_default.success(), "CLI command with default output failed");
    assert!(default_output_path.exists(), "Default output file (model.json) was not created");
    
    // Run the CLI tool without optimization (using default n=2 for bigrams)
    let status = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path)
        // .arg("--n") // Optional: Add this line to test different N values
        // .arg("3")
        .status()?;

    assert!(status.success(), "CLI command failed");
    assert!(output_path.exists(), "Output file was not created");
    
    // Run again with the scale-to-d120 flag to a different output file
    let status_optimised = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_optimized)
        .arg("--scale-to-d120")
        .status()?;
    
    assert!(status_optimised.success(), "CLI command with --scale-to-d120 flag failed");
    assert!(output_path_optimized.exists(), "Optimized output file was not created");

    // Parse the regular output JSON
    let output_file = File::open(&output_path)?;
    let reader = BufReader::new(output_file);
    let json: Vec<Vec<serde_json::Value>> = serde_json::from_reader(reader)?;

    // Parse the optimized output JSON
    let output_file_optimized = File::open(&output_path_optimized)?;
    let reader_optimized = BufReader::new(output_file_optimized);
    let json_optimized: Vec<Vec<serde_json::Value>> = serde_json::from_reader(reader_optimized)?;

    // Verify structure and content
    assert!(!json.is_empty(), "JSON output is empty");
    assert!(!json_optimized.is_empty(), "Optimized JSON output is empty");

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

        // Verify prefix string
        let prefix_val = &entry[0];
        assert!(
            prefix_val.is_string(),
            "First element should be the prefix string: {:?}",
            prefix_val
        );

        let prefix_word = prefix_val.as_str().unwrap_or("");
        assert!(!prefix_word.is_empty(), "Prefix string should not be empty");

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

        // Verify the second element is the total count
        let total_count_val = &entry[1];
        assert!(
            total_count_val.is_number(),
            "Second element should be the total count: {:?}",
            total_count_val
        );

        // Check follower pairs (starting from index 2 now that we have total count as second element)
        let mut prev_follower = String::new();
        for i in 2..entry.len() {
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
    let mut prev_prefix: Option<String> = None;
    for entry in &json {
        let current_prefix = entry[0].as_str().unwrap_or("").to_string();

        if let Some(ref prev) = prev_prefix {
            assert!(
                current_prefix > *prev,
                "Prefixes not sorted: '{}' should come after '{}'",
                current_prefix,
                prev
            );
        }
        prev_prefix = Some(current_prefix);
    }

    // --- Final assertions for normalization/filtering and counts ---
    assert!(found_prefix_the, "Prefix 'the' not found");
    assert!(
        found_prefix_quick,
        "Prefix 'quick' (from 'quick'/'Quick') not found"
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
        "Expected prefix 'the' to be followed by 'quick' at least once, found {}",
        the_followed_by_quick_count
    );
    assert!(
        quick_followed_by_brown_count >= 2,
        "Expected prefix 'quick' to be followed by 'brown' at least twice, found {}",
        quick_followed_by_brown_count
    );
    
    // --- Now test the optimized version specifically ---
    
    // Check if prefixes with multiple followers have their total count set to 120
    // and the last follower's cumulative count is also 120
    let mut found_optimized_scaling = false;
    
    for entry in &json_optimized {
        // Skip entries with just one follower as they won't be optimized
        if entry.len() <= 3 {
            continue;
        }
        
        // Get total count (should be 120 for entries with multiple followers)
        let total_count = entry[1].as_u64().unwrap_or(0);
        
        // Get the last follower's cumulative count
        let last_follower = &entry[entry.len() - 1];
        let last_follower_arr = last_follower.as_array().unwrap();
        let last_follower_cumulative = last_follower_arr[1].as_u64().unwrap_or(0);
        
        // If this is an optimized entry (has multiple followers)
        if total_count == 120 && last_follower_cumulative == 120 {
            found_optimized_scaling = true;
            
            // Test that cumulative counts are monotonically increasing
            let mut prev_cumulative = 0;
            for i in 2..entry.len() {
                let follower_pair = &entry[i];
                let follower_arr = follower_pair.as_array().unwrap();
                let current_cumulative = follower_arr[1].as_u64().unwrap_or(0);
                
                assert!(
                    current_cumulative > prev_cumulative,
                    "Cumulative counts should be strictly increasing"
                );
                
                prev_cumulative = current_cumulative;
            }
        }
    }
    
    // Only assert if we have entries that should be optimized (with multiple followers)
    // If our test file is too simple, this might not be triggered
    if json_optimized.iter().any(|e| e.len() > 3) {
        assert!(
            found_optimized_scaling,
            "No optimized entries found with scaling to 120"
        );
    }

    Ok(())
}

// New test case for Typst compilation
#[test]
fn test_cli_to_typst_pdf() -> io::Result<()> {
    // Create a temporary directory
    let temp_dir = TempDir::new()?;

    // Get the path to the binary
    let mut exe_path = std::env::current_dir()?;
    exe_path.push("target");
    exe_path.push("debug");
    exe_path.push("my_first_lm");
    if cfg!(windows) {
        exe_path.set_extension("exe");
    }

    // Skip if binary doesn't exist
    if !exe_path.exists() {
        println!(
            "Skipping test_cli_to_typst_pdf: Binary not found at {:?}",
            exe_path
        );
        return Ok(());
    }

    // Skip if typst command is not found
    if Command::new("typst").arg("--version").output().is_err() {
        println!("Skipping test_cli_to_typst_pdf: 'typst' command not found in PATH.");
        return Ok(());
    }

    // Run the test for n=2 (bigrams)
    println!("Running Typst compilation test for n=2...");
    run_cli_and_typst_test(2, &exe_path, &temp_dir)?;
    println!("Typst compilation test for n=2 PASSED.");

    // Run the test for n=3 (trigrams)
    println!("Running Typst compilation test for n=3...");
    run_cli_and_typst_test(3, &exe_path, &temp_dir)?;
    println!("Typst compilation test for n=3 PASSED.");

    Ok(())
}
