use serde::Serialize;
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;

use std::collections::VecDeque;
use std::sync::OnceLock;

/// Contains summary statistics for processed text
#[derive(Debug, Clone)]
pub struct ProcessingStats {
    /// Total number of tokens in the text
    pub total_tokens: usize,
    /// Total number of unique n-grams found
    pub unique_ngrams: usize,
    /// Total number of n-gram occurrences
    pub total_ngram_occurrences: usize,
    /// Most common n-gram prefix and its most common follower
    pub most_common_ngram: Option<(Vec<String>, String, usize)>,
    /// Prefix with the most cumulative followers
    pub most_popular_prefix: Option<(Vec<String>, usize)>,
}

/// Represents an N-gram prefix and its following words with their counts
#[derive(Serialize, Debug, PartialEq, Eq, Hash, Clone)] // Added Eq, Hash, Clone for HashMap key
pub struct NGramPrefix(Vec<String>); // Wrapper struct for clarity and potential future methods

#[derive(Serialize, Debug, PartialEq)]
pub struct WordFollowEntry {
    pub prefix: Vec<String>, // Changed from word: String
    pub followers: Vec<(String, usize)>,
}

/// A counter for tracking n-gram occurrences in text
#[derive(Debug)]
pub struct NGramCounter {
    /// Mapping of n-gram prefixes to their following words and counts
    prefix_map: HashMap<Vec<String>, HashMap<String, usize>>,
    /// Size of n-gram (e.g., 2 for bigrams, 3 for trigrams)
    n: usize,
    /// Statistics gathered during processing
    stats: ProcessingStats,
    /// Sliding window for processing text
    window: VecDeque<String>,
}

impl NGramCounter {
    /// Creates a new NGramCounter with the specified n-gram size
    pub fn new(n: usize) -> Self {
        if n < 2 {
            eprintln!("Warning: N must be 2 or greater for N-gram analysis. Defaulting to 2.");
            return Self::new(2);
        }

        let prefix_size = n - 1;

        NGramCounter {
            prefix_map: HashMap::new(),
            n,
            stats: ProcessingStats {
                total_tokens: 0,
                unique_ngrams: 0,
                total_ngram_occurrences: 0,
                most_common_ngram: None,
                most_popular_prefix: None,
            },
            window: VecDeque::with_capacity(prefix_size),
        }
    }

    /// Process a single line of text
    pub fn process_line(&mut self, line: &str) {
        let words = tokenize_line(line);
        let prefix_size = self.n - 1;

        // Add to token count
        self.stats.total_tokens += words.len();

        // Process each word
        for word in words {
            // If the window is full (contains n-1 words), we have a complete N-gram prefix
            if self.window.len() == prefix_size {
                let prefix = self.window.iter().cloned().collect::<Vec<String>>();
                let follower = word.clone();

                // Update the frequency map
                self.prefix_map
                    .entry(prefix)
                    .or_insert_with(HashMap::new)
                    .entry(follower)
                    .and_modify(|count| {
                        *count += 1;
                        self.stats.total_ngram_occurrences += 1;
                    })
                    .or_insert_with(|| {
                        self.stats.total_ngram_occurrences += 1;
                        1
                    });

                // Slide the window: remove the oldest word
                self.window.pop_front();
            }
            // Add the current word to the window
            self.window.push_back(word);
        }
    }

