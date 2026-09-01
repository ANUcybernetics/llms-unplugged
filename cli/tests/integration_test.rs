use llms_unplugged::DEFAULT_PUNCTUATION;
use std::fs::File;
use std::io::{self, BufReader, Write};
use std::path::Path;
use std::process::Command;
use tempfile::TempDir;

/// Path to the compiled CLI binary. Cargo guarantees it exists and points at
/// the right target dir (including cross-target builds), so tests never need
/// to locate it by hand or silently skip.
fn cli_exe() -> &'static Path {
    Path::new(env!("CARGO_BIN_EXE_llms_unplugged"))
}

fn typst_available() -> bool {
    Command::new("typst").arg("--version").output().is_ok()
}

fn is_punct_token(token: &str) -> bool {
    let mut chars = token.chars();
    match (chars.next(), chars.next()) {
        (Some(c), None) => DEFAULT_PUNCTUATION.contains(c),
        _ => false,
    }
}

/// Run the `pdf` subcommand from a temp dir with no `--template`: the default
/// template must resolve relative to the crate (not the cwd), and an out-dir
/// outside the template's directory must work. Both were real bugs.
fn run_pdf_subcommand_test(n: usize, temp_dir: &TempDir) -> io::Result<()> {
    let input_path = temp_dir.path().join(format!("input_n{n}.txt"));
    {
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "title: Test Document for n={n}")?;
        writeln!(input_file, "author: Integration Test")?;
        writeln!(input_file, "url: https://example.com/test{n}")?;
        writeln!(input_file, "---")?;
        writeln!(input_file, "Test line for n={n}.")?;
        writeln!(input_file, "Another test line. Quick brown fox.")?;
        input_file.flush()?;
    }

    let output = Command::new(cli_exe())
        .arg("pdf")
        .arg("--input")
        .arg(&input_path)
        .arg("--n")
        .arg(n.to_string())
        .arg("--out-dir")
        .arg(temp_dir.path().join("out"))
        .current_dir(temp_dir.path())
        .output()?;

    assert!(
        output.status.success(),
        "pdf subcommand failed for n={}. Stderr:\n{}",
        n,
        String::from_utf8_lossy(&output.stderr)
    );

    let pdf_path = temp_dir
        .path()
        .join("out")
        .join("pdf")
        .join(format!("input_n{n}.pdf"));
    assert!(
        pdf_path.exists(),
        "PDF was not created at {} for n={n}",
        pdf_path.display()
    );

    Ok(())
}

