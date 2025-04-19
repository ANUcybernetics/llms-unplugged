use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use serde::Serialize;

use std::collections::VecDeque;

/// Represents an N-gram prefix and its following words with their counts
#[derive(Serialize, Debug, PartialEq, Eq, Hash, Clone)] // Added Eq, Hash, Clone for HashMap key
pub struct NGramPrefix(Vec<String>); // Wrapper struct for clarity and potential future methods

#[derive(Serialize, Debug, PartialEq)]
pub struct WordFollowEntry {
    pub prefix: Vec<String>, // Changed from word: String
    pub followers: Vec<(String, usize)>,
}

/// Processes a text file and returns N-gram following statistics
pub fn process_file<P: AsRef<Path>>(path: P, n: usize) -> io::Result<Vec<WordFollowEntry>> {
    if n < 2 {
        // N-gram requires at least a prefix (n-1) and a follower (1), so n must be >= 2
        // Consider returning an error instead? For now, returning empty.
        eprintln!("Warning: N must be 2 or greater for N-gram analysis. Returning empty results.");
        return Ok(Vec::new());
    }
    let prefix_size = n - 1;

    let file = File::open(path)?;
    let reader = BufReader::new(file);

    // Map to store prefix -> following word -> count
    let mut follow_map: HashMap<Vec<String>, HashMap<String, usize>> = HashMap::new();

    // Use a deque to maintain the sliding window for the prefix
    let mut window: VecDeque<String> = VecDeque::with_capacity(prefix_size);

    // Process each line
    for line_result in reader.lines() {
        let line = line_result?;
        let words = tokenize_line(&line);

        // Process each word
        for word in words {
            // If the window is full (contains n-1 words), we have a complete N-gram prefix
            if window.len() == prefix_size {
                let prefix = window.iter().cloned().collect::<Vec<String>>();
                let follower = word.clone();

                // Update the frequency map
                follow_map
                    .entry(prefix)
                    .or_insert_with(HashMap::new)
                    .entry(follower)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);

                // Slide the window: remove the oldest word
                window.pop_front();
            }
            // Add the current word to the window
            window.push_back(word);
        }
    }

    // Convert the HashMap into the required format
    let mut result = convert_to_entries(follow_map);

    // Sort entries lexicographically by prefix
    result.sort_by(|a, b| a.prefix.cmp(&b.prefix));

    Ok(result)
}

/// Tokenizes a line into normalized words
pub fn tokenize_line(line: &str) -> Vec<String> {
    line.split_whitespace()
        .filter_map(|s| {
            // Extract only alphanumeric characters and convert to lowercase
            let word: String = s
                .chars()
                .filter(|c| c.is_alphanumeric())
                .flat_map(|c| c.to_lowercase())
                .collect();
            
            // Only keep non-empty words
            if !word.is_empty() {
                Some(word)
            } else {
                None
            }
        })
        .collect()
}

/// Converts the internal N-gram HashMap representation to the required output format
fn convert_to_entries(follow_map: HashMap<Vec<String>, HashMap<String, usize>>) -> Vec<WordFollowEntry> {
    follow_map
        .into_iter()
        .map(|(prefix, followers)| {
            let mut follower_entries: Vec<(String, usize)> = followers.into_iter().collect();
            // Sort followers alphabetically by word
            follower_entries.sort_by(|a, b| a.0.cmp(&b.0));
            
            WordFollowEntry {
                prefix, // Changed from word
                followers: follower_entries,
            }
        })
        .collect()
}

