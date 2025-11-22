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
fn lowercases_consistently_and_strips_quotes() -> io::Result<()> {
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
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    assert!(tokens.contains(&"hello".to_string()));
    assert!(tokens.contains(&"agree".to_string()));
    assert!(tokens.contains(&",".to_string()));
    assert!(tokens.contains(&".".to_string()));
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
        writeln!(file, "Chapter IV and Section3 were finished in 2024.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

    assert!(!tokens.iter().any(|t| t == "iv"));
    assert!(!tokens.iter().any(|t| t == "2024"));
    assert!(tokens.contains(&"chapter".to_string()));
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
        writeln!(file, "Don't worry, it'll be fine.")?;
        writeln!(file, "goin' to see.")?;
        file.flush()?;
    }

    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    let tokens = collect_tokens(&counter);

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
