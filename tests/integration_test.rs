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
            panic!(
                "Could not determine crate root for test. CWD: {:?}",
                crate_root
            );
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
        // Add frontmatter
        writeln!(input_file, "---")?;
        writeln!(input_file, "title: Test Document for n={}", n)?;
        writeln!(input_file, "author: Integration Test")?;
        writeln!(input_file, "url: https://example.com/test{}", n)?;
        writeln!(input_file, "---")?;
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

    // --- 3. Copy book.typ to temp_dir and run typst compile ---
    // Copy book.typ to temp_dir so it can find model.json in the same directory
    let temp_book_typ_path = temp_dir.path().join("book.typ");
    std::fs::copy(&actual_book_typ_path, &temp_book_typ_path)?;
    
    // Run typst in temp_dir so it finds the model.json created there.
    let typst_status = Command::new("typst")
        .arg("compile")
        .arg("book.typ") // Use the local copy in temp_dir
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
fn test_frontmatter_errors() -> io::Result<()> {
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
            "Skipping test_frontmatter_errors: Binary not found at {:?}",
            exe_path
        );
        return Ok(());
    }

    // Test 1: Missing frontmatter completely
    {
        let input_path = temp_dir.path().join("missing_frontmatter.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "This file has no frontmatter at all.")?;
        writeln!(input_file, "The program should exit with an error.")?;
        input_file.flush()?;

        let output = Command::new(&exe_path).arg(&input_path).output()?;

        // With the new implementation, missing frontmatter should fail
        assert!(
            !output.status.success(),
            "CLI should fail with missing frontmatter"
        );

        // Error output should contain error about missing frontmatter
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error: No valid YAML frontmatter found"),
            "Should output error about missing frontmatter: {}",
            stderr_message
        );

        // Error message should include instructions
        assert!(
            stderr_message.contains("must begin with valid YAML frontmatter"),
            "Should include instructions about frontmatter format: {}",
            stderr_message
        );
    }

    // Test 2: Frontmatter missing required field (title)
    {
        let input_path = temp_dir.path().join("missing_title.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "author: Test Author")?;
        writeln!(input_file, "url: https://example.com")?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "This file is missing the title field.")?;
        input_file.flush()?;

        let output = Command::new(&exe_path).arg(&input_path).output()?;

        // Should fail with error
        assert!(
            !output.status.success(),
            "CLI should fail with missing title"
        );

        // Error message should mention missing fields
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error: Frontmatter missing required fields"),
            "Should error about missing required fields: {}",
            stderr_message
        );
    }

    // Test 3: Frontmatter missing required field (author)
    {
        let input_path = temp_dir.path().join("missing_author.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "title: Test Document")?;
        writeln!(input_file, "url: https://example.com")?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "This file is missing the author field.")?;
        input_file.flush()?;

        let output = Command::new(&exe_path).arg(&input_path).output()?;

        // Should fail with error
        assert!(
            !output.status.success(),
            "CLI should fail with missing author"
        );

        // Error message should mention missing fields
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error: Frontmatter missing required fields"),
            "Should error about missing required fields: {}",
            stderr_message
        );
    }

    // Test 4: Frontmatter missing required field (url)
    {
        let input_path = temp_dir.path().join("missing_url.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "title: Test Document")?;
        writeln!(input_file, "author: Test Author")?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "This file is missing the url field.")?;
        input_file.flush()?;

        let output = Command::new(&exe_path).arg(&input_path).output()?;

        // Should fail with error
        assert!(!output.status.success(), "CLI should fail with missing url");

        // Error message should mention missing fields
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error: Frontmatter missing required fields"),
            "Should error about missing required fields: {}",
            stderr_message
        );
    }

    // Test 5: Malformed YAML frontmatter
    {
        let input_path = temp_dir.path().join("malformed_frontmatter.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "title: Test Document")?;
        writeln!(input_file, "author: Test Author")?;
        writeln!(input_file, "url: https://example.com")?;
        writeln!(input_file, "malformed: - this is not valid YAML")?; // Malformed YAML
        writeln!(input_file, "---")?;
        writeln!(
            input_file,
            "This file has malformed YAML in the frontmatter."
        )?;
        input_file.flush()?;

        let output = Command::new(&exe_path).arg(&input_path).output()?;

        // Should fail
        assert!(
            !output.status.success(),
            "CLI should fail with malformed YAML"
        );

        // Error message should be meaningful
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error"),
            "Should output error message for malformed frontmatter: {}",
            stderr_message
        );

        // Should provide guidance
        assert!(
            stderr_message.contains("frontmatter"),
            "Error should mention frontmatter: {}",
            stderr_message
        );
    }

    Ok(())
}