/// Saves the N-gram follow entries to a JSON file
pub fn save_to_json<P: AsRef<Path>>(entries: &[WordFollowEntry], path: P) -> io::Result<()> {
    // Convert entries to the required format: [["prefix_word1", "prefix_word2", ...], ["follower", count], ...]
    let formatted_entries: Vec<Vec<serde_json::Value>> = entries
        .iter()
        .map(|entry| {
            let mut formatted_entry = Vec::new();
            // First element is the prefix array
            let prefix_values: Vec<serde_json::Value> = entry.prefix.iter()
                .map(|word| serde_json::Value::String(word.clone()))
                .collect();
            formatted_entry.push(serde_json::Value::Array(prefix_values));
            
            // Subsequent elements are the follower pairs
            for (follower, count) in &entry.followers {
                formatted_entry.push(serde_json::json!([follower, count]));
            }
            
            formatted_entry
        })
        .collect();

    let file = File::create(path)?;
    serde_json::to_writer_pretty(file, &formatted_entries)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_tokenize_line() {
        let line = "Hello, world! This is a test.";
        let tokens = tokenize_line(line);
        assert_eq!(tokens, vec!["hello", "world", "this", "is", "a", "test"]);
    }

    #[test]
    fn test_process_small_file_bigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write to the file and explicitly flush
        {
            let mut file = File::create(&path)?;
            writeln!(file, "Hello world. Hello again world!")?;
            file.flush()?;
        }

        // Process with n=2 for bigrams
        let entries = process_file(&path, 2)?;

        // Expected bigrams: [hello]->world, [world]->hello, [hello]->again, [again]->world
        assert_eq!(entries.len(), 3);

        // Check prefix ["hello"]
        let hello_entry = entries.iter().find(|e| e.prefix == vec!["hello".to_string()]).unwrap();
        assert_eq!(hello_entry.followers.len(), 2);
        // Check followers sorted alphabetically
        assert_eq!(hello_entry.followers[0], ("again".to_string(), 1));
        assert_eq!(hello_entry.followers[1], ("world".to_string(), 1));

        // Check prefix ["world"]
        let world_entry = entries.iter().find(|e| e.prefix == vec!["world".to_string()]).unwrap();
        assert_eq!(world_entry.followers.len(), 1);
        assert_eq!(world_entry.followers[0], ("hello".to_string(), 1));

        // Check prefix ["again"]
        let again_entry = entries.iter().find(|e| e.prefix == vec!["again".to_string()]).unwrap();
        assert_eq!(again_entry.followers.len(), 1);
        assert_eq!(again_entry.followers[0], ("world".to_string(), 1));

        Ok(())
    }

    #[test]
    fn test_process_small_file_trigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write to the file and explicitly flush
        {
            let mut file = File::create(&path)?;
            writeln!(file, "The quick brown fox jumps over the lazy dog")?;
            file.flush()?;
        }

        // Process with n=3 for trigrams
        let entries = process_file(&path, 3)?;

        // For n=3, each prefix is 2 words
        // Expected trigrams: [the, quick] -> brown, [quick, brown] -> fox, etc.
        assert!(!entries.is_empty());

        // Check specific prefixes
        let the_quick_entry = entries.iter().find(|e| e.prefix == vec!["the".to_string(), "quick".to_string()]);
        assert!(the_quick_entry.is_some(), "Expected prefix ['the', 'quick'] not found");
        let the_quick_entry = the_quick_entry.unwrap();
        assert_eq!(the_quick_entry.followers.len(), 1);
        assert_eq!(the_quick_entry.followers[0], ("brown".to_string(), 1));

        // Check prefix [quick, brown]
        let quick_brown_entry = entries.iter().find(|e| e.prefix == vec!["quick".to_string(), "brown".to_string()]);
        assert!(quick_brown_entry.is_some(), "Expected prefix ['quick', 'brown'] not found");
        let quick_brown_entry = quick_brown_entry.unwrap();
        assert_eq!(quick_brown_entry.followers.len(), 1);
        assert_eq!(quick_brown_entry.followers[0], ("fox".to_string(), 1));

        Ok(())
    }

    #[test]
    fn test_save_to_json_bigrams() -> io::Result<()> {
        // Example data for bigrams (n=2, prefix size = 1)
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["hello".to_string()],
                followers: vec![
                    ("again".to_string(), 1),
                    ("world".to_string(), 1),
                ],
            },
            WordFollowEntry {
                prefix: vec!["world".to_string()],
                followers: vec![
                    ("hello".to_string(), 1),
                ],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        save_to_json(&entries, &path)?;

        // Read the file back and verify the new JSON structure
        let json: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Expected format: [ [["prefix"], ["follower1", count1], ["follower2", count2]], ... ]
        assert_eq!(json.len(), 2);
        
        // Check first entry (prefix ["hello"])
        assert_eq!(json[0].len(), 3); // Prefix array + 2 follower pairs
        assert_eq!(json[0][0], serde_json::json!(["hello"])); // Prefix is an array
        assert_eq!(json[0][1], serde_json::json!(["again", 1]));
        assert_eq!(json[0][2], serde_json::json!(["world", 1]));
        
        // Check second entry (prefix ["world"])
        assert_eq!(json[1].len(), 2); // Prefix array + 1 follower pair
        assert_eq!(json[1][0], serde_json::json!(["world"])); // Prefix is an array
        assert_eq!(json[1][1], serde_json::json!(["hello", 1]));

        Ok(())
    }

    #[test]
    fn test_save_to_json_trigrams() -> io::Result<()> {
        // Example data for trigrams (n=3, prefix size = 2)
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["the".to_string(), "quick".to_string()],
                followers: vec![
                    ("brown".to_string(), 1),
                ],
            },
            WordFollowEntry {
                prefix: vec!["quick".to_string(), "brown".to_string()],
                followers: vec![
                    ("fox".to_string(), 1),
                ],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        save_to_json(&entries, &path)?;

        // Read the file back and verify the JSON structure for trigrams
        let json: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Expected format: [ [["prefix1", "prefix2"], ["follower", count]], ... ]
        assert_eq!(json.len(), 2);
        
        // Check first entry (prefix ["the", "quick"])
        assert_eq!(json[0].len(), 2); // Prefix array + 1 follower pair
        assert_eq!(json[0][0], serde_json::json!(["the", "quick"])); // Prefix is an array with 2 elements
        assert_eq!(json[0][1], serde_json::json!(["brown", 1]));
        
        // Check second entry (prefix ["quick", "brown"])
        assert_eq!(json[1].len(), 2); // Prefix array + 1 follower pair
        assert_eq!(json[1][0], serde_json::json!(["quick", "brown"])); // Prefix is an array with 2 elements
        assert_eq!(json[1][1], serde_json::json!(["fox", 1]));

        Ok(())
    }
}