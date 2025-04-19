use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use serde::Serialize;

/// Represents a word and its following words with their counts
#[derive(Serialize, Debug, PartialEq)]
pub struct WordFollowEntry {
    pub word: String,
    pub followers: Vec<(String, usize)>,
}

/// Processes a text file and returns word-following statistics
pub fn process_file<P: AsRef<Path>>(path: P) -> io::Result<Vec<WordFollowEntry>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    // Map to store word -> following word -> count
    let mut follow_map: HashMap<String, HashMap<String, usize>> = HashMap::new();

    // Keep track of the previous word across lines
    let mut prev_word: Option<String> = None;

    // Process each line
    for line_result in reader.lines() {
        let line = line_result?;
        let words = tokenize_line(&line);

        // Process each word
        for word in words {
            // If we have a previous word, update the frequency map
            if let Some(prev) = &prev_word {
                follow_map
                    .entry(prev.clone())
                    .or_insert_with(HashMap::new)
                    .entry(word.clone())
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
            
            // Update previous word for next iteration
            prev_word = Some(word);
        }
    }

    // Convert the HashMap into the required format
    let mut result = convert_to_entries(follow_map);
    
    // Sort entries by word
    result.sort_by(|a, b| a.word.cmp(&b.word));
    
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

/// Converts the internal HashMap representation to the required output format
fn convert_to_entries(follow_map: HashMap<String, HashMap<String, usize>>) -> Vec<WordFollowEntry> {
    follow_map
        .into_iter()
        .map(|(word, followers)| {
            let mut follower_entries: Vec<(String, usize)> = followers.into_iter().collect();
            // Sort followers by word
            follower_entries.sort_by(|a, b| a.0.cmp(&b.0));
            
            WordFollowEntry {
                word,
                followers: follower_entries,
            }
        })
        .collect()
}

/// Saves the word follow entries to a JSON file
pub fn save_to_json<P: AsRef<Path>>(entries: &[WordFollowEntry], path: P) -> io::Result<()> {
    // Convert entries to the required format: [word, [following_word, count], [following_word, count], ...]
    let formatted_entries: Vec<Vec<serde_json::Value>> = entries
        .iter()
        .map(|entry| {
            let mut formatted_entry = Vec::new();
            formatted_entry.push(serde_json::Value::String(entry.word.clone()));
            
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
    fn test_process_small_file() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        // Write to the file and explicitly flush
        {
            let mut file = File::create(&path)?;
            writeln!(file, "Hello world. Hello again world!")?;
            file.flush()?;
        }
        
        let entries = process_file(&path)?;
        
        assert_eq!(entries.len(), 3);
        
        // Check "hello" entry
        let hello_entry = entries.iter().find(|e| e.word == "hello").unwrap();
        assert_eq!(hello_entry.followers.len(), 2);
        
        // Check that "hello" is followed by "world" once and "again" once
        let world_count = hello_entry.followers.iter().find(|(w, _)| w == "world").unwrap().1;
        let again_count = hello_entry.followers.iter().find(|(w, _)| w == "again").unwrap().1;
        
        assert_eq!(world_count, 1);
        assert_eq!(again_count, 1);
        
        Ok(())
    }

    #[test]
    fn test_save_to_json() -> io::Result<()> {
        let entries = vec![
            WordFollowEntry {
                word: "hello".to_string(),
                followers: vec![
                    ("again".to_string(), 1),
                    ("world".to_string(), 1),
                ],
            },
            WordFollowEntry {
                word: "world".to_string(),
                followers: vec![
                    ("hello".to_string(), 1),
                ],
            },
        ];
        
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        save_to_json(&entries, &path)?;
        
        // Read the file back and verify
        let json: Vec<Vec<serde_json::Value>> = 
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
        
        assert_eq!(json.len(), 2);
        assert_eq!(json[0][0], "hello");
        assert_eq!(json[0][1], serde_json::json!(["again", 1]));
        assert_eq!(json[0][2], serde_json::json!(["world", 1]));
        
        assert_eq!(json[1][0], "world");
        assert_eq!(json[1][1], serde_json::json!(["hello", 1]));
        
        Ok(())
    }
}