#[test]
fn test_cli_raw_flag() -> io::Result<()> {
    // Create a temporary directory for test files
    let temp_dir = TempDir::new()?;

    // Create a temporary input file
    let input_path = temp_dir.path().join("input.txt");
    let mut input_file = File::create(&input_path)?;
    // Add frontmatter
    writeln!(input_file, "---")?;
    writeln!(input_file, "title: Raw Output Test")?;
    writeln!(input_file, "author: Test Author")?;
    writeln!(input_file, "url: https://test.com")?;
    writeln!(input_file, "---")?;
    writeln!(input_file, "The cat sat. The cat ran. The dog sat.")?;
    input_file.flush()?;

    let output_path_raw = temp_dir.path().join("output_raw.json");
    let output_path_scaled = temp_dir.path().join("output_scaled.json");

    // Get the path to the binary
    let mut exe_path = std::env::current_dir()?;
    exe_path.push("target");
    exe_path.push("debug");
    exe_path.push("my_first_lm");

    if cfg!(windows) {
        exe_path.set_extension("exe");
    }

    // Skip the test if the binary doesn't exist
    if !exe_path.exists() {
        println!("Skipping test: Binary not found at {:?}", exe_path);
        return Ok(());
    }

    // Run with --raw flag
    let status_raw = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_raw)
        .arg("--raw")
        .status()?;
    assert!(status_raw.success(), "CLI command with --raw failed");
    assert!(output_path_raw.exists(), "Raw output file was not created");

    // Run without --raw flag (default scaling)
    let status_scaled = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_scaled)
        .status()?;
    assert!(status_scaled.success(), "CLI command without --raw failed");
    assert!(output_path_scaled.exists(), "Scaled output file was not created");

    // Parse JSON outputs
    let json_raw: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_raw)?))?;
    let json_scaled: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_scaled)?))?;

    // Get data arrays
    let data_raw = json_raw.get("data").unwrap().as_array().unwrap();
    let data_scaled = json_scaled.get("data").unwrap().as_array().unwrap();

    // Find "the" prefix in both outputs
    let mut the_raw_total = None;
    let mut the_scaled_total = None;

    for entry in data_raw {
        if entry[0].as_str().unwrap() == "The" {
            the_raw_total = Some(entry[1].as_u64().unwrap());
            break;
        }
    }

    for entry in data_scaled {
        if entry[0].as_str().unwrap() == "The" {
            the_scaled_total = Some(entry[1].as_u64().unwrap());
            break;
        }
    }

    // Raw should have actual count (3), scaled should be different
    assert_eq!(the_raw_total, Some(3), "Raw output should have actual count");
    assert_ne!(the_raw_total, the_scaled_total, "Raw and scaled totals should differ");

    Ok(())
}

#[test]
fn test_cli_incompatible_flags() -> io::Result<()> {
    // Create a temporary directory
    let temp_dir = TempDir::new()?;

    // Create a temporary input file
    let input_path = temp_dir.path().join("input.txt");
    let mut input_file = File::create(&input_path)?;
    writeln!(input_file, "---")?;
    writeln!(input_file, "title: Test")?;
    writeln!(input_file, "author: Test")?;
    writeln!(input_file, "url: https://test.com")?;
    writeln!(input_file, "---")?;
    writeln!(input_file, "Test text.")?;
    input_file.flush()?;

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
        println!("Skipping test: Binary not found at {:?}", exe_path);
        return Ok(());
    }

    // Try to run with both --raw and --scale-d flags
    // Now this should succeed, with --raw overriding --scale-d
    let output = Command::new(&exe_path)
        .arg(&input_path)
        .arg("--raw")
        .arg("--scale-d")
        .arg("120")
        .output()?;

    // Should succeed since --raw overrides --scale-d
    assert!(output.status.success(), "CLI should succeed with --raw overriding --scale-d");

    Ok(())
}