#[test]
fn test_frontmatter_errors() -> io::Result<()> {
    // Create a temporary directory
    let temp_dir = TempDir::new()?;
    let exe_path = cli_exe();

    // Test 1: Missing frontmatter completely
    {
        let input_path = temp_dir.path().join("missing_frontmatter.txt");
        let mut input_file = File::create(&input_path)?;
        writeln!(input_file, "This file has no frontmatter at all.")?;
        writeln!(input_file, "The program should exit with an error.")?;
        input_file.flush()?;

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        // With the new implementation, missing frontmatter should fail
        assert!(
            !output.status.success(),
            "CLI should fail with missing frontmatter"
        );

        // Error output should contain error about missing frontmatter
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Input must start with '---'"),
            "Should output error about missing frontmatter: {stderr_message}"
        );

        // Error message should include instructions
        assert!(
            stderr_message.contains("must begin with valid YAML frontmatter"),
            "Should include instructions about frontmatter format: {stderr_message}"
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

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        // Should fail with error
        assert!(
            !output.status.success(),
            "CLI should fail with missing title"
        );

        // Error message should mention missing fields
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Frontmatter missing required field 'title'."),
            "Should error about missing title: {stderr_message}"
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

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        // Should fail with error
        assert!(
            !output.status.success(),
            "CLI should fail with missing author"
        );

        // Error message should mention missing fields
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Frontmatter missing required field 'author'."),
            "Should error about missing author: {stderr_message}"
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
        writeln!(input_file, "This file has no url field.")?;
        input_file.flush()?;

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        // `url` is optional: the booklet cites it only when present.
        assert!(
            output.status.success(),
            "CLI should accept frontmatter without a url: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    // Test 4b: Not UTF-8 (a Latin-1 file) is an encoding error, not a
    // frontmatter one, so it must not print the frontmatter help.
    {
        let input_path = temp_dir.path().join("latin1.txt");
        std::fs::write(
            &input_path,
            b"---\ntitle: T\nauthor: A\nurl: https://x\n---\ncaf\xe9 au lait.\n",
        )?;

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        assert!(
            !output.status.success(),
            "CLI should fail on non-UTF-8 input"
        );
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("not valid UTF-8"),
            "Should report the encoding problem: {stderr_message}"
        );
        assert!(
            !stderr_message.contains("must begin with valid YAML frontmatter"),
            "Encoding errors must not be blamed on the frontmatter: {stderr_message}"
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

        let output = Command::new(exe_path)
            .arg("build")
            .arg("--input")
            .arg(&input_path)
            .output()?;

        // Should fail
        assert!(
            !output.status.success(),
            "CLI should fail with malformed YAML"
        );

        // Error message should be meaningful
        let stderr_message = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr_message.contains("Error"),
            "Should output error message for malformed frontmatter: {stderr_message}"
        );

        // Should provide guidance
        assert!(
            stderr_message.contains("frontmatter"),
            "Error should mention frontmatter: {stderr_message}"
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
    let exe_path = cli_exe();

    // Run with --raw flag
    let status_raw = Command::new(exe_path)
        .arg("build")
        .arg("--input")
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_raw)
        .arg("--raw")
        .status()?;
    assert!(status_raw.success(), "CLI command with --raw failed");
    assert!(output_path_raw.exists(), "Raw output file was not created");

    // Run without --raw flag (default scaling)
    let status_scaled = Command::new(exe_path)
        .arg("build")
        .arg("--input")
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path_scaled)
        .status()?;
    assert!(status_scaled.success(), "CLI command without --raw failed");
    assert!(
        output_path_scaled.exists(),
        "Scaled output file was not created"
    );

    // Parse JSON outputs
    let json_raw: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_raw)?))?;
    let json_scaled: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path_scaled)?))?;

    // Get data arrays
    let data_raw = json_raw.get("data").unwrap().as_array().unwrap();
    let data_scaled = json_scaled.get("data").unwrap().as_array().unwrap();

    // Find "The" previous-word in both outputs (capitalised because it appears consistently)
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
    assert_eq!(
        the_raw_total,
        Some(3),
        "Raw output should have actual count"
    );
    assert_ne!(
        the_raw_total, the_scaled_total,
        "Raw and scaled totals should differ"
    );

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

    let exe_path = cli_exe();

    // Test that mutually exclusive flags for pdf are rejected (--json-only + --pdf-only)
    let output = Command::new(exe_path)
        .arg("pdf")
        .arg("--input")
        .arg(&input_path)
        .arg("--pdf-only")
        .arg("--json-only")
        .output()?;

    assert!(
        !output.status.success(),
        "CLI should fail when both --pdf-only and --json-only are provided"
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

    // Create path for the output file
    let output_path = temp_dir.path().join("output.json"); // For default d10 scaling
    let exe_path = cli_exe();

    // Run CLI with default d10 scaling
    let status = Command::new(exe_path)
        .arg("build")
        .arg("--input")
        .arg(&input_path)
        .arg("-o")
        .arg(&output_path)
        .status()?;
    assert!(status.success(), "CLI command failed");
    assert!(output_path.exists(), "output.json was not created");

    // Parse the JSON output
    let json_output: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(&output_path)?))?;

    // Verify structure and content
    assert!(json_output.is_object(), "JSON output should be an object");

    // Check for metadata and data keys
    assert!(
        json_output.get("metadata").is_some(),
        "JSON output should have metadata"
    );
    assert!(
        json_output.get("data").is_some(),
        "JSON output should have data"
    );

    // Check metadata fields
    let metadata = json_output.get("metadata").unwrap();
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

    // --- Verification for N-gram structure, normalization, and filtering (using json_output as representative) ---
    // This part primarily checks tokenization, previous-word/next-word structure, sorting - which should be consistent.
    // Specific count values will be checked later for each scaling case.
    let mut found_previous_word_the = false;
    let mut found_previous_word_quick = false;
    let mut found_invalid_chars_word = false; // Flag if any word (previous or next) has invalid chars
    let mut the_followed_by_quick_count = 0;
    let mut _quick_followed_by_brown_count = 0;

    // Get the data array from the restructured JSON
    let _data_no_scale_arg = json_output.get("data").unwrap().as_array().unwrap();

    // Verify structure (each entry should be an array: [previous_words_array, next_word_pair, ...])
    // Using json_output for general structure checks
    let data_arr_no_scale = json_output.get("data").unwrap().as_array().unwrap();
    for entry in data_arr_no_scale {
        let entry_arr = entry.as_array().unwrap();
        assert!(
            entry_arr.len() >= 2,
            "Entry should have at least a previous-words array and one next-word pair: {entry:?}"
        );

        // Verify previous-words string
        let previous_word_val = &entry_arr[0];
        assert!(
            previous_word_val.is_string(),
            "First element should be the previous-words string: {previous_word_val:?}"
        );

        let previous_word = previous_word_val.as_str().unwrap_or("");
        assert!(
            !previous_word.is_empty(),
            "Previous-words string should not be empty"
        );

        // Check previous word is valid (alphabetic with possible capitalization or
        // a single-character punctuation token from the default kept set).
        if !is_punct_token(previous_word)
            && !previous_word
                .chars()
                .all(|c| c.is_alphabetic() || c == '\'')
        {
            found_invalid_chars_word = true;
        }

        // Track specific previous-words
        if previous_word == "the" {
            found_previous_word_the = true;
        }
        if previous_word == "quick" {
            found_previous_word_quick = true;
        }

        // Verify the second element is the total count
        let total_count_val = &entry[1];
        assert!(
            total_count_val.is_number(),
            "Second element should be the total count: {total_count_val:?}"
        );

        // Check next-word pairs (starting from index 2 now that we have total count as second element)
        let mut _prev_next_word = String::new();
        for next_word_pair in entry_arr.iter().skip(2) {
            assert!(
                next_word_pair.is_array(),
                "Next-word entry should be an array [word, count]: {next_word_pair:?}"
            );
            let next_word_arr = next_word_pair.as_array().unwrap();
            assert_eq!(
                next_word_arr.len(),
                2,
                "Next-word pair should have 2 elements [word, count]: {next_word_arr:?}"
            );

            let next_word = next_word_arr[0].as_str().unwrap_or("");
            assert!(!next_word.is_empty(), "Next word should not be empty");
            assert!(
                next_word_arr[1].is_number(),
                "Next-word count should be a number: {:?}",
                next_word_arr[1]
            );

            // Check next word is valid (alphabetic with possible capitalization or
            // a single-character punctuation token from the default kept set).
            if !is_punct_token(next_word)
                && !next_word.chars().all(|c| c.is_alphabetic() || c == '\'')
            {
                found_invalid_chars_word = true;
            }

            // No longer checking next-word sorting order since it's now by count (largest to smallest)
            // and we don't have access to the counts directly in this test.
            // We'll just track the next-words we've seen.
            _prev_next_word = next_word.to_string();

            // Count specific follow occurrences
            if previous_word == "the" && next_word == "quick" {
                the_followed_by_quick_count += next_word_arr[1].as_u64().unwrap_or(0) as usize;
            }
            if previous_word == "quick" && next_word == "brown" {
                _quick_followed_by_brown_count += next_word_arr[1].as_u64().unwrap_or(0) as usize;
            }
        }
    }

    // Verify overall previous-words sorting (case-insensitive due to capitalization preservation)
    let mut prev_previous_word: Option<String> = None;
    let data_arr = json_output.get("data").unwrap().as_array().unwrap();
    for entry in data_arr {
        let entry_arr = entry.as_array().unwrap();
        let current_previous_word = entry_arr[0].as_str().unwrap_or("").to_string();

        if let Some(ref prev) = prev_previous_word {
            // Use case-insensitive comparison since we now preserve capitalization
            let cmp = current_previous_word
                .to_lowercase()
                .cmp(&prev.to_lowercase());
            assert!(
                cmp != std::cmp::Ordering::Less,
                "Previous-words not sorted (case-insensitive): '{current_previous_word}' should come after '{prev}'"
            );
        }
        prev_previous_word = Some(current_previous_word);
    }

    // --- Final assertions for normalization/filtering and counts ---
    assert!(found_previous_word_the, "Previous-word 'the' not found");
    assert!(
        found_previous_word_quick,
        "Previous-word 'quick' (from 'quick'/'Quick') not found"
    );
    assert!(
        !found_invalid_chars_word,
        "Found word (previous or next) containing invalid characters (non-alphabetic except apostrophes)"
    );

    // Based on input:
    // "the quick" -> count 1 (cumulative)
    // "the fox" -> count 1 (cumulative)
    // "the dog" -> count 1 (cumulative)
    // "the lazy" -> count 1 (cumulative)
    // "quick brown" -> count 2 (from "quick, Brown" and "Quick brown") (cumulative)
    assert!(
        the_followed_by_quick_count >= 1,
        "Expected previous-word 'the' to be followed by 'quick' at least once, found {the_followed_by_quick_count}"
    );
    // Check that "the" is followed by "quick" at least once
    assert!(
        the_followed_by_quick_count > 0,
        "Expected 'the' to be followed by 'quick' at least once"
    );

    // --- Test scaling for json_output (d=10 default) ---
    let data_arr_2 = json_output.get("data").unwrap().as_array().unwrap();
    for entry in data_arr_2 {
        let entry_arr = entry.as_array().unwrap();
        let previous_word_str = entry_arr[0].as_str().unwrap_or("");
        let total_scaled = entry_arr[1].as_u64().unwrap_or(0);

        // Example: previous-word "the", original total 4 -> d=10 default
        // next-words: "dog" (1), "fox" (1), "lazy" (1), "quick" (1)
        // With d=10 (default): the four options share the ten faces 0-9
        // Total count = 4, so the factor is 10/4 = 2.5 and each stored
        // number is the last face of that word's band:
        // dog(1): round(1*2.5) - 1 = 2
        // fox(1): round(2*2.5) - 1 = 4
        // lazy(1): round(3*2.5) - 1 = 7 (7.5 rounds to 8)
        // quick(1): round(4*2.5) - 1 = 9
        if previous_word_str == "the" {
            assert_eq!(
                total_scaled, 9,
                "Previous-word 'the' (no-scale-arg) total count"
            );
            assert_eq!(entry_arr[2], serde_json::json!(["dog", 2]));
            assert_eq!(entry_arr[3], serde_json::json!(["fox", 4]));
            assert_eq!(entry_arr[4], serde_json::json!(["lazy", 7]));
            assert_eq!(entry_arr[5], serde_json::json!(["quick", 9]));
        }
        // Example: previous-word "quick", with punctuation tokenization:
        // "quick, Brown" -> "quick" followed by ","
        // "Quick brown" -> "quick" followed by "brown"
        // "quick and" -> "quick" followed by "and"
        // So next-words: "," (1), "brown" (1), "and" (1) -> total 3
        // With d=10 (default): the three options share the ten faces 0-9
        // Total count = 3, so the factor is 10/3 and each stored number is
        // the last face of that word's band:
        // ","(1): round(1*3.33) - 1 = 2
        // "and"(1): round(2*3.33) - 1 = 6
        // "brown"(1): round(3*3.33) - 1 = 9
        if previous_word_str == "quick" {
            assert_eq!(
                total_scaled, 9,
                "Previous-word 'quick' (no-scale-arg) total count"
            );
            assert_eq!(entry_arr[2], serde_json::json!([",", 2]));
            assert_eq!(entry_arr[3], serde_json::json!(["and", 6]));
            assert_eq!(entry_arr[4], serde_json::json!(["brown", 9]));
        }
    }

    Ok(())
}

