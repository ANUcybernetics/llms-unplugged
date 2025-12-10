use llms_unplugged::NGramCounter;
use std::fs::File;
use std::io::{self, Write};
use tempfile::NamedTempFile;

fn collect_tokens(counter: &llms_unplugged::NGramCounter) -> Vec<String> {
    counter
        .get_entries()
        .iter()
        .flat_map(|entry| {
            let mut tokens = entry.prefix.clone();
            tokens.extend(entry.followers.iter().map(|(w, _)| w.clone()));
            tokens
        })
        .collect()
}

#[test]
fn normalises_case_and_strips_quotes() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Quotes")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // "Hello" appears with mixed case -> lowercase
        // "she" appears consistently lowercase
        writeln!(file, "'Hello,' she said. hello again.")?;
        writeln!(file, "He replied, 'I agree.'")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // "hello" appears mixed case (Hello + hello), so normalised to lowercase
    assert!(tokens.contains(&"hello".to_string()));
    // "agree" appears once capitalised, stays capitalised (single occurrence)
    // But actually it's lowercase in the input 'I agree', so stays lowercase
    assert!(tokens.contains(&"agree".to_string()));
    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    // Should not contain the word with punctuation attached
    assert!(!tokens.contains(&"Hello,".to_string()));

    Ok(())
}

#[test]
fn keeps_allowlisted_pronouns_cased() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Pronouns")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "I think I'm sure I've said I'd do it.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    for pronoun in ["I", "I'm", "I've", "I'd"] {
        assert!(
            tokens.contains(&pronoun.to_string()),
            "Expected allowlisted pronoun {}",
            pronoun
        );
    }
    assert!(tokens.contains(&"think".to_string()));

    Ok(())
}

#[test]
fn filters_numbers_and_roman_numerals() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Numbers")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // Add mixed case to test lowercase normalisation
        writeln!(file, "Chapter IV and Section3 were finished in 2024.")?;
        writeln!(file, "The chapter was good and the section was clear.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // Roman numerals should be filtered
    assert!(!tokens.iter().any(|t| t.to_lowercase() == "iv"));
    // Pure numbers should be filtered
    assert!(!tokens.iter().any(|t| t == "2024"));
    // "chapter" appears with mixed case (Chapter + chapter) -> lowercase
    assert!(tokens.contains(&"chapter".to_string()));
    // "section" appears with mixed case (Section3 stripped to Section + section) -> lowercase
    assert!(tokens.contains(&"section".to_string()));

    Ok(())
}

#[test]
fn preserves_contractions_and_possessives() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Apostrophes")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "The bird's nest and the birds' nests weren't gone.")?;
        // Use lowercase "don't" to ensure consistent case
        writeln!(file, "I don't worry, it'll be fine.")?;
        writeln!(file, "goin' to see.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    // All these contractions appear consistently lowercase
    for token in ["bird's", "birds'", "weren't", "don't", "it'll", "goin'"] {
        assert!(
            tokens.contains(&token.to_string()),
            "Expected token {}",
            token
        );
    }

    assert!(!tokens.contains(&"s".to_string()));

    Ok(())
}

#[test]
fn only_configured_punctuation_is_kept() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();

    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Punctuation")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        writeln!(file, "Hello, world. How are you? Great!")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
    assert!(!tokens.contains(&"?".to_string()));
    assert!(!tokens.contains(&"!".to_string()));

    Ok(())
}
