use llms_unplugged::NGramCounter;
use std::fs::File;
use std::io::{self, Write};
use tempfile::NamedTempFile;

#[test]
fn test_possessive_apostrophes_preserved() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Possessives")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "The bird's nest is in the tree.")?;
        writeln!(file, "The birds' nests are everywhere.")?;
        writeln!(file, "James's book is on the shelf.")?;
        writeln!(file, "The children's toys were scattered.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that possessives are preserved as single tokens
    // "The" appears 4 times at start of sentences, "the" appears once mid-sentence
    // When we see both capitalizations, it normalizes to lowercase "the"
    let has_the = entries.iter().any(|e| e.prefix == vec!["the"]);
    assert!(has_the, "Should have 'the' as a token");

    let has_birds = entries.iter().any(|e| e.prefix == vec!["bird's"]);
    assert!(has_birds, "Should have 'bird's' as a token");

    let has_birds_plural = entries.iter().any(|e| e.prefix == vec!["birds'"]);
    assert!(has_birds_plural, "Should have 'birds'' as a token");

    let has_james = entries.iter().any(|e| e.prefix == vec!["James's"]);
    assert!(has_james, "Should have 'James's' as a token (capitalized)");

    let has_childrens = entries.iter().any(|e| e.prefix == vec!["children's"]);
    assert!(has_childrens, "Should have 'children's' as a token");

    // Ensure they're not split into standalone 's'
    let has_just_s = entries.iter().any(|e| e.prefix == vec!["s"]);
    assert!(!has_just_s, "Should not have standalone 's' from possessives");

    Ok(())
}

#[test]
fn test_contractions_preserved() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Contractions")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "I can't believe it's already here.")?;
        writeln!(file, "Don't worry, we'll be fine.")?;
        writeln!(file, "They're going to love what you've done.")?;
        writeln!(file, "I'm sure that I'd like it.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that contractions are preserved with proper capitalization
    // "I" contractions always uppercase, "Don't" keeps capital D
    let contractions = vec!["can't", "it's", "Don't", "we'll", "They're", "you've", "I'm", "I'd"];
    for contraction in &contractions {
        let found = entries.iter().any(|e| {
            e.prefix.contains(&contraction.to_string()) ||
            e.followers.iter().any(|f| &f.0 == contraction)
        });
        assert!(found, "Should have '{}' as a token", contraction);
    }

    Ok(())
}

#[test]
fn test_quote_marks_stripped() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Quotes")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "'Hello,' she said.")?;
        writeln!(file, "He replied, 'I agree.'")?;
        writeln!(file, "The 'best' solution.")?;
        writeln!(file, "'''Triple quoted''' text.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that quoted words have quotes stripped and capitalization preserved
    let has_hello = entries.iter().any(|e| {
        e.prefix.contains(&"Hello".to_string()) ||
        e.followers.iter().any(|f| f.0 == "Hello")
    });
    assert!(has_hello, "Should have 'Hello' without quotes (capital preserved)");

    let has_best = entries.iter().any(|e| {
        e.prefix.contains(&"best".to_string()) ||
        e.followers.iter().any(|f| f.0 == "best")
    });
    assert!(has_best, "Should have 'best' without quotes");

    let has_triple = entries.iter().any(|e| {
        e.prefix.contains(&"Triple".to_string()) ||
        e.followers.iter().any(|f| f.0 == "Triple")
    });
    assert!(has_triple, "Should have 'Triple' without quotes (capital preserved)");

    Ok(())
}

#[test]
fn test_numbers_filtered() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Numbers")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "Version2 of the software.")?;
        writeln!(file, "123test and test456 and 789.")?;
        writeln!(file, "The year 2024 was great.")?;
        writeln!(file, "Section3 has more info.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that number-starting tokens are filtered
    let has_123test = entries.iter().any(|e| {
        e.prefix.contains(&"123test".to_string()) ||
        e.followers.iter().any(|f| f.0 == "123test")
    });
    assert!(!has_123test, "Should not have '123test'");

    let has_789 = entries.iter().any(|e| {
        e.prefix.contains(&"789".to_string()) ||
        e.followers.iter().any(|f| f.0 == "789")
    });
    assert!(!has_789, "Should not have '789'");

    let has_2024 = entries.iter().any(|e| {
        e.prefix.contains(&"2024".to_string()) ||
        e.followers.iter().any(|f| f.0 == "2024")
    });
    assert!(!has_2024, "Should not have '2024'");

    // Check that text parts are preserved (with proper capitalization)
    // "Version2" appears once, so "Version" should be preserved
    let has_version = entries.iter().any(|e| {
        e.prefix.contains(&"Version".to_string()) ||
        e.followers.iter().any(|f| f.0 == "Version")
    });
    assert!(has_version, "Should have 'Version' part");

    // "test" appears multiple times in lowercase
    let has_test = entries.iter().any(|e| {
        e.prefix.contains(&"test".to_string()) ||
        e.followers.iter().any(|f| f.0 == "test")
    });
    assert!(has_test, "Should have 'test' part");

    // "Section3" appears once, so "Section" should be preserved
    let has_section = entries.iter().any(|e| {
        e.prefix.contains(&"Section".to_string()) ||
        e.followers.iter().any(|f| f.0 == "Section")
    });
    assert!(has_section, "Should have 'Section' part");

    Ok(())
}