// End-to-end test: pdf subcommand from an arbitrary cwd through to a typeset PDF
#[test]
fn test_pdf_subcommand_end_to_end() -> io::Result<()> {
    if !typst_available() {
        eprintln!("Skipping test_pdf_subcommand_end_to_end: 'typst' not found in PATH.");
        return Ok(());
    }

    let temp_dir = TempDir::new()?;
    run_pdf_subcommand_test(2, &temp_dir)?;
    run_pdf_subcommand_test(3, &temp_dir)?;
    Ok(())
}

#[test]
fn test_tsv_writes_clean_stdout_and_no_stray_files() -> io::Result<()> {
    let temp = TempDir::new()?;
    let input = write_sample_corpus(temp.path(), "corpus.txt", "the cat sat. the cat ran.")?;

    let out = Command::new(cli_exe())
        .arg("tsv")
        .arg("-i")
        .arg(&input)
        .current_dir(temp.path())
        .output()?;

    assert!(out.status.success(), "tsv failed: {out:?}");
    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(
        stdout.starts_with('\t'),
        "stdout must start with the TSV header row, got: {:?}",
        &stdout[..stdout.len().min(80)]
    );
    assert!(
        !stdout.contains("Successfully"),
        "status chatter leaked into the TSV stream: {stdout:?}"
    );
    assert!(
        !temp.path().join("tsv-output.json").exists(),
        "tsv must not write a stray JSON file to the cwd"
    );
    Ok(())
}

