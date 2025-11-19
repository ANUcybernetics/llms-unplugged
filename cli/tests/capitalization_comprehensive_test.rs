use llms_unplugged::NGramCounter;
use std::fs::File;
use std::io::{self, Write};
use tempfile::NamedTempFile;

/// Tests all capitalization scenarios to ensure proper behavior
#[test]
fn test_comprehensive_capitalization_scenarios() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Comprehensive Test")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;

        // Scenario 1: Consistent capitalization (should preserve)
        writeln!(file, "NASA announced plans. NASA continues research.")?;

        // Scenario 2: Mixed capitalization (should normalize to lowercase)
        writeln!(file, "The Company grew. The company expanded.")?;

        // Scenario 3: All caps consistency (should preserve)
        writeln!(file, "IBM and IBM work together.")?;

        // Scenario 4: CamelCase consistency (should preserve)
        writeln!(file, "JavaScript is popular. JavaScript runs everywhere.")?;

        // Scenario 5: Special case - "I" (always uppercase)
        writeln!(file, "I think that i am sure i know.")?;

        // Scenario 6: Single occurrence (preserve original)
        writeln!(file, "XMLParser handles parsing.")?;

        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Helper function to find token in any prefix
    let find_token = |token: &str| -> Option<String> {
        entries.iter()
            .find(|e| e.prefix[0].to_lowercase() == token.to_lowercase())
            .map(|e| e.prefix[0].clone())
    };

    // Test Scenario 1: NASA (consistent uppercase)
    assert_eq!(
        find_token("nasa"),
        Some("NASA".to_string()),
        "NASA should preserve uppercase"
    );

    // Test Scenario 2: Company/company (mixed case)
    assert_eq!(
        find_token("company"),
        Some("company".to_string()),
        "Mixed Company/company should normalize to lowercase"
    );

    // Test Scenario 3: IBM (consistent all caps)
    assert_eq!(
        find_token("ibm"),
        Some("IBM".to_string()),
        "IBM should preserve all caps"
    );

    // Test Scenario 4: JavaScript (consistent CamelCase)
    assert_eq!(
        find_token("javascript"),
        Some("JavaScript".to_string()),
        "JavaScript should preserve CamelCase"
    );

    // Test Scenario 5: I (special case)
    assert_eq!(
        find_token("i"),
        Some("I".to_string()),
        "Pronoun 'I' should always be uppercase"
    );

    // Test Scenario 6: XMLParser (single occurrence)
    assert_eq!(
        find_token("xmlparser"),
        Some("XMLParser".to_string()),
        "Single occurrence XMLParser should preserve original"
    );

    Ok(())
}

#[test]
fn test_capitalization_in_followers() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Follower Test")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;

        // Test that followers also respect capitalization rules
        writeln!(file, "The NASA program. The NASA initiative.")?;
        writeln!(file, "See Google results. See google search.")?;

        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Find "The" entry (followed by NASA)
    let the_entry = entries.iter()
        .find(|e| e.prefix == vec!["The".to_string()])
        .expect("Should have 'The' entry");

    // Check NASA follower of "The"
    let nasa_follower = the_entry.followers.iter()
        .find(|(word, _)| word.to_lowercase() == "nasa");

    assert!(
        nasa_follower.is_some() && nasa_follower.unwrap().0 == "NASA",
        "NASA follower of 'The' should preserve uppercase"
    );

    // Find "See" entry (followed by Google/google)
    let see_entry = entries.iter()
        .find(|e| e.prefix == vec!["See".to_string()])
        .expect("Should have 'See' entry");

    // Check google follower of "See"
    let google_follower = see_entry.followers.iter()
        .find(|(word, _)| word.to_lowercase() == "google");

    assert!(
        google_follower.is_some() && google_follower.unwrap().0 == "google",
        "Mixed Google/google follower of 'See' should normalize to lowercase"
    );

    Ok(())
}

#[test]
fn test_capitalization_with_punctuation() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Punctuation Test")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;

        // Test that capitalization works correctly around punctuation
        writeln!(file, "Hello, World! Hello, everyone.")?;
        writeln!(file, "STOP. STOP. Please stop.")?;

        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // "Hello" appears twice with same case
    let hello_entry = entries.iter()
        .find(|e| e.prefix[0].to_lowercase() == "hello");
    assert!(
        hello_entry.is_some() && hello_entry.unwrap().prefix[0] == "Hello",
        "Consistent Hello should stay capitalized"
    );

    // "STOP" appears twice uppercase, once lowercase
    let stop_entry = entries.iter()
        .find(|e| e.prefix[0].to_lowercase() == "stop");
    assert!(
        stop_entry.is_some() && stop_entry.unwrap().prefix[0] == "stop",
        "Mixed STOP/stop should normalize to lowercase"
    );

    // "World" appears once
    let world_entry = entries.iter()
        .find(|e| e.prefix[0].to_lowercase() == "world");
    assert!(
        world_entry.is_some() && world_entry.unwrap().prefix[0] == "World",
        "Single World should keep original case"
    );

    Ok(())
}

#[test]
fn test_capitalization_edge_cases() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Edge Cases")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;

        // Edge cases
        writeln!(file, "a A a")?; // Same word, different cases
        writeln!(file, "B B B")?; // All same case
        writeln!(file, "CaMeL CaMeL")?; // Consistent unusual case
        writeln!(file, "MiXeD mixed MIXED")?; // All different

        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // "a/A" - mixed -> lowercase
    assert!(
        entries.iter().any(|e| e.prefix == vec!["a".to_string()]),
        "Mixed a/A should normalize to 'a'"
    );

    // "B" - consistent uppercase
    assert!(
        entries.iter().any(|e| e.prefix == vec!["B".to_string()]),
        "Consistent B should stay 'B'"
    );

    // "CaMeL" - consistent unusual case
    assert!(
        entries.iter().any(|e| e.prefix == vec!["CaMeL".to_string()]),
        "Consistent CaMeL should stay 'CaMeL'"
    );

    // "MiXeD/mixed/MIXED" - all different -> lowercase
    assert!(
        entries.iter().any(|e| e.prefix == vec!["mixed".to_string()]),
        "Multiple different cases should normalize to 'mixed'"
    );

    Ok(())
}