#[test]
fn test_cli_end_to_end() -> io::Result<()> {
    // Create a temporary directory for test files
    let temp_dir = TempDir::new()?;

    // Create a temporary input file
    let input_path = temp_dir.path().join("input.txt");
    let mut input_file = File::create(&input_path)?;
    // Add frontmatter
    writeln!(input_file, "---")?;
    writeln!(input_file, "title: End-to-End Test Document")?;
    writeln!(input_file, "author: Integration Test")?;
    writeln!(input_file, "url: https://example.com/end-to-end")?;
    writeln!(input_file, "---")?;
    writeln!(input_file, "The quick, Brown fox jumps over the lazy dog.")?;
    writeln!(input_file, "The FOX is quick and the dog is lazy?")?;
    writeln!(input_file, "Quick brown foxes jump! 123 456")?;
    writeln!(input_file, "Ignore---these words ###")?;
    input_file.flush()?;

    // Create paths for the output files
    let output_path_no_scale_arg = temp_dir.path().join("output_no_scale_arg.json"); // For 10^k-1 scaling
    let output_path_d120 = temp_dir.path().join("output_d120.json"); // For --scale-d 120
    let output_path_d3 = temp_dir.path().join("output_d3.json"); // For --scale-d 3

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

    // Run CLI: no scaling args (default d=10)
    let status_no_scale_arg = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_no_scale_arg)
        .status()?;
    assert!(
        status_no_scale_arg.success(),
        "CLI command with no scaling args failed"
    );
    assert!(
        output_path_no_scale_arg.exists(),
        "output_no_scale_arg.json was not created"
    );

    // Run CLI: --scale-d 120
    let status_d120 = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_d120)
        .arg("--scale-d")
        .arg("120")
        .status()?;
    assert!(
        status_d120.success(),
        "CLI command with --scale-d 120 failed"
    );
    assert!(
        output_path_d120.exists(),
        "output_d120.json was not created"
    );

    // Run CLI: --scale-d 3
    let status_d3 = Command::new(&exe_path)
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_d3)
        .arg("--scale-d")
        .arg("3")
        .status()?;
    assert!(status_d3.success(), "CLI command with --scale-d 3 failed");
    assert!(output_path_d3.exists(), "output_d3.json was not created");

    // Parse the JSON outputs
    let json_no_scale_arg: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_no_scale_arg)?))?;
    let json_d120: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_d120)?))?;
    let json_d3: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_d3)?))?;

    // Verify structure and content
    assert!(
        json_no_scale_arg.is_object(),
        "JSON output (no_scale_arg) should be an object"
    );
    assert!(
        json_d120.is_object(),
        "JSON output (d120) should be an object"
    );
    assert!(json_d3.is_object(), "JSON output (d3) should be an object");

    // Check for metadata and data keys
    assert!(
        json_no_scale_arg.get("metadata").is_some(),
        "JSON output (no_scale_arg) should have metadata"
    );
    assert!(
        json_no_scale_arg.get("data").is_some(),
        "JSON output (no_scale_arg) should have data"
    );
    assert!(
        json_d120.get("metadata").is_some(),
        "JSON output (d120) should have metadata"
    );
    assert!(
        json_d120.get("data").is_some(),
        "JSON output (d120) should have data"
    );
    assert!(
        json_d3.get("metadata").is_some(),
        "JSON output (d3) should have metadata"
    );
    assert!(
        json_d3.get("data").is_some(),
        "JSON output (d3) should have data"
    );

    // Check metadata fields
    let metadata = json_no_scale_arg.get("metadata").unwrap();
    assert!(
        metadata.get("title").is_some(),
        "Metadata should have title"
    );
    assert!(
        metadata.get("author").is_some(),
        "Metadata should have author"
    );
    assert!(metadata.get("url").is_some(), "Metadata should have url");
    assert!(metadata.get("n").is_some(), "Metadata should have n");

    // --- Verification for N-gram structure, normalization, and filtering (using json_no_scale_arg as representative) ---
    // This part primarily checks tokenization, prefix/follower structure, sorting - which should be consistent.
    // Specific count values will be checked later for each scaling case.
    let mut found_prefix_the = false;
    let mut found_prefix_quick = false;
    let mut found_invalid_chars_word = false; // Flag if any word (prefix or follower) has invalid chars
    let mut the_followed_by_quick_count = 0;
    let mut _quick_followed_by_brown_count = 0;

    // Get the data array from the restructured JSON
    let _data_no_scale_arg = json_no_scale_arg.get("data").unwrap().as_array().unwrap();

    // Verify structure (each entry should be an array: [prefix_array, follower_pair, ...])
    // Using json_no_scale_arg for general structure checks
    let data_arr_no_scale = json_no_scale_arg.get("data").unwrap().as_array().unwrap();
    for entry in data_arr_no_scale {
        let entry_arr = entry.as_array().unwrap();
        assert!(
            entry_arr.len() >= 2,
            "Entry should have at least a prefix array and one follower pair: {:?}",
            entry
        );

        // Verify prefix string
        let prefix_val = &entry_arr[0];
        assert!(
            prefix_val.is_string(),
            "First element should be the prefix string: {:?}",
            prefix_val
        );

        let prefix_word = prefix_val.as_str().unwrap_or("");
        assert!(!prefix_word.is_empty(), "Prefix string should not be empty");

        // Check prefix word is valid (alphabetic with possible capitalization or punctuation)
        // We now preserve capitalization, so uppercase letters are allowed
        if prefix_word != "." && prefix_word != "," && 
           !prefix_word.chars().all(|c| c.is_alphabetic() || c == '\'') {
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
        let mut _prev_follower = String::new();
        for i in 2..entry_arr.len() {
            let follower_pair = &entry_arr[i];
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

            // Check follower word is valid (alphabetic with possible capitalization or punctuation)
            // We now preserve capitalization, so uppercase letters are allowed
            if follower_word != "." && follower_word != "," && 
               !follower_word.chars().all(|c| c.is_alphabetic() || c == '\'') {
                found_invalid_chars_word = true;
            }

            // No longer checking follower sorting order since it's now by count (largest to smallest)
            // and we don't have access to the counts directly in this test.
            // We'll just track the followers we've seen.
            _prev_follower = follower_word.to_string();

            // Count specific follow occurrences
            if prefix_word == "the" && follower_word == "quick" {
                the_followed_by_quick_count += follower_arr[1].as_u64().unwrap_or(0) as usize;
            }
            if prefix_word == "quick" && follower_word == "brown" {
                _quick_followed_by_brown_count += follower_arr[1].as_u64().unwrap_or(0) as usize;
            }
        }
    }

    // Verify overall prefix sorting (case-insensitive due to capitalization preservation)
    let mut prev_prefix: Option<String> = None;
    let data_arr = json_no_scale_arg.get("data").unwrap().as_array().unwrap();
    for entry in data_arr {
        let entry_arr = entry.as_array().unwrap();
        let current_prefix = entry_arr[0].as_str().unwrap_or("").to_string();

        if let Some(ref prev) = prev_prefix {
            // Use case-insensitive comparison since we now preserve capitalization
            let cmp = current_prefix.to_lowercase().cmp(&prev.to_lowercase());
            assert!(
                cmp != std::cmp::Ordering::Less,
                "Prefixes not sorted (case-insensitive): '{}' should come after '{}'",
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
        "Found word (prefix or follower) containing invalid characters (non-alphabetic except apostrophes)"
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
    // Check that "the" is followed by "quick" at least once
    assert!(
        the_followed_by_quick_count > 0,
        "Expected 'the' to be followed by 'quick' at least once"
    );

    // --- Test scaling for json_no_scale_arg (d=10 default) ---
    let data_arr_2 = json_no_scale_arg.get("data").unwrap().as_array().unwrap();
    for entry in data_arr_2 {
        let entry_arr = entry.as_array().unwrap();
        let prefix_str = entry_arr[0].as_str().unwrap_or("");
        let total_scaled = entry_arr[1].as_u64().unwrap_or(0);

        // Example: prefix "the", original total 4 -> d=10 default
        // followers: "dog" (1), "fox" (1), "lazy" (1), "quick" (1)
        // With d=10 (default): now uses 10^k-1 scaling to get [0, 9] range
        // Total count = 4, so scale to [0, 9]
        // Scaled with factor 9/4 = 2.25:
        // dog(1): round(1*2.25) = 2
        // fox(1): round(2*2.25) = 5 (4.5 rounds to 5)
        // lazy(1): round(3*2.25) = 7 (6.75 rounds to 7)
        // quick(1): round(4*2.25) = 9
        if prefix_str == "the" {
            assert_eq!(total_scaled, 9, "Prefix 'the' (no-scale-arg) total count");
            assert_eq!(entry_arr[2], serde_json::json!(["dog", 2]));
            assert_eq!(entry_arr[3], serde_json::json!(["fox", 5]));
            assert_eq!(entry_arr[4], serde_json::json!(["lazy", 7]));
            assert_eq!(entry_arr[5], serde_json::json!(["quick", 9]));
        }
        // Example: prefix "quick", with punctuation tokenization:
        // "quick, Brown" -> "quick" followed by ","
        // "Quick brown" -> "quick" followed by "brown"
        // "quick and" -> "quick" followed by "and"
        // So followers: "," (1), "brown" (1), "and" (1) -> total 3
        // With d=10 (default): now uses 10^k-1 scaling to get [0, 9] range
        // Total count = 3, so scale to [0, 9]
        // Scaled with factor 9/3 = 3:
        // ","(1): round(1*3) = 3
        // "and"(1): round(2*3) = 6
        // "brown"(1): round(3*3) = 9
        if prefix_str == "quick" {
            assert_eq!(total_scaled, 9, "Prefix 'quick' (no-scale-arg) total count");
            assert_eq!(entry_arr[2], serde_json::json!([",", 3]));
            assert_eq!(entry_arr[3], serde_json::json!(["and", 6]));
            assert_eq!(entry_arr[4], serde_json::json!(["brown", 9]));
        }
    }

    // --- Test scaling for json_d120 (--scale-d 120) ---
    let mut found_d120_scaling_the = false;
    let mut found_d120_scaling_quick = false;
    // Get the data array from the restructured JSON
    let data_d120 = json_d120.get("data").unwrap().as_array().unwrap();
    for entry in data_d120 {
        let entry_arr = entry.as_array().unwrap();
        let prefix_str = entry_arr[0].as_str().unwrap_or("");
        let total_scaled = entry_arr[1].as_u64().unwrap_or(0);
        let num_followers_in_json = entry_arr.len() - 2;

        // Debug line no longer needed
        // println!("DEBUG Entry for '{}': {:?}", prefix_str, entry);

        if num_followers_in_json == 0 {
            continue;
        } // Skip if no followers

        let last_follower_pair = entry_arr.last().unwrap().as_array().unwrap();
        let last_follower_cumulative = last_follower_pair[1].as_u64().unwrap();

        if prefix_str == "the" {
            // 4 unique followers, original total 4. Scales to [1,120]
            assert_eq!(total_scaled, 120, "Prefix 'the' (d120) total count");
            assert_eq!(
                last_follower_cumulative, 120,
                "Prefix 'the' (d120) last follower cumulative"
            );
            // Followers are sorted: dog, fox, lazy, quick
            assert_eq!(entry_arr[2], serde_json::json!(["dog", 30]));
            assert_eq!(entry_arr[3], serde_json::json!(["fox", 60]));
            assert_eq!(entry_arr[4], serde_json::json!(["lazy", 90]));
            assert_eq!(entry_arr[5], serde_json::json!(["quick", 120]));
            found_d120_scaling_the = true;
        }
        if prefix_str == "quick" {
            // 2 unique followers, original total 3. Scales to [1,120]
            assert_eq!(total_scaled, 120, "Prefix 'quick' (d120) total count");
            assert_eq!(
                last_follower_cumulative, 120,
                "Prefix 'quick' (d120) last follower cumulative"
            );
            // Followers are now sorted by count (all equal), then alphabetical
            // With punctuation: "," (1), "brown" (1), "and" (1)
            // Total 3 followers, scaled to [1, 120]
            // Expected: ["quick", 120, [",", 40], ["and", 80], ["brown", 120]]
            assert_eq!(entry_arr[2], serde_json::json!([",", 40]));
            assert_eq!(entry_arr[3], serde_json::json!(["and", 80]));
            assert_eq!(entry_arr[4], serde_json::json!(["brown", 120]));
            found_d120_scaling_quick = true;
        }
        // Check strictly increasing property for [1,d] scaling
        if total_scaled == 120 && num_followers_in_json > 0 {
            // Assuming 120 implies [1,d] scaling for this test data
            let mut prev_cumulative = 0;
            for i in 2..entry_arr.len() {
                let follower_arr = entry_arr[i].as_array().unwrap();
                let current_cumulative = follower_arr[1].as_u64().unwrap();
                assert!(
                    current_cumulative > prev_cumulative,
                    "Cumulative counts not strictly increasing for {}: {} !> {}",
                    prefix_str,
                    current_cumulative,
                    prev_cumulative
                );
                if i < entry_arr.len() - 1 {
                    // Not the last element
                    assert!(
                        current_cumulative < total_scaled,
                        "Intermediate cumulative count {} must be < total {} for {}",
                        current_cumulative,
                        total_scaled,
                        prefix_str
                    );
                }
                prev_cumulative = current_cumulative;
            }
        }
    }
    assert!(
        found_d120_scaling_the,
        "Did not find and verify 'the' prefix for d120 scaling"
    );
    assert!(
        found_d120_scaling_quick,
        "Did not find and verify 'quick' prefix for d120 scaling"
    );

    // --- Test scaling for json_d3 (--scale-d 3) ---
    let mut found_d3_scaling_the_as_10k = false;
    let mut found_d3_scaling_quick_as_d3 = false;
    // Get the data array from the restructured JSON
    let data_d3 = json_d3.get("data").unwrap().as_array().unwrap();
    for entry in data_d3 {
        let entry_arr = entry.as_array().unwrap();
        let prefix_str = entry_arr[0].as_str().unwrap_or("");
        let total_scaled = entry_arr[1].as_u64().unwrap_or(0);
        let num_followers_in_json = entry_arr.len() - 2;

        if num_followers_in_json == 0 {
            continue;
        }

        let last_follower_pair = entry_arr.last().unwrap().as_array().unwrap();
        let last_follower_cumulative = last_follower_pair[1].as_u64().unwrap();

        if prefix_str == "the" {
            // 4 unique followers > 3. Scales to 10^k-1 (total 9)
            assert_eq!(
                total_scaled, 9,
                "Prefix 'the' (d3) total count (should be 10^k-1)"
            );
            assert_eq!(
                last_follower_cumulative, 9,
                "Prefix 'the' (d3) last follower cumulative"
            );
            assert_eq!(entry_arr[2], serde_json::json!(["dog", 2]));
            assert_eq!(entry_arr[3], serde_json::json!(["fox", 5]));
            assert_eq!(entry_arr[4], serde_json::json!(["lazy", 7]));
            assert_eq!(entry_arr[5], serde_json::json!(["quick", 9]));
            found_d3_scaling_the_as_10k = true;
        }
        if prefix_str == "quick" {
            // 2 unique followers <= 3. Scales to [1,3]
            assert_eq!(total_scaled, 3, "Prefix 'quick' (d3) total count");
            assert_eq!(
                last_follower_cumulative, 3,
                "Prefix 'quick' (d3) last follower cumulative"
            );
            // Followers are now sorted by count (all equal), then alphabetical
            // With punctuation: "," (1), "brown" (1), "and" (1)
            // Total 3 followers, scaled to [1, 3]
            // Expected: ["quick", 3, [",", 1], ["and", 2], ["brown", 3]]
            assert_eq!(entry_arr[2], serde_json::json!([",", 1]));
            assert_eq!(entry_arr[3], serde_json::json!(["and", 2]));
            assert_eq!(entry_arr[4], serde_json::json!(["brown", 3]));
            found_d3_scaling_quick_as_d3 = true;
        }
    }
    assert!(
        found_d3_scaling_the_as_10k,
        "Did not find and verify 'the' prefix for d3 (10^k-1) scaling"
    );
    assert!(
        found_d3_scaling_quick_as_d3,
        "Did not find and verify 'quick' prefix for d3 ([1,3]) scaling"
    );

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