fn write_sample_corpus(dir: &Path, name: &str, body: &str) -> io::Result<std::path::PathBuf> {
    let path = dir.join(name);
    let mut f = File::create(&path)?;
    writeln!(f, "---")?;
    writeln!(f, "title: Sample CLI test")?;
    writeln!(f, "author: Tests")?;
    writeln!(f, "url: https://example.com")?;
    writeln!(f, "---")?;
    writeln!(f, "{body}")?;
    f.flush()?;
    Ok(path)
}

#[test]
fn test_sample_cli_deterministic_with_seed() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        // Cyclic corpus so an 8-token seeded walk never dead-ends on any rand
        // sampling path (robust across rand versions).
        "the cat the dog the bird the cat the dog the bird the cat the dog the bird",
    )?;

    let run = || {
        Command::new(exe)
            .arg("sample")
            .arg("-i")
            .arg(&input)
            .arg("-p")
            .arg("the")
            .arg("-t")
            .arg("8")
            .arg("--seed")
            .arg("12345")
            .output()
    };

    let a = run()?;
    let b = run()?;
    assert!(a.status.success(), "first run failed: {a:?}");
    assert!(b.status.success(), "second run failed: {b:?}");
    assert_eq!(a.stdout, b.stdout, "same seed should give same output");

    let out = String::from_utf8_lossy(&a.stdout);
    assert!(
        out.starts_with("the "),
        "output should begin with prompt: {out:?}"
    );
    Ok(())
}

