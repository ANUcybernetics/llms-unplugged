use my_first_lm::NGramCounter;
use std::fs::File;
use std::io::{self, Write};
use tempfile::NamedTempFile;

#[test]
fn test_capitalization_preserved_when_consistent() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    
    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Capitalization")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // NASA appears twice with same capitalization - should stay NASA
        writeln!(file, "NASA launched a rocket. NASA announced plans.")?;
        file.flush()?;
    }
    
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    
    let entries = counter.get_entries();
    
    // Check if NASA is preserved as uppercase
    let nasa_entry = entries.iter().find(|e| 
        e.prefix == vec!["NASA".to_string()] || e.prefix == vec!["nasa".to_string()]
    );
    
    assert!(nasa_entry.is_some(), "Should have NASA entry");
    let nasa_entry = nasa_entry.unwrap();
    assert_eq!(nasa_entry.prefix[0], "NASA", "NASA should remain uppercase when consistent");
    
    Ok(())
}

#[test]
fn test_capitalization_normalized_when_mixed() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    
    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Mixed Case")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // Hello appears with different capitalization - should normalize to lowercase
        writeln!(file, "Hello world. hello again.")?;
        file.flush()?;
    }
    
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    
    let entries = counter.get_entries();
    
    // Check if hello is normalized to lowercase
    let hello_entry = entries.iter().find(|e| 
        e.prefix == vec!["hello".to_string()] || e.prefix == vec!["Hello".to_string()]
    );
    
    assert!(hello_entry.is_some(), "Should have hello entry");
    let hello_entry = hello_entry.unwrap();
    assert_eq!(hello_entry.prefix[0], "hello", "Mixed case 'Hello/hello' should normalize to lowercase");
    
    Ok(())
}

#[test]
fn test_special_case_i_always_uppercase() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    
    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test I Case")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // I should always be uppercase regardless of input
        writeln!(file, "I think that i am sure.")?;
        file.flush()?;
    }
    
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    
    let entries = counter.get_entries();
    
    // Check if I is always uppercase
    let i_entry = entries.iter().find(|e| 
        e.prefix == vec!["I".to_string()] || e.prefix == vec!["i".to_string()]
    );
    
    assert!(i_entry.is_some(), "Should have I entry");
    let i_entry = i_entry.unwrap();
    assert_eq!(i_entry.prefix[0], "I", "Pronoun 'I' should always be uppercase");
    
    Ok(())
}

#[test]
fn test_unique_capitalization_preserved() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    
    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Unique")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // Unique words with specific capitalization
        writeln!(file, "The XMLParser works. The YAML format.")?;
        file.flush()?;
    }
    
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    
    let entries = counter.get_entries();
    
    // Check XMLParser (only appears once)
    let xml_entry = entries.iter().find(|e| 
        e.prefix[0].to_lowercase() == "xmlparser"
    );
    
    if let Some(entry) = xml_entry {
        assert_eq!(entry.prefix[0], "XMLParser", "Unique capitalization should be preserved");
    }
    
    // Check YAML (only appears once)
    let yaml_entry = entries.iter().find(|e| 
        e.prefix[0].to_lowercase() == "yaml"
    );
    
    if let Some(entry) = yaml_entry {
        assert_eq!(entry.prefix[0], "YAML", "Unique all-caps should be preserved");
    }
    
    Ok(())
}

#[test]
fn test_capitalization_tracking_across_document() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let path = temp_file.path().to_owned();
    
    {
        let mut file = File::create(&path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test Document")?;
        writeln!(file, "author: Test")?;
        writeln!(file, "url: https://example.com")?;
        writeln!(file, "---")?;
        // Test various patterns
        writeln!(file, "The Lord spoke. The LORD commanded.")?; // Mixed case -> lowercase
        writeln!(file, "IBM works. IBM announced.")?; // Consistent -> preserve
        writeln!(file, "Google and google differ.")?; // Mixed -> lowercase
        file.flush()?;
    }
    
    let mut counter = NGramCounter::new(2, vec![',', '.']);
    counter.process_file(&path)?;
    
    let entries = counter.get_entries();
    
    // Check Lord/LORD -> normalized
    let lord_entry = entries.iter().find(|e| 
        e.prefix[0].to_lowercase() == "lord"
    );
    assert!(lord_entry.is_some());
    assert_eq!(lord_entry.unwrap().prefix[0], "lord", "Mixed Lord/LORD should normalize");
    
    // Check IBM -> preserved
    let ibm_entry = entries.iter().find(|e| 
        e.prefix[0].to_uppercase() == "IBM"
    );
    assert!(ibm_entry.is_some());
    assert_eq!(ibm_entry.unwrap().prefix[0], "IBM", "Consistent IBM should be preserved");
    
    // Check Google/google -> normalized
    let google_entry = entries.iter().find(|e| 
        e.prefix[0].to_lowercase() == "google"
    );
    assert!(google_entry.is_some());
    assert_eq!(google_entry.unwrap().prefix[0], "google", "Mixed Google/google should normalize");
    
    Ok(())
}