#[test]
fn test_roman_numerals_filtered() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Roman Numerals")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "Chapter IV discusses the topic.")?;
        writeln!(file, "Section III and Appendix VII.")?;
        writeln!(file, "Part II begins here.")?;
        writeln!(file, "I think that's correct.")?; // 'I' should be preserved
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that roman numerals are filtered
    let numerals = vec!["iv", "iii", "vii", "ii"];
    for numeral in &numerals {
        let found = entries.iter().any(|e| {
            e.prefix.iter().any(|w| w.to_lowercase() == *numeral) ||
            e.followers.iter().any(|f| f.0.to_lowercase() == *numeral)
        });
        assert!(!found, "Should not have roman numeral '{}'", numeral);
    }

    // Check that 'I' is preserved (as uppercase due to case exception)
    let has_i = entries.iter().any(|e| {
        e.prefix.contains(&"I".to_string()) ||
        e.followers.iter().any(|f| f.0 == "I")
    });
    assert!(has_i, "Should have 'I' preserved");

    Ok(())
}

#[test]
fn test_punctuation_handling() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Punctuation")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "Hello, world. How are you?")?;
        writeln!(file, "Wait... really?! No way!")?;
        writeln!(file, "Test: example; done-work.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that commas and periods are preserved as tokens
    let has_comma = entries.iter().any(|e| {
        e.prefix.contains(&",".to_string()) ||
        e.followers.iter().any(|f| f.0 == ",")
    });
    assert!(has_comma, "Should have ',' as a token");

    let has_period = entries.iter().any(|e| {
        e.prefix.contains(&".".to_string()) ||
        e.followers.iter().any(|f| f.0 == ".")
    });
    assert!(has_period, "Should have '.' as a token");

    // Check that other punctuation is filtered
    let has_exclamation = entries.iter().any(|e| {
        e.prefix.contains(&"!".to_string()) ||
        e.followers.iter().any(|f| f.0 == "!")
    });
    assert!(!has_exclamation, "Should not have '!' as a token");

    let has_question = entries.iter().any(|e| {
        e.prefix.contains(&"?".to_string()) ||
        e.followers.iter().any(|f| f.0 == "?")
    });
    assert!(!has_question, "Should not have '?' as a token");

    let has_colon = entries.iter().any(|e| {
        e.prefix.contains(&":".to_string()) ||
        e.followers.iter().any(|f| f.0 == ":")
    });
    assert!(!has_colon, "Should not have ':' as a token");

    let has_semicolon = entries.iter().any(|e| {
        e.prefix.contains(&";".to_string()) ||
        e.followers.iter().any(|f| f.0 == ";")
    });
    assert!(!has_semicolon, "Should not have ';' as a token");

    Ok(())
}

#[test]
fn test_case_normalization() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Case")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "HELLO World MiXeD case.")?;
        writeln!(file, "I think I AM sure I'm right.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check that words preserve their original capitalization (appear only once)
    let has_hello = entries.iter().any(|e| {
        e.prefix.contains(&"HELLO".to_string()) ||
        e.followers.iter().any(|f| f.0 == "HELLO")
    });
    assert!(has_hello, "Should have 'HELLO' in original form");

    let has_world = entries.iter().any(|e| {
        e.prefix.contains(&"World".to_string()) ||
        e.followers.iter().any(|f| f.0 == "World")
    });
    assert!(has_world, "Should have 'World' in original form");

    let has_mixed = entries.iter().any(|e| {
        e.prefix.contains(&"MiXeD".to_string()) ||
        e.followers.iter().any(|f| f.0 == "MiXeD")
    });
    assert!(has_mixed, "Should have 'MiXeD' in original form");

    // Check that 'I' is uppercase
    let has_uppercase_i = entries.iter().any(|e| {
        e.prefix.contains(&"I".to_string()) ||
        e.followers.iter().any(|f| f.0 == "I")
    });
    assert!(has_uppercase_i, "Should have 'I' in uppercase");

    let has_im = entries.iter().any(|e| {
        e.prefix.contains(&"I'm".to_string()) ||
        e.followers.iter().any(|f| f.0 == "I'm")
    });
    assert!(has_im, "Should have 'I'm' with uppercase I");

    Ok(())
}

#[test]
fn test_complex_real_world_sentences() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Complex Test")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "The bird's nest wasn't in the tree's branches.")?;
        writeln!(file, "'Don't worry,' she said, 'I'll be there.'")?;
        writeln!(file, "Section IV: The 1980's weren't all bad.")?;
        writeln!(file, "It's James's book, isn't it?")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;

    let entries = counter.get_entries();

    // Check key tokens are preserved correctly with proper capitalization
    let expected_tokens = vec![
        ("bird's", "bird's"),
        ("wasn't", "wasn't"),
        ("tree's", "tree's"),
        ("Don't", "Don't"),  // Capitalized at start of quote
        ("I'll", "I'll"),    // I is always uppercase
        ("weren't", "weren't"),
        ("It's", "It's"),    // Capitalized at start of sentence
        ("James's", "James's"), // Proper name, capitalized
        ("isn't", "isn't")
    ];

    for (expected, display) in &expected_tokens {
        let found = entries.iter().any(|e| {
            e.prefix.contains(&expected.to_string()) ||
            e.followers.iter().any(|f| f.0 == *expected)
        });
        assert!(found, "Should have '{}' as a token", display);
    }

    // Ensure "1980's" becomes just "s" after filtering "1980"
    let has_1980 = entries.iter().any(|e| {
        e.prefix.contains(&"1980".to_string()) ||
        e.followers.iter().any(|f| f.0 == "1980")
    });
    assert!(!has_1980, "Should not have '1980'");

    // Roman numeral IV should be filtered
    let has_iv = entries.iter().any(|e| {
        e.prefix.iter().any(|w| w.to_lowercase() == "iv") ||
        e.followers.iter().any(|f| f.0.to_lowercase() == "iv")
    });
    assert!(!has_iv, "Should not have roman numeral 'IV'");

    Ok(())
}