#[test]
fn test_sample_cli_prompt_normalises_case() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    // Canonical form will be lowercase "the" since it dominates.
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "the cat sat. The cat sat. the dog ran. the bird flew.",
    )?;

    let out = Command::new(exe)
        .arg("sample")
        .arg("-i")
        .arg(&input)
        .arg("-p")
        .arg("THE")
        .arg("-t")
        .arg("3")
        .arg("--seed")
        .arg("1")
        .output()?;
    assert!(out.status.success(), "sample failed: {out:?}");

    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(
        stdout.starts_with("the "),
        "uppercase prompt should normalise to canonical `the`: {stdout:?}"
    );
    Ok(())
}

#[test]
fn test_sample_cli_unknown_prompt_errors() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "alpha beta gamma alpha beta delta",
    )?;

    let out = Command::new(exe)
        .arg("sample")
        .arg("-i")
        .arg(&input)
        .arg("-p")
        .arg("notintexttatall")
        .arg("-t")
        .arg("5")
        .output()?;
    assert!(!out.status.success(), "unknown prompt should fail");
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert!(
        stderr.contains("prompt context not found"),
        "expected prompt-context-not-found error: {stderr}"
    );
    Ok(())
}

#[test]
fn test_sample_cli_dead_end_prints_partial_then_errors() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    // "gamma" has no successor: sampling from "alpha" for 5 tokens must dead-end.
    let input = write_sample_corpus(temp.path(), "corpus.txt", "alpha beta gamma")?;

    let out = Command::new(exe)
        .arg("sample")
        .arg("-i")
        .arg(&input)
        .arg("-p")
        .arg("alpha")
        .arg("-t")
        .arg("5")
        .arg("--seed")
        .arg("0")
        .output()?;

    assert!(!out.status.success(), "dead-end should exit non-zero");
    let stdout = String::from_utf8_lossy(&out.stdout);
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert_eq!(
        stdout.trim(),
        "alpha beta gamma",
        "should print partial output"
    );
    assert!(
        stderr.contains("dead-end"),
        "should report dead-end on stderr: {stderr}"
    );
    Ok(())
}

/// Every cutout in the corpus must land on exactly one sheet: the room's
/// entries together are the model, so a deal that dropped or duplicated
/// entries would silently distort the distribution the class samples from.
#[test]
fn test_sheets_cli_partitions_corpus_across_sheets() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "the cat sat on the mat and the cat ate the rat then the cat sat again",
    )?;
    let out_dir = temp.path().join("out");

    let output = Command::new(exe)
        .arg("sheets")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("4")
        .arg("--seed")
        .arg("99")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "sheets failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("sheets.json"))?))?;
    let sheets = json["sheets"].as_array().expect("sheets array");
    assert_eq!(sheets.len(), 4);

    // Bigram cutouts, so every entry carries exactly one previous word, and
    // the total is one short of the token count (the first token has no
    // context and so can never be matched).
    let mut dealt: Vec<String> = Vec::new();
    for sheet in sheets {
        for entry in sheet.as_array().expect("sheet array") {
            let prev = entry["previous_words"].as_array().expect("previous_words");
            assert_eq!(prev.len(), 1, "bigram entries carry one previous word");
            dealt.push(format!(
                "{} {}",
                prev[0].as_str().unwrap(),
                entry["text"].as_str().unwrap()
            ));
        }
    }

    let total_tokens = json["metadata"]["total_tokens"].as_u64().unwrap() as usize;
    assert_eq!(dealt.len(), total_tokens - 1);

    // Sheets are balanced to within one entry, so no participant is left
    // scanning twice as much paper as their neighbour.
    let sizes: Vec<usize> = sheets.iter().map(|s| s.as_array().unwrap().len()).collect();
    let (min, max) = (sizes.iter().min().unwrap(), sizes.iter().max().unwrap());
    assert!(max - min <= 1, "unbalanced sheets: {sizes:?}");

    // "the" is the corpus's hot context, with five entries across four sheets.
    // A participant holding two of them can still only answer with one, so the
    // deal has to spread the context as thinly as it will go: every sheet gets
    // one, and the unavoidable fifth makes exactly one sheet hold two.
    let per_sheet: Vec<usize> = sheets
        .iter()
        .map(|sheet| {
            sheet
                .as_array()
                .unwrap()
                .iter()
                .filter(|e| e["previous_words"][0] == "the")
                .count()
        })
        .collect();
    assert_eq!(
        per_sheet.iter().filter(|&&c| c > 0).count(),
        4,
        "every sheet should be able to answer 'the': {per_sheet:?}"
    );
    assert_eq!(
        *per_sheet.iter().max().unwrap(),
        2,
        "a hot context should spread to the ceil(k/sheets) floor: {per_sheet:?}"
    );

    Ok(())
}