    /// Process a file containing text
    pub fn process_file<P: AsRef<Path>>(&mut self, path: P) -> io::Result<()> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);

        // Process each line
        for line_result in reader.lines() {
            let line = line_result?;
            self.process_line(&line);
        }

        // Calculate additional statistics after processing
        self.calculate_statistics();

        Ok(())
    }

    /// Calculate statistics after processing
    fn calculate_statistics(&mut self) {
        // Find the most common n-gram
        let mut most_common_count = 0;
        let mut most_common_prefix = None;
        let mut most_common_follower = None;

        // Find the prefix with the most cumulative followers
        let mut most_popular_prefix = None;
        let mut most_popular_prefix_count = 0;

        for (prefix, followers) in &self.prefix_map {
            // Calculate the cumulative count for this prefix
            let total_followers: usize = followers.values().sum();

            // Check if this is the prefix with the most followers
            if total_followers > most_popular_prefix_count {
                most_popular_prefix_count = total_followers;
                most_popular_prefix = Some(prefix.clone());
            }

            // Continue with existing logic for finding the most common specific n-gram
            for (follower, count) in followers {
                if *count > most_common_count {
                    most_common_count = *count;
                    most_common_prefix = Some(prefix.clone());
                    most_common_follower = Some(follower.clone());
                }
            }
        }

        if let (Some(prefix), Some(follower)) = (most_common_prefix, most_common_follower) {
            self.stats.most_common_ngram = Some((prefix, follower, most_common_count));
        }

        if let Some(prefix) = most_popular_prefix {
            self.stats.most_popular_prefix = Some((prefix, most_popular_prefix_count));
        }

        // Set the count of unique n-grams
        self.stats.unique_ngrams = self.prefix_map.len();
    }

    /// Get the results as a sorted list of WordFollowEntry
    pub fn get_entries(&self) -> Vec<WordFollowEntry> {
        let mut result = convert_to_entries(&self.prefix_map);

        // Sort entries lexicographically by prefix (case-insensitive)
        result.sort_by(|a, b| {
            // Compare each component of the prefix case-insensitively
            for (a_word, b_word) in a.prefix.iter().zip(b.prefix.iter()) {
                let cmp = a_word.to_lowercase().cmp(&b_word.to_lowercase());
                if cmp != std::cmp::Ordering::Equal {
                    return cmp;
                }
            }
            
            // If prefixes have different lengths but one is a prefix of the other
            a.prefix.len().cmp(&b.prefix.len())
        });

        result
    }

    /// Get the statistics collected during processing
    pub fn get_stats(&self) -> &ProcessingStats {
        &self.stats
    }
}

/// Processes a text file and returns N-gram following statistics along with summary statistics
pub fn process_file<P: AsRef<Path>>(
    path: P,
    n: usize,
) -> io::Result<(Vec<WordFollowEntry>, ProcessingStats)> {
    let mut counter = NGramCounter::new(n);
    counter.process_file(path)?;

    let entries = counter.get_entries();
    let stats = counter.get_stats().clone();

    Ok((entries, stats))
}

/// Returns a reference to the case exception map
fn case_exceptions() -> &'static HashMap<String, String> {
    static CASE_EXCEPTIONS: OnceLock<HashMap<String, String>> = OnceLock::new();
    CASE_EXCEPTIONS.get_or_init(|| {
        let mut map = HashMap::new();
        // Add words that should have specific casing
        map.insert("i".to_string(), "I".to_string());
        map.insert("i've".to_string(), "I've".to_string());
        map.insert("i'm".to_string(), "I'm".to_string());
        map.insert("i'd".to_string(), "I'd".to_string());
        map.insert("i'll".to_string(), "I'll".to_string());
        map
    })
}

/// Tokenizes a line into normalized words
pub fn tokenize_line(line: &str) -> Vec<String> {
    // Normalize specific non-ASCII characters like ’ to '
    let normalized_line = line.replace('’', "'");

    let mut tokens = Vec::new();
    let mut current_token = String::new();
    
    // Process character by character
    for c in normalized_line.chars() {
        if c.is_ascii_alphabetic() || c == '\'' {
            // Add alphabetic characters and apostrophes to the current token
            current_token.push(c.to_lowercase().next().unwrap_or(c));
        } else {
            // Non-alphabetic and non-apostrophe character ends the current token
            if !current_token.is_empty() {
                tokens.push(current_token.clone());
                current_token.clear();
            }
        }
    }
    
    // Add the last token if there is one
    if !current_token.is_empty() {
        tokens.push(current_token);
    }
    
    // Filter any empty tokens, strip apostrophes at beginning and end, and apply case exceptions
    tokens.into_iter()
        .filter(|token| !token.is_empty() && token != "'")
        .map(|token| {
            // Strip apostrophes at beginning and end
            let mut cleaned_token = token.to_string();
            
            // Remove leading apostrophe if present
            if cleaned_token.starts_with('\'') {
                cleaned_token.remove(0);
            }
            
            // Remove trailing apostrophe if present
            if cleaned_token.ends_with('\'') {
                cleaned_token.pop();
            }
            
            // Apply case exceptions if the word matches
            if let Some(exception) = case_exceptions().get(&cleaned_token) {
                exception.clone()
            } else {
                cleaned_token
            }
        })
        .filter(|token| !token.is_empty()) // Ensure we don't have any empty tokens after stripping
        .collect()
}