#[test]
fn test_sheets_cli_preserves_repeated_input_boundaries() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let first = write_sample_corpus(temp.path(), "first.txt", "alpha beta")?;
    let second = write_sample_corpus(temp.path(), "second.txt", "gamma delta")?;
    let out_dir = temp.path().join("out");

    let output = Command::new(exe)
        .arg("sheets")
        .arg("--input")
        .arg(&first)
        .arg("--input")
        .arg(&second)
        .arg("--sheets")
        .arg("1")
        .arg("--title")
        .arg("Hidden sources")
        .arg("--author")
        .arg("Two authors")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "sheets failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("sheets.json"))?))?;
    let mut pairs = json["sheets"][0]
        .as_array()
        .unwrap()
        .iter()
        .map(|entry| {
            format!(
                "{} {}",
                entry["previous_words"][0].as_str().unwrap(),
                entry["text"].as_str().unwrap()
            )
        })
        .collect::<Vec<_>>();
    pairs.sort();

    assert_eq!(pairs, ["alpha beta", "gamma delta"]);
    assert_eq!(json["metadata"]["total_tokens"], 4);
    assert_eq!(json["metadata"]["title"], "Hidden sources");
    assert_eq!(json["metadata"]["author"], "Two authors");
    // The brief prints a paragraph about generation crossing between texts, and
    // this count is the only thing that tells it to. A --title override hides
    // the joined titles, so the count cannot be recovered from them.
    assert_eq!(json["metadata"]["documents"], 2);
    Ok(())
}

#[test]
fn test_sheets_cli_reports_one_document_for_a_single_input() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let only = write_sample_corpus(temp.path(), "only.txt", "alpha beta gamma")?;
    let out_dir = temp.path().join("out");

    let output = Command::new(exe)
        .arg("sheets")
        .arg("--input")
        .arg(&only)
        .arg("--sheets")
        .arg("1")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "sheets failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("sheets.json"))?))?;
    assert_eq!(json["metadata"]["documents"], 1);
    Ok(())
}

#[test]
fn test_sheets_cli_is_deterministic_with_seed() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "the cat the dog the bird the cat the dog the bird the cat the dog",
    )?;

    let run = |dir: &str, seed: &str| -> io::Result<String> {
        let out_dir = temp.path().join(dir);
        let output = Command::new(exe)
            .arg("sheets")
            .arg("-i")
            .arg(&input)
            .arg("--sheets")
            .arg("3")
            .arg("--seed")
            .arg(seed)
            .arg("--json-only")
            .arg("--output")
            .arg(&out_dir)
            .output()?;
        assert!(output.status.success(), "sheets failed: {output:?}");
        std::fs::read_to_string(out_dir.join("sheets.json"))
    };

    assert_eq!(run("a", "7")?, run("b", "7")?, "same seed, same deal");
    assert_ne!(
        run("c", "8")?,
        run("a", "7")?,
        "different seed, different deal"
    );
    Ok(())
}

/// The sorted variant is the "now organise your data" round: each sheet must
/// come out ordered by context so it reads as a lookup table.
#[test]
fn test_sheets_cli_sort_orders_each_sheet_by_context() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "zebra apple mango zebra kiwi apple pear mango cherry kiwi lemon pear",
    )?;
    let out_dir = temp.path().join("out");

    let output = Command::new(exe)
        .arg("sheets")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("2")
        .arg("--seed")
        .arg("1")
        .arg("--sort")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "sheets failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("sheets.json"))?))?;
    for sheet in json["sheets"].as_array().expect("sheets array") {
        let contexts: Vec<String> = sheet
            .as_array()
            .unwrap()
            .iter()
            .map(|e| e["previous_words"][0].as_str().unwrap().to_string())
            .collect();
        let mut sorted = contexts.clone();
        sorted.sort();
        assert_eq!(contexts, sorted, "--sort should order the sheet by context");
    }
    Ok(())
}

#[test]
fn test_sheets_cli_rejects_zero_sheets() -> io::Result<()> {
    let exe = cli_exe();
    let temp = TempDir::new()?;
    let input = write_sample_corpus(temp.path(), "corpus.txt", "alpha beta gamma")?;

    let output = Command::new(exe)
        .arg("sheets")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("0")
        .arg("--json-only")
        .output()?;

    assert!(!output.status.success(), "--sheets 0 should exit non-zero");
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("--sheets must be at least 1"),
        "should explain the constraint"
    );
    Ok(())
}

/// End-to-end through typst: one page per participant plus the teacher brief.
#[test]
fn test_sheets_subcommand_end_to_end() -> io::Result<()> {
    if !typst_available() {
        eprintln!("Skipping test_sheets_subcommand_end_to_end: 'typst' not found in PATH.");
        return Ok(());
    }

    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "the cat sat on the mat and the cat ate the rat then the cat sat again \
         while the dog watched the cat and the rat ran past the mat",
    )?;
    let out_dir = temp.path().join("out");

    let output = Command::new(cli_exe())
        .arg("sheets")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("3")
        .arg("--seed")
        .arg("42")
        .arg("--output")
        .arg(&out_dir)
        .output()?;

    assert!(
        output.status.success(),
        "sheets end-to-end failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(out_dir.join("sheets.pdf").exists(), "no PDF written");
    assert!(
        out_dir.join("sheets.pdf").metadata()?.len() > 1000,
        "PDF looks empty"
    );
    Ok(())
}

/// The ledger deal: every prefix on exactly one sheet, sheets in alphabetical
/// runs with their range in the JSON, followers in first-appearance order.
#[test]
fn test_ledger_cli_deals_prefixes_alphabetically() -> io::Result<()> {
    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "see spot run . see spot jump . run , spot , run . jump , spot , jump .",
    )?;
    let out_dir = temp.path().join("out");

    let output = Command::new(cli_exe())
        .arg("ledger")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("2")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "ledger failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("ledger.json"))?))?;
    assert_eq!(json["columns"], 4);
    assert_eq!(json["rows_per_page"], 12);
    assert_eq!(json["title"], "Sample CLI test");
    assert_eq!(json["metadata"]["title"], "Sample CLI test");

    let sheets = json["sheets"].as_array().expect("sheets array");
    assert_eq!(sheets.len(), 2);
    let entries: Vec<&serde_json::Value> = sheets
        .iter()
        .flat_map(|s| s["pages"].as_array().unwrap())
        .flat_map(|p| p.as_array().unwrap())
        .collect();
    let prefixes: Vec<&str> = entries
        .iter()
        .map(|e| e["prefix"][0].as_str().unwrap())
        .collect();
    assert_eq!(prefixes, vec![",", ".", "jump", "run", "see", "spot"]);

    // The range is the first and last prefix of each sheet's run.
    assert_eq!(sheets[0]["range"][0][0], prefixes[0]);
    let first_len = sheets[0]["pages"][0].as_array().unwrap().len();
    assert_eq!(sheets[0]["range"][1][0], prefixes[first_len - 1]);
    assert_eq!(sheets[1]["range"][1][0], "spot");

    // "spot" is followed by run, then jump, then "," --- in that order.
    let spot = entries.iter().find(|e| e["prefix"][0] == "spot").unwrap();
    let followers: Vec<(&str, u64)> = spot["followers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| (f["text"].as_str().unwrap(), f["count"].as_u64().unwrap()))
        .collect();
    assert_eq!(followers, vec![("run", 1), ("jump", 1), (",", 2)]);
    Ok(())
}