/// Converts the internal N-gram HashMap representation to the required output format
fn convert_to_entries(
    follow_map: &HashMap<Vec<String>, HashMap<String, usize>>,
) -> Vec<WordFollowEntry> {
    follow_map
        .iter()
        .map(|(prefix, followers)| {
            let mut follower_entries: Vec<(String, usize)> = followers
                .iter()
                .map(|(word, count)| (word.clone(), *count))
                .collect();
            // Sort followers alphabetically by word (case-insensitive)
            follower_entries.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));

            WordFollowEntry {
                prefix: prefix.clone(), // Changed from word
                followers: follower_entries,
            }
        })
        .collect()
}

/// Saves the N-gram follow entries to a JSON file
pub fn save_to_json<P: AsRef<Path>>(
    entries: &[WordFollowEntry],
    path: P,
    optimise: bool,
) -> io::Result<()> {
    // Convert entries to the required format: ["joined prefix", total_count, ["follower", cumulative_count], ...]
    let formatted_entries: Vec<Vec<serde_json::Value>> = entries
        .iter()
        .map(|entry| {
            let mut formatted_entry = Vec::new();
            // First element is the joined prefix string
            let prefix_str = entry.prefix.join(" ");
            formatted_entry.push(serde_json::Value::String(prefix_str.clone()));

            // Calculate the total count for all followers
            let total_count: usize = entry.followers.iter().map(|(_, count)| count).sum();

            // Sort followers alphabetically by word (case-insensitive)
            let mut sorted_followers = entry.followers.clone();
            sorted_followers.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));

            // First calculate cumulative counts based on original values
            let mut cumulative_counts = Vec::new();
            let mut running_count = 0;

            for (follower, count) in &sorted_followers {
                running_count += count;
                cumulative_counts.push((follower.clone(), running_count));
            }

            // Now apply optimisation if needed
            if optimise {
                let follower_count = entry.followers.len();
                if follower_count > 120 {
                    eprintln!(
                        "Warning: Prefix '{}' has {} followers which is more than 120. Not optimising.",
                        prefix_str,
                        follower_count
                    );
                    // Use original cumulative counts and total
                    formatted_entry.push(serde_json::json!(total_count));

                    for (follower, cumulative) in cumulative_counts {
                        formatted_entry.push(serde_json::json!([follower, cumulative]));
                    }
                } else {
                    // Scale the cumulative counts to a total of 120
                    formatted_entry.push(serde_json::json!(120));

                    // Scaling for each cumulative value (total_count → 120)
                    let scaling_factor = 120.0 / total_count as f64;

                    for (follower, cumulative) in cumulative_counts {
                        // Round to nearest integer instead of ceiling to ensure the last value is exactly 120
                        let scaled_cumulative = (cumulative as f64 * scaling_factor).round() as usize;
                        formatted_entry.push(serde_json::json!([follower, scaled_cumulative]));
                    }
                }
            } else {
                // No optimization - use original values
                formatted_entry.push(serde_json::json!(total_count));

                for (follower, cumulative) in cumulative_counts {
                    formatted_entry.push(serde_json::json!([follower, cumulative]));
                }
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
        let line = "Hello, world! This is a test. Version2 and 123numbers should be filtered.";
        let tokens = tokenize_line(line);
        assert_eq!(
            tokens,
            vec![
                "hello", "world", "this", "is", "a", "test", "version", "and", "numbers", "should",
                "be", "filtered"
            ]
        );
    }

    #[test]
    fn test_tokenize_line_special_cases() {
        let line = "I think that I am thinking and I'm sure that I said so.";
        let tokens = tokenize_line(line);
        assert_eq!(
            tokens,
            vec![
                "I", "think", "that", "I", "am", "thinking", "and", "I'm", "sure", "that", "I",
                "said", "so"
            ]
        );
    }

    #[test]
    fn test_tokenize_line_filters_numbers() {
        let line = "abc123 456def 789 alpha2beta";
        let tokens = tokenize_line(line);
        assert_eq!(tokens, vec!["abc", "def", "alpha", "beta"]);
    }

    #[test]
    fn test_tokenize_line_handles_contractions() {
        let line = "Don't can't won't I've I'm you're they'll it's 'quote' he'd we've 'ello goin'";
        let tokens = tokenize_line(line);
        assert_eq!(
            tokens,
            vec![
                "don't", "can't", "won't", "I've", "I'm", "you're", "they'll", "it's", "quote", 
                "he'd", "we've", "ello", "goin"
            ]
        );
    }
    
    #[test]
    fn test_tokenize_line_handles_apostrophes() {
        let line = "'ello 'tis 'twas '90s goin' talkin' 'n' writin' can't don't won't";
        let tokens = tokenize_line(line);
        assert_eq!(
            tokens,
            vec!["ello", "tis", "twas", "s", "goin", "talkin", "n", "writin", "can't", "don't", "won't"]
        );

        // Test the specific problematic case with quotes
        let complex_line = "'Bobbie, Bobbie!' she said, 'Come and kiss me, Bobbie!'";
        let complex_tokens = tokenize_line(complex_line);
        assert_eq!(
            complex_tokens,
            vec!["bobbie", "bobbie", "she", "said", "come", "and", "kiss", "me", "bobbie"]
        );

        // Test non-ascii apostrophe normalization
        let non_ascii_line = "It’s a test with ’90s style goin’ talkin’.";
        let non_ascii_tokens = tokenize_line(non_ascii_line);
        assert_eq!(
            non_ascii_tokens,
            vec!["it's", "a", "test", "with", "s", "style", "goin", "talkin"]
        );
    }

    #[test]
    fn test_process_small_file_bigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write test content to the temporary file
        {
            let mut file = File::create(&path)?;
            // Note: Number123 will be filtered to just "number" by the tokenizer
            writeln!(
                file,
                "Hello world. Hello again world! Number123 will be ignored."
            )?;
            file.flush()?;
        }

        // Process with n=2 for bigrams
        let (entries, stats) = process_file(&path, 2)?;

        assert_eq!(entries.len(), 6, "Expected 6 unique bigram prefixes");

        // Check prefix ["hello"]
        let hello_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["hello".to_string()])
            .expect("Prefix ['hello'] not found in entries");
        assert_eq!(
            hello_entry.followers.len(),
            2,
            "Expected 'hello' to have 2 followers"
        );
        // Check followers sorted alphabetically
        assert_eq!(
            hello_entry.followers[0],
            ("again".to_string(), 1),
            "First follower of 'hello' should be 'again'"
        );
        assert_eq!(
            hello_entry.followers[1],
            ("world".to_string(), 1),
            "Second follower of 'hello' should be 'world'"
        );

        // Check prefix ["world"]
        let world_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["world".to_string()])
            .expect("Prefix ['world'] not found in entries");
        assert_eq!(
            world_entry.followers.len(),
            2,
            "Expected 'world' to have 2 followers"
        );
        assert!(
            world_entry
                .followers
                .iter()
                .any(|(word, count)| word == "hello" && *count == 1),
            "Expected 'world' to be followed by 'hello'"
        );
        assert!(
            world_entry
                .followers
                .iter()
                .any(|(word, count)| word == "number" && *count == 1),
            "Expected 'world' to be followed by 'number'"
        );

        // Check prefix ["again"]
        let again_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["again".to_string()])
            .expect("Prefix ['again'] not found in entries");
        assert_eq!(
            again_entry.followers.len(),
            1,
            "Expected 'again' to have 1 follower"
        );
        assert_eq!(
            again_entry.followers[0],
            ("world".to_string(), 1),
            "Follower of 'again' should be 'world'"
        );

        // Check prefix ["number"]
        let number_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["number".to_string()])
            .expect("Prefix ['number'] not found in entries");
        assert_eq!(
            number_entry.followers.len(),
            1,
            "Expected 'number' to have 1 follower"
        );
        assert_eq!(
            number_entry.followers[0],
            ("will".to_string(), 1),
            "Follower of 'number' should be 'will'"
        );

        // Check stats
        assert_eq!(
            stats.total_tokens, 9,
            "Expected 9 tokens: hello, world, hello, again, world, number, will, be, ignored"
        );
        assert_eq!(
            stats.unique_ngrams, 6,
            "Expected 8 unique prefixes: hello, world, again, number, will, be"
        );
        assert_eq!(
            stats.total_ngram_occurrences, 8,
            "Expected 8 total bigram occurrences"
        );

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
        let (entries, stats) = process_file(&path, 3)?;

        // For n=3, each prefix is 2 words
        // Expected trigrams: [the, quick] -> brown, [quick, brown] -> fox, etc.
        assert!(!entries.is_empty());

        // Check specific prefixes
        let the_quick_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["the".to_string(), "quick".to_string()]);
        assert!(
            the_quick_entry.is_some(),
            "Expected prefix ['the', 'quick'] not found"
        );
        let the_quick_entry = the_quick_entry.unwrap();
        assert_eq!(the_quick_entry.followers.len(), 1);
        assert_eq!(the_quick_entry.followers[0], ("brown".to_string(), 1));

        // Check prefix [quick, brown]
        let quick_brown_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["quick".to_string(), "brown".to_string()]);
        assert!(
            quick_brown_entry.is_some(),
            "Expected prefix ['quick', 'brown'] not found"
        );
        let quick_brown_entry = quick_brown_entry.unwrap();
        assert_eq!(quick_brown_entry.followers.len(), 1);
        assert_eq!(quick_brown_entry.followers[0], ("fox".to_string(), 1));

        // Check that we have stats
        assert_eq!(stats.total_tokens, 9); // the, quick, brown, fox, jumps, over, the, lazy, dog
        assert!(stats.unique_ngrams > 0);
        assert!(stats.total_ngram_occurrences > 0);

        Ok(())
    }

    #[test]
    fn test_save_to_json_bigrams() -> io::Result<()> {
        // Example data for bigrams (n=2, prefix size = 1)
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["hello".to_string()],
                followers: vec![("again".to_string(), 1), ("world".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["world".to_string()],
                followers: vec![("hello".to_string(), 1)],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Test without optimisation first
        save_to_json(&entries, &path, false)?;

        // Read the file back and verify the new JSON structure
        let json: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Expected format: [ ["prefix", total_count, ["follower1", cumulative_count1], ["follower2", cumulative_count2]], ... ]
        assert_eq!(json.len(), 2);

        // Check first entry (prefix "hello")
        assert_eq!(json[0].len(), 4); // Prefix string + total count + 2 follower pairs
        assert_eq!(json[0][0], serde_json::json!("hello")); // Prefix is a string
        assert_eq!(json[0][1], serde_json::json!(2)); // Total count is 2 (1+1)
        // Followers are sorted alphabetically, so "again" comes first, then "world"
        assert_eq!(json[0][2], serde_json::json!(["again", 1])); // First follower has count 1
        assert_eq!(json[0][3], serde_json::json!(["world", 2])); // Second follower has cumulative count 2 (1+1)

        // Check second entry (prefix "world")
        assert_eq!(json[1].len(), 3); // Prefix string + total count + 1 follower pair
        assert_eq!(json[1][0], serde_json::json!("world")); // Prefix is a string
        assert_eq!(json[1][1], serde_json::json!(1)); // Total count is 1
        assert_eq!(json[1][2], serde_json::json!(["hello", 1])); // Only one follower, cumulative count is 1

        // Now test with optimisation
        save_to_json(&entries, &path, true)?;

        let json_opt: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Check optimised values (hello has count=2, should be scaled to 120)
        assert_eq!(json_opt[0][1], serde_json::json!(120)); // Total count is 120

        // For total=2, scaling factor is 120/2 = 60
        // With rounding, the first cumulative (1) gets scaled to round(1*60) = 60
        // The second cumulative (2) gets scaled to round(2*60) = 120
        assert_eq!(json_opt[0][2], serde_json::json!(["again", 60])); // First follower has count 60
        assert_eq!(json_opt[0][3], serde_json::json!(["world", 120])); // Second follower has cumulative count 120

        assert_eq!(json_opt[1][1], serde_json::json!(120));
        assert_eq!(json_opt[1][2], serde_json::json!(["hello", 120])); // No change for count 1

        Ok(())
    }

    #[test]
    fn test_save_to_json_trigrams() -> io::Result<()> {
        // Example data for trigrams (n=3, prefix size = 2)
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["the".to_string(), "quick".to_string()],
                followers: vec![("brown".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["quick".to_string(), "brown".to_string()],
                followers: vec![("fox".to_string(), 1)],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        save_to_json(&entries, &path, false)?;

        // Read the file back and verify the JSON structure for trigrams
        let json: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Expected format: [ ["joined prefix", total_count, ["follower", cumulative_count]], ... ]
        assert_eq!(json.len(), 2);

        // Check first entry (prefix "the quick")
        assert_eq!(json[0].len(), 3); // Prefix string + total count + 1 follower pair
        assert_eq!(json[0][0], serde_json::json!("the quick")); // Prefix is a string with joined words
        assert_eq!(json[0][1], serde_json::json!(1)); // Total count is 1
        assert_eq!(json[0][2], serde_json::json!(["brown", 1])); // Only one follower, so cumulative count = 1

        // Check second entry (prefix "quick brown")
        assert_eq!(json[1].len(), 3); // Prefix string + total count + 1 follower pair
        assert_eq!(json[1][0], serde_json::json!("quick brown")); // Prefix is a string with joined words
        assert_eq!(json[1][1], serde_json::json!(1)); // Total count is 1
        assert_eq!(json[1][2], serde_json::json!(["fox", 1])); // Only one follower, so cumulative count = 1

        // No need to test optimisation here as counts of 1 don't get modified

        Ok(())
    }

    #[test]
    fn test_save_to_json_cumulative_counts() -> io::Result<()> {
        // Test data with multiple followers having different counts
        let entries = vec![WordFollowEntry {
            prefix: vec!["the".to_string()],
            // Note: The order here shouldn't matter since we sort alphabetically in save_to_json
            followers: vec![
                ("dog".to_string(), 5),  // Highest occurrence count
                ("cat".to_string(), 3),  // Middle occurrence count
                ("bird".to_string(), 2), // Lowest occurrence count
            ],
        }];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Test without optimisation
        save_to_json(&entries, &path, false)?;

        // Read the file back and verify cumulative counts
        let json: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        assert_eq!(json.len(), 1);
        assert_eq!(json[0][0], serde_json::json!("the"));
        // Total count for this prefix should be 10 (5+3+2)
        assert_eq!(json[0][1], serde_json::json!(10));

        // Followers should be sorted alphabetically, with cumulative counts
        // bird (2) -> cat (2+3=5) -> dog (5+5=10)
        assert_eq!(json[0][2], serde_json::json!(["bird", 2])); // First follower: bird with count 2
        assert_eq!(json[0][3], serde_json::json!(["cat", 5])); // Second follower: cat with cumulative count 5
        assert_eq!(json[0][4], serde_json::json!(["dog", 10])); // Third follower: dog with cumulative count 10

        // Test with optimisation (with the new implementation, we always scale to 120)
        save_to_json(&entries, &path, true)?;

        let json_opt: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // With the new implementation, all optimized entries scale to 120
        assert_eq!(json_opt[0][1], serde_json::json!(120)); // Total count is scaled to 120
        // Scaling factor is 120/10 = 12
        // With rounding: bird(2) -> round(2*12) = 24, cat(5) -> round(5*12) = 60, dog(10) -> round(10*12) = 120
        assert_eq!(json_opt[0][2], serde_json::json!(["bird", 24]));
        assert_eq!(json_opt[0][3], serde_json::json!(["cat", 60]));
        assert_eq!(json_opt[0][4], serde_json::json!(["dog", 120]));

        // Test with count = 2 (should be optimised to scale to 120)
        let entries_to_optimise = vec![WordFollowEntry {
            prefix: vec!["test".to_string()],
            followers: vec![("one".to_string(), 1), ("two".to_string(), 1)],
        }];

        save_to_json(&entries_to_optimise, &path, true)?;

        let json_optimised: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Total count is 2, scaling factor is 120/2 = 60
        // With rounding: one(1) -> round(1*60) = 60, two(2) -> round(2*60) = 120
        assert_eq!(json_optimised[0][1], serde_json::json!(120)); // Total count is 120
        assert_eq!(json_optimised[0][2], serde_json::json!(["one", 60])); // First follower's cumulative count
        assert_eq!(json_optimised[0][3], serde_json::json!(["two", 120])); // Second follower's cumulative count

        // Test with count = 3 (optimised for 120-sided die)
        let entries_count_3 = vec![WordFollowEntry {
            prefix: vec!["count3".to_string()],
            followers: vec![
                ("a".to_string(), 1),
                ("b".to_string(), 1),
                ("c".to_string(), 1),
            ],
        }];

        save_to_json(&entries_count_3, &path, true)?;

        let json_count_3: Vec<Vec<serde_json::Value>> =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Total count is 3, scaling factor is 120/3 = 40
        // With rounding: a(1) -> round(1*40) = 40, b(2) -> round(2*40) = 80, c(3) -> round(3*40) = 120
        assert_eq!(json_count_3[0][1], serde_json::json!(120)); // Total is 120
        assert_eq!(json_count_3[0][2], serde_json::json!(["a", 40])); // First follower's cumulative count
        assert_eq!(json_count_3[0][3], serde_json::json!(["b", 80])); // Second follower's cumulative count
        assert_eq!(json_count_3[0][4], serde_json::json!(["c", 120])); // Third follower's cumulative count

        Ok(())
    }
}