#[test]
fn test_ledger_cli_blank_sheets_need_no_corpus() -> io::Result<()> {
    let temp = TempDir::new()?;
    let out_dir = temp.path().join("out");

    let output = Command::new(cli_exe())
        .arg("ledger")
        .arg("--blank")
        .arg("--sheets")
        .arg("3")
        .arg("--title")
        .arg("Our story")
        .arg("--json-only")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "ledger --blank failed: {output:?}");

    let json: serde_json::Value =
        serde_json::from_reader(BufReader::new(File::open(out_dir.join("ledger.json"))?))?;
    assert_eq!(json["title"], "Our story");
    assert!(
        json.get("metadata").is_none(),
        "blank sheets carry no corpus"
    );
    let sheets = json["sheets"].as_array().unwrap();
    assert_eq!(sheets.len(), 3);
    assert!(
        sheets
            .iter()
            .all(|s| s["range"].is_null() && s["pages"] == serde_json::json!([[]]))
    );

    // --blank and --input are alternatives, and one of them is required.
    let both = Command::new(cli_exe())
        .arg("ledger")
        .arg("--blank")
        .arg("-i")
        .arg("whatever.txt")
        .output()?;
    assert!(
        !both.status.success(),
        "--blank with --input should be rejected"
    );
    let neither = Command::new(cli_exe()).arg("ledger").output()?;
    assert!(!neither.status.success(), "ledger needs --input or --blank");
    Ok(())
}

#[test]
fn test_ledger_cli_rejects_zero_sheets() -> io::Result<()> {
    let temp = TempDir::new()?;
    let input = write_sample_corpus(temp.path(), "corpus.txt", "a b c")?;
    let output = Command::new(cli_exe())
        .arg("ledger")
        .arg("-i")
        .arg(&input)
        .arg("--sheets")
        .arg("0")
        .arg("--json-only")
        .output()?;
    assert!(!output.status.success(), "--sheets 0 should exit non-zero");
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("--sheets must be at least 1"),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

/// A prefix taller than a page cannot be laid out, and says so.
#[test]
fn test_ledger_cli_reports_a_prefix_taller_than_a_page() -> io::Result<()> {
    let temp = TempDir::new()?;
    // Nine distinct followers of "the": three rows of four.
    let words: Vec<String> = ('a'..='i').map(|c| format!("the {c}")).collect();
    let input = write_sample_corpus(temp.path(), "corpus.txt", &words.join(" "))?;
    let output = Command::new(cli_exe())
        .arg("ledger")
        .arg("-i")
        .arg(&input)
        .arg("--rows")
        .arg("2")
        .arg("--json-only")
        .arg("--output")
        .arg(temp.path().join("out"))
        .output()?;
    assert!(!output.status.success());
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("'the' needs 3 ledger rows but a page holds 2"),
        "stderr: {stderr}"
    );
    Ok(())
}

/// End-to-end through typst: the brief, then one page per sheet.
#[test]
fn test_ledger_subcommand_end_to_end() -> io::Result<()> {
    if !typst_available() {
        eprintln!("Skipping test_ledger_subcommand_end_to_end: 'typst' not found in PATH.");
        return Ok(());
    }

    let temp = TempDir::new()?;
    let input = write_sample_corpus(
        temp.path(),
        "corpus.txt",
        "the cat sat on the mat and the cat ate the rat then the cat sat again \
         while the dog watched the cat and the rat ran past the mat",
    )?;
    let out_dir = temp.path().join("out");

    for prefill in ["prefixes", "followers"] {
        let output = Command::new(cli_exe())
            .arg("ledger")
            .arg("-i")
            .arg(&input)
            .arg("--sheets")
            .arg("2")
            .arg("--prefill")
            .arg(prefill)
            .arg("--output")
            .arg(&out_dir)
            .output()?;
        assert!(
            output.status.success(),
            "ledger end-to-end failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let pdf = out_dir.join("ledger.pdf");
        assert!(pdf.metadata()?.len() > 1000, "PDF looks empty");
        if let Some(pages) = pdf_pages(&pdf) {
            assert_eq!(pages, 3, "a brief plus one page per sheet");
        }
        // The counters come alongside: two identical pages for duplex printing.
        let counters = out_dir.join("counters.pdf");
        assert!(counters.exists(), "no counters.pdf written");
        if let Some(pages) = pdf_pages(&counters) {
            assert_eq!(pages, 2, "counters print double-sided from two pages");
        }
    }

    let output = Command::new(cli_exe())
        .arg("ledger")
        .arg("--blank")
        .arg("--output")
        .arg(&out_dir)
        .output()?;
    assert!(output.status.success(), "blank failed: {output:?}");
    if let Some(pages) = pdf_pages(&out_dir.join("ledger.pdf")) {
        assert_eq!(pages, 1, "a blank set has no brief");
    }
    Ok(())
}

/// Page count via pdfinfo, or `None` when poppler isn't installed.
fn pdf_pages(pdf: &Path) -> Option<usize> {
    let output = Command::new("pdfinfo").arg(pdf).output().ok()?;
    String::from_utf8_lossy(&output.stdout)
        .lines()
        .find_map(|l| l.strip_prefix("Pages:"))
        .and_then(|c| c.trim().parse().ok())
}
