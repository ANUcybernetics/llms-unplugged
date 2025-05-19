use serde::Serialize;
use std::collections::HashMap;
use std::fs::File;
use std::io;
use std::path::Path;
use std::collections::VecDeque;
use frontmatter_gen::extract;

// New module declarations
mod tokenizer;
mod preprocessor;

// Use functions from new modules
use tokenizer::tokenize;
use preprocessor::preprocess;

/// Contains metadata from the frontmatter of the processed file
#[derive(Debug, Clone, Serialize)]
pub struct Metadata {
    /// Title of the document
    pub title: String,
    /// Author of the document
    pub author: String,
    /// URL related to the document
    pub url: String,
    /// Size of n-gram used for processing
    pub n: usize,
}

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
    /// Metadata from the frontmatter of the processed file
    metadata: Option<Metadata>,
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
            metadata: None,
        }
    }

    /// Process a single line of text
    pub fn process_line(&mut self, line: &str) {
        let raw_tokens = tokenize(line);
        let words = preprocess(raw_tokens);
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

    /// Process a file containing text with frontmatter
    pub fn process_file<P: AsRef<Path>>(&mut self, path: P) -> io::Result<()> {
        use std::io::{BufRead, BufReader};
        
        // Read only the first 100 lines to check for frontmatter
        let file = File::open(&path)?;
        let reader = BufReader::new(file);
        
        let mut first_lines = String::new();
        let max_frontmatter_lines = 100;
        
        for line in reader.lines().take(max_frontmatter_lines) {
            let line = line?;
            first_lines.push_str(&line);
            first_lines.push('\n');
        }
        
        // Try to extract frontmatter from the first lines
        match extract(&first_lines) {
            Ok((frontmatter, _)) => {
                // Try to extract required fields
                let title = frontmatter.get("title").and_then(|v| v.as_str());
                let author = frontmatter.get("author").and_then(|v| v.as_str());
                let url = frontmatter.get("url").and_then(|v| v.as_str());
                
                // If all required fields are present, create metadata
                if let (Some(title), Some(author), Some(url)) = (title, author, url) {
                    self.metadata = Some(Metadata {
                        title: title.to_string(),
                        author: author.to_string(),
                        url: url.to_string(),
                        n: self.n,
                    });
                } else {
                    // Missing required fields, return error
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        "Frontmatter missing required fields (title, author, url)."
                    ));
                }
            },
            Err(_) => {
                // Failed to extract frontmatter, return error
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "No valid YAML frontmatter found. Input must start with '---', contain valid YAML key-value pairs, and end with '---'."
                ));
            }
        };
        
        // Now process the content, skipping the frontmatter section
        let file = File::open(&path)?;
        let reader = BufReader::new(file);
        
        // Variables to track frontmatter boundaries
        let mut in_frontmatter = false;
        let mut frontmatter_ended = false;
        
        for line in reader.lines() {
            let line = line?;
            
            // Check for frontmatter delimiter
            if line.trim() == "---" {
                if !in_frontmatter {
                    // First delimiter - beginning of frontmatter
                    in_frontmatter = true;
                } else {
                    // Second delimiter - end of frontmatter
                    in_frontmatter = false;
                    frontmatter_ended = true;
                }
                continue; // Skip the delimiter line
            }
            
            // Only process content after frontmatter has ended
            if !in_frontmatter && frontmatter_ended {
                self.process_line(&line);
            }
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
    
    /// Get the metadata from the frontmatter
    pub fn get_metadata(&self) -> Option<&Metadata> {
        self.metadata.as_ref()
    }
}

/// Processes a text file and returns N-gram following statistics along with summary statistics and metadata
pub fn process_file<P: AsRef<Path>>(
    path: P,
    n: usize,
) -> io::Result<(Vec<WordFollowEntry>, ProcessingStats, Option<Metadata>)> {
    let mut counter = NGramCounter::new(n);
    counter.process_file(path)?;

    let entries = counter.get_entries();
    let stats = counter.get_stats().clone();
    let metadata = counter.get_metadata().cloned();

    Ok((entries, stats, metadata))
}

// Removed tokenize_line and case_exceptions as they are now in tokenizer.rs and preprocessor.rs

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
            // Sort followers by count (largest to smallest)
            // If counts are equal, then sort alphabetically by word (case-insensitive)
            follower_entries.sort_by(|a, b| {
                b.1.cmp(&a.1).then_with(|| a.0.to_lowercase().cmp(&b.0.to_lowercase()))
            });

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
    scale_d: Option<u32>,
    metadata: Option<&Metadata>
) -> io::Result<()> {
    // Convert entries to the required format: ["joined prefix", total_count, ["follower", cumulative_count], ...]
    let formatted_entries: Vec<Vec<serde_json::Value>> = entries
        .iter()
        .map(|entry| {
            let mut formatted_entry_json = Vec::new();
            // First element is the joined prefix string
            let prefix_str = entry.prefix.join(" ");
            formatted_entry_json.push(serde_json::Value::String(prefix_str.clone()));

            // Calculate the total sum of occurrences for all followers
            let total_original_count: usize = entry.followers.iter().map(|(_, count)| count).sum();

            // Followers are already sorted by count (largest to smallest) from convert_to_entries
            // Get number of unique followers (no need to sort as we only need the count)
            let num_unique_followers = entry.followers.len();

            // Calculate original cumulative counts
            let mut original_cumulative_counts = Vec::new();
            let mut running_sum = 0;

            for (follower, count) in &entry.followers {
                running_sum += count;
                original_cumulative_counts.push((follower.clone(), running_sum));
            }

            // Determine scaling strategy and apply it
            let (json_total_for_prefix, scaled_follower_values_json) =
                if total_original_count == 0 {
                    // If there are no follower occurrences, total is 0, no follower data.
                    (serde_json::json!(0), Vec::new())
                } else {
                    let mut scale_target_d_value: Option<u32> = None;

                    match scale_d {
                        Some(d_param) => {
                            if num_unique_followers <= d_param as usize {
                                scale_target_d_value = Some(d_param);
                            } else {
                                // Number of unique followers > d_param, so use 10^k-1 scaling
                            }
                        }
                        None => {
                            // No scale_d provided, use 10^k-1 scaling
                        }
                    }

                    if let Some(d_target) = scale_target_d_value {
                        // Scale to [1, d_target]
                        let scaling_factor = d_target as f64 / total_original_count as f64;
                        let num_followers_for_prefix = original_cumulative_counts.len();
                        
                        // Pre-compute scaled values to check for duplicates
                        let mut scaled_values = Vec::with_capacity(num_followers_for_prefix);
                        let mut prev_scaled_val = 0;
                        let mut has_duplicates = false;
                        
                        // First pass: calculate and check for duplicates
                        for (i, (_, original_cumul)) in original_cumulative_counts.iter().enumerate() {
                            let scaled_val: usize;
                            if i == num_followers_for_prefix - 1 { // Last follower
                                scaled_val = d_target as usize;
                            } else {
                                let scaled_raw = *original_cumul as f64 * scaling_factor;
                                // Apply ceil, ensure at least 1
                                let mut val = (scaled_raw.ceil() as usize).max(1);
                                // Ensure strictly increasing order
                                val = val.max(prev_scaled_val + 1);
                                // Do not exceed d_target
                                val = val.min(d_target as usize);
                                scaled_val = val;
                            }
                            
                            // Check for non-increasing sequence or duplicates
                            if (i > 0 && scaled_val <= prev_scaled_val) || scaled_values.contains(&scaled_val) {
                                has_duplicates = true;
                                break;
                            }
                            
                            scaled_values.push(scaled_val);
                            prev_scaled_val = scaled_val.min(d_target as usize);
                        }
                        
                        // If duplicates found, switch to 10^k-1 scaling
                        if has_duplicates {
                            // Scale to [0, 10^k - 1]
                            let k_digits = total_original_count.to_string().len() as u32;
                            let max_val_for_scaling = 10_u32.pow(k_digits).saturating_sub(1);
                            
                            let actual_json_total = serde_json::json!(max_val_for_scaling);
                            let scaling_factor = max_val_for_scaling as f64 / total_original_count as f64;

                            let followers_json_list: Vec<serde_json::Value> = original_cumulative_counts
                                .iter()
                                .map(|(follower_word, original_cumul)| {
                                    let scaled_cumul = (*original_cumul as f64 * scaling_factor).round() as usize;
                                    serde_json::json!([follower_word, scaled_cumul])
                                })
                                .collect();
                            (actual_json_total, followers_json_list)
                        } else {
                            // No duplicates, proceed with [1, d_target] scaling
                            let actual_json_total = serde_json::json!(d_target);
                            let mut processed_followers_json = Vec::with_capacity(num_followers_for_prefix);
                            
                            // Second pass: create the JSON values using the pre-computed scaled values
                            for ((follower_word, _), scaled_val) in 
                                original_cumulative_counts.iter().zip(scaled_values.iter()) {
                                processed_followers_json.push(
                                    serde_json::json!([follower_word, scaled_val])
                                );
                            }
                            
                            (actual_json_total, processed_followers_json)
                        }
                    } else {
                        // This implies scale_to_10_pow_k_minus_1 is true
                        // Scale to [0, 10^k - 1]
                        // k is the number of digits in total_original_count
                        let k_digits = total_original_count.to_string().len() as u32;
                        // max_val is 10^k_digits - 1 (e.g., if count is 75, k=2, max_val=99)
                        // If count is 0, k_digits=1, max_val=9. Handled by total_original_count == 0 check earlier.
                        let max_val_for_scaling = 10_u32.pow(k_digits).saturating_sub(1);
                        
                        let actual_json_total = serde_json::json!(max_val_for_scaling);
                        // total_original_count is guaranteed > 0 here by the outer if condition
                        let scaling_factor = max_val_for_scaling as f64 / total_original_count as f64;

                        let followers_json_list: Vec<serde_json::Value> = original_cumulative_counts
                            .iter()
                            .map(|(follower_word, original_cumul)| {
                                let scaled_cumul = (*original_cumul as f64 * scaling_factor).round() as usize;
                                serde_json::json!([follower_word, scaled_cumul])
                            })
                            .collect();
                        (actual_json_total, followers_json_list)
                    }
                };
            
            formatted_entry_json.push(json_total_for_prefix);
            formatted_entry_json.extend(scaled_follower_values_json);

            formatted_entry_json
        })
        .collect();

    // Build the full output object with metadata and data
    let mut output = serde_json::Map::new();
    
    // Add metadata if available
    if let Some(meta) = metadata {
        output.insert("metadata".to_string(), serde_json::to_value(meta)?);
    } else {
        // Create minimal metadata with just the n value
        let mut meta_map = serde_json::Map::new();
        meta_map.insert("n".to_string(), serde_json::Value::Number(serde_json::Number::from(entries[0].prefix.len() + 1)));
        output.insert("metadata".to_string(), serde_json::Value::Object(meta_map));
    }
    
    // Add data
    output.insert("data".to_string(), serde_json::to_value(formatted_entries)?);
    
    // Write to file
    let file = File::create(path)?;
    serde_json::to_writer_pretty(file, &output)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    // BufReader is used by save_to_json tests, Write and NamedTempFile are used by multiple tests.
    use std::io::{Write, BufReader}; 
    use tempfile::NamedTempFile;
    
    #[test]
    fn test_follower_sort_order() {
        // Test the sorting of followers by count (largest to smallest)
        let mut counter = NGramCounter::new(2);
        counter.process_line("the cat sat on the mat and the cat ate");
        
        // Get entries and check sorting
        let entries = counter.get_entries();
        
        // Find entry for "the"
        let the_entry = entries.iter().find(|e| e.prefix == vec!["the"]).unwrap();
        
        // Check that followers are sorted by count (largest to smallest)
        assert_eq!(the_entry.followers[0].0, "cat"); // "cat" should be first (count = 2)
        assert_eq!(the_entry.followers[0].1, 2);
        assert_eq!(the_entry.followers[1].0, "mat"); // "mat" should be second (count = 1)
        assert_eq!(the_entry.followers[1].1, 1);
        
        // Test equal counts with alphabetical tiebreaker
        let mut counter2 = NGramCounter::new(2);
        counter2.process_line("he no test he yes test");
        
        let entries2 = counter2.get_entries();
        let he_entry = entries2.iter().find(|e| e.prefix == vec!["he"]).unwrap();
        
        // Both followers have count 1, so should be sorted alphabetically
        assert_eq!(he_entry.followers[0].0, "no"); // "no" comes before "yes" alphabetically
        assert_eq!(he_entry.followers[0].1, 1);
        assert_eq!(he_entry.followers[1].0, "yes");
        assert_eq!(he_entry.followers[1].1, 1);
    }

    // Tokenization specific tests are removed as they are now covered in tokenizer.rs and preprocessor.rs

    #[test]
    fn test_process_small_file_bigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write test content to the temporary file with frontmatter
        {
            let mut file = File::create(&path)?;
            writeln!(
                file,
                "---\ntitle: Test Document\nauthor: Test Author\nurl: https://example.com\n---"
            )?;
            // Note: Number123 will be tokenized to "number". "ignored" from "ignored."
            writeln!(
                file,
                "Hello world. Hello again world! Number123 will be ignored."
            )?;
            file.flush()?;
        }

        // Process with n=2 for bigrams
        let (entries, stats, metadata) = process_file(&path, 2)?;
    
        // Expected tokens: "hello", "world", "hello", "again", "world", "number", "will", "be", "ignored"
        // Expected unique prefixes (n-1=1):
        // "hello" -> "world" (1), "again" (1)
        // "world" -> "hello" (1), "number" (1)
        // "again" -> "world" (1)
        // "number" -> "will" (1)
        // "will" -> "be" (1)
        // "be" -> "ignored" (1)
        // Total 6 unique prefixes
        assert_eq!(entries.len(), 6, "Expected 6 unique bigram prefixes. Got: {:?}", entries);

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
        // Followers are sorted by count (desc), then alphabetically (asc). Here counts are equal.
        assert_eq!(
            hello_entry.followers[0],
            ("again".to_string(), 1), // 'again' before 'world'
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
            stats.unique_ngrams, 6, // Corrected from 8 to 6 as per the prefixes list above.
            "Expected 6 unique prefixes: hello, world, again, number, will, be"
        );
        assert_eq!(
            stats.total_ngram_occurrences, 8,
            "Expected 8 total bigram occurrences"
        );
        
        // Check metadata
        let metadata = metadata.expect("Metadata should be present");
        assert_eq!(metadata.title, "Test Document");
        assert_eq!(metadata.author, "Test Author");
        assert_eq!(metadata.url, "https://example.com");
        assert_eq!(metadata.n, 2);

        Ok(())
    }

    #[test]
    fn test_process_small_file_trigrams() -> io::Result<()> {
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();

        // Write to the file with frontmatter and explicitly flush
        {
            let mut file = File::create(&path)?;
            writeln!(
                file,
                "---\ntitle: Trigram Test\nauthor: Trigram Author\nurl: https://trigram.example.com\n---"
            )?;
            writeln!(file, "The quick brown fox jumps over the lazy dog")?;
            file.flush()?;
        }

        // Process with n=3 for trigrams
        let (entries, stats, metadata) = process_file(&path, 3)?;

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
        
        // Check metadata
        let metadata = metadata.expect("Metadata should be present");
        assert_eq!(metadata.title, "Trigram Test");
        assert_eq!(metadata.author, "Trigram Author");
        assert_eq!(metadata.url, "https://trigram.example.com");
        assert_eq!(metadata.n, 3);

        Ok(())
    }

    #[test]
    fn test_save_to_json_bigrams() -> io::Result<()> {
        // Example data for bigrams (n=2, prefix size = 1)
        // Followers should be pre-sorted as `convert_to_entries` would do:
        // "hello" -> followers: ("world", 2), ("again", 1) -- this order is correct based on count.
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["hello".to_string()],
                followers: vec![("world".to_string(), 2), ("again".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["world".to_string()],
                followers: vec![("hello".to_string(), 1)],
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        // Create metadata
        let metadata = Metadata {
            title: "Test Bigrams".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/bigrams".to_string(),
            n: 2,
        };

        // Test with scale_d = None (default 10^k-1 scaling)
        save_to_json(&entries, &path, None, Some(&metadata))?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
        
        // Extract the data array
        let data = json_none.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data.len(), 2);
        // Prefix "hello": total_original_count=3 (k=1, max_val=9). Followers: "world"(2), "again"(1)
        // Original cumulative: world:2, again:3
        // Scaled: world (2/3 * 9) = 6, again (3/3 * 9) = 9
        assert_eq!(data[0][0], serde_json::json!("hello"));
        assert_eq!(data[0][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[0][2], serde_json::json!(["world", 6])); 
        assert_eq!(data[0][3], serde_json::json!(["again", 9])); 
        // Prefix "world": total_original_count=1 (k=1, max_val=9)
        assert_eq!(data[1][0], serde_json::json!("world"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[1][2], serde_json::json!(["hello", 9])); // (1/1 * 9).round() = 9
        
        // Check metadata
        let meta = json_none.get("metadata").expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Bigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/bigrams");
        assert_eq!(meta.get("n").unwrap(), 2);

        // Test with scale_d = Some(120)
        // "hello": 2 unique followers <= 120. Scale to [1, 120].
        // "world": 1 unique follower <= 120. Scale to [1, 120].
        save_to_json(&entries, &path, Some(120), Some(&metadata))?;
        let json_d120: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
        
        // Extract the data array
        let data_d120 = json_d120.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        assert_eq!(data_d120[0][0], serde_json::json!("hello"));
        assert_eq!(data_d120[0][1], serde_json::json!(120)); // Total scaled to 120
        assert_eq!(data_d120[0][2], serde_json::json!(["world", 80])); // (2/3 * 120).round() = 80
        assert_eq!(data_d120[0][3], serde_json::json!(["again", 120])); // Last element is 120
        
        assert_eq!(data_d120[1][0], serde_json::json!("world"));
        assert_eq!(data_d120[1][1], serde_json::json!(120)); // Total scaled to 120
        assert_eq!(data_d120[1][2], serde_json::json!(["hello", 120])); // Last element is 120

        // Test with scale_d = Some(1)
        // "hello": 2 unique followers > 1. Scale to 10^k-1 (total 9).
        // "world": 1 unique follower <= 1. Scale to [1, 1].
        save_to_json(&entries, &path, Some(1), Some(&metadata))?;
        let json_d1: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_d1 = json_d1.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data_d1[0][0], serde_json::json!("hello"));
        assert_eq!(data_d1[0][1], serde_json::json!(9)); // Total scaled to 9 (10^k-1 rule because 2 unique > d=1)
        // Original cumulative: world:2, again:3. Scale factor 9/3=3.
        // world: (2*3).round() = 6
        // again: (3*3).round() = 9
        assert_eq!(data_d1[0][2], serde_json::json!(["world", 6])); 
        assert_eq!(data_d1[0][3], serde_json::json!(["again", 9])); 

        assert_eq!(data_d1[1][0], serde_json::json!("world"));
        assert_eq!(data_d1[1][1], serde_json::json!(1)); // Total scaled to 1 ([1,d] rule)
        assert_eq!(data_d1[1][2], serde_json::json!(["hello", 1])); // Last element is 1

        Ok(())
    }

    #[test]
    fn test_save_to_json_trigrams() -> io::Result<()> {
        // Example data for trigrams (n=3, prefix size = 2)
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["the".to_string(), "quick".to_string()],
                followers: vec![("brown".to_string(), 1)], // 1 unique follower
            },
            WordFollowEntry {
                prefix: vec!["quick".to_string(), "brown".to_string()],
                followers: vec![("fox".to_string(), 1)], // 1 unique follower
            },
        ];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        // Create metadata
        let metadata = Metadata {
            title: "Test Trigrams".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/trigrams".to_string(),
            n: 3,
        };

        // Test with scale_d = None (default 10^k-1 scaling)
        // Both entries: total_original_count=1 (k=1, max_val=9)
        save_to_json(&entries, &path, None, Some(&metadata))?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data = json_none.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data.len(), 2);
        // Entry ["the", "quick"]
        assert_eq!(data[0][0], serde_json::json!("the quick"));
        assert_eq!(data[0][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[0][2], serde_json::json!(["brown", 9])); // (1/1 * 9).round() = 9
        // Entry ["quick", "brown"]
        assert_eq!(data[1][0], serde_json::json!("quick brown"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total scaled to 9
        assert_eq!(data[1][2], serde_json::json!(["fox", 9])); // (1/1 * 9).round() = 9
        
        // Check metadata
        let meta = json_none.get("metadata").expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Trigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/trigrams");
        assert_eq!(meta.get("n").unwrap(), 3);

        // Test with scale_d = Some(60)
        // Both entries: 1 unique follower <= 60. Scale to [1, 60].
        save_to_json(&entries, &path, Some(120), Some(&metadata))?;
        let json_d120: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_d120 = json_d120.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        // For "the quick" -> "brown" (1 follower, total original 1)
        // Scaled to [1, 120], total becomes 120, follower "brown" gets 120.
        assert_eq!(data_d120[0][0], serde_json::json!("the quick"));
        assert_eq!(data_d120[0][1], serde_json::json!(120)); // Total scaled to 120
        assert_eq!(data_d120[0][2], serde_json::json!(["brown", 120])); // Last element is 120
        
        // For "quick brown" -> "fox" (1 follower, total original 1)
        // Scaled to [1, 120], total becomes 120, follower "fox" gets 120.
        assert_eq!(data_d120[1][0], serde_json::json!("quick brown"));
        assert_eq!(data_d120[1][1], serde_json::json!(120)); // Total scaled to 120
        assert_eq!(data_d120[1][2], serde_json::json!(["fox", 120])); // Last element is 120
        
        // Test with scale_d = Some(0)
        // Both entries: 1 unique follower > 0. Scale to 10^k-1 (total 9)
        save_to_json(&entries, &path, Some(0), Some(&metadata))?;
        let json_d0: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_d0 = json_d0.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data_d0[0][1], serde_json::json!(9));
        assert_eq!(data_d0[0][2], serde_json::json!(["brown", 9]));
        assert_eq!(data_d0[1][1], serde_json::json!(9));
        assert_eq!(data_d0[1][2], serde_json::json!(["fox", 9]));

        Ok(())
    }

    #[test]
    fn test_save_to_json_cumulative_counts() -> io::Result<()> {
        // Test data with multiple followers having different counts
        // Prefix "the": followers dog(5), cat(3), bird(2) - sorted by count from largest to smallest
        // Total original = 10. 3 unique followers.
        // Original cumulative: dog:5, cat:8, bird:10
        let entries = vec![WordFollowEntry {
            prefix: vec!["the".to_string()],
            followers: vec![
                ("dog".to_string(), 5),
                ("cat".to_string(), 3),
                ("bird".to_string(), 2),
            ],
        }];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        // Create metadata
        let metadata = Metadata {
            title: "Cumulative Test".to_string(),
            author: "Test Author".to_string(),
            url: "https://example.com/cumulative".to_string(),
            n: 2,
        };

        // Test with scale_d = None (default 10^k-1 scaling)
        // total_original_count=10 (k=2, max_val=99). Factor = 9.9
        // Original cumulative: dog:5, cat:8 (5+3), bird:10 (8+2)
        save_to_json(&entries, &path, None, Some(&metadata))?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data = json_none.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data.len(), 1);
        assert_eq!(data[0][0], serde_json::json!("the"));
        assert_eq!(data[0][1], serde_json::json!(99)); // Total scaled to 99
        assert_eq!(data[0][2], serde_json::json!(["dog", (5.0_f64 * 9.9_f64).round() as u64])); // 50
        assert_eq!(data[0][3], serde_json::json!(["cat", (8.0_f64 * 9.9_f64).round() as u64])); // 79
        assert_eq!(data[0][4], serde_json::json!(["bird", (10.0_f64 * 9.9_f64).round() as u64]));// 99
        
        // Check metadata
        let meta = json_none.get("metadata").expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Cumulative Test");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/cumulative");
        assert_eq!(meta.get("n").unwrap(), 2);

        // Test with scale_d = Some(120)
        // 3 unique followers <= 120. Scale to [1, 120]. Factor = 120/10 = 12.
        save_to_json(&entries, &path, Some(120), Some(&metadata))?;
        let json_d120: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_d120 = json_d120.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        assert_eq!(data_d120[0][1], serde_json::json!(120)); // Total scaled to 120
        // dog (orig 5): ceil(5*12).max(1)=60. prev=0. max(60, 1)=60.
        assert_eq!(data_d120[0][2], serde_json::json!(["dog", 60]));
        // cat (orig 8): ceil(8*12).max(1)=96. prev=60. max(96, 60+1)=96.
        assert_eq!(data_d120[0][3], serde_json::json!(["cat", 96]));
        // bird (orig 10): last element, so 120.
        assert_eq!(data_d120[0][4], serde_json::json!(["bird", 120]));

        // Test with scale_d = Some(2)
        // 3 unique followers > 2. Scale to 10^k-1 (total 99).
        save_to_json(&entries, &path, Some(2), Some(&metadata))?;
        let json_d2: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_d2 = json_d2.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        assert_eq!(data_d2[0][1], serde_json::json!(99)); // Total scaled to 99
        assert_eq!(data_d2[0][2], serde_json::json!(["dog", (5.0_f64 * 9.9_f64).round() as u64])); // 50
        assert_eq!(data_d2[0][3], serde_json::json!(["cat", (8.0_f64 * 9.9_f64).round() as u64])); // 79
        assert_eq!(data_d2[0][4], serde_json::json!(["bird", (10.0_f64 * 9.9_f64).round() as u64]));// 99

        // Test with count = 2 (should be optimised to scale to 120)
        let entries_to_optimise = vec![WordFollowEntry {
            prefix: vec!["test".to_string()],
            followers: vec![("one".to_string(), 1), ("two".to_string(), 1)],
            // When counts are equal, they'll be sorted alphabetically: "one" before "two"
        }];
        
        // Different metadata for this test
        let metadata_opt = Metadata {
            title: "Optimized Test".to_string(),
            author: "Optimizer".to_string(),
            url: "https://example.com/optimized".to_string(),
            n: 2,
        };

        save_to_json(&entries_to_optimise, &path, Some(120), Some(&metadata_opt))?;

        let json_optimised: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_opt = json_optimised.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        // Total count is 2, scaling factor is 120/2 = 60
        // Original cumulative: one:1, two:2
        // Scaled: one: ceil(1*60)=60. max(60,1)=60.
        // Scaled: two: (last) = 120.
        assert_eq!(data_opt[0][1], serde_json::json!(120)); // Total count is 120
        assert_eq!(data_opt[0][2], serde_json::json!(["one", 60])); 
        assert_eq!(data_opt[0][3], serde_json::json!(["two", 120])); 

        // Test with count = 3 (optimised for 120-sided die)
        let entries_count_3 = vec![WordFollowEntry {
            prefix: vec!["count3".to_string()],
            followers: vec![
                ("a".to_string(), 1),
                ("b".to_string(), 1),
                ("c".to_string(), 1),
            ],
            // With equal counts, followers should be sorted alphabetically
        }];
        
        // Different metadata for this test
        let metadata_count3 = Metadata {
            title: "Count3 Test".to_string(),
            author: "Counter".to_string(),
            url: "https://example.com/count3".to_string(),
            n: 2,
        };

        save_to_json(&entries_count_3, &path, Some(120), Some(&metadata_count3))?;

        let json_count_3: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_count3 = json_count_3.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");

        // Total count is 3, scaling factor is 120/3 = 40
        // Original cumulative: a:1, b:2, c:3
        // Scaled: a: ceil(1*40)=40. max(40,1)=40.
        // Scaled: b: ceil(2*40)=80. max(80,40+1)=80.
        // Scaled: c: (last) = 120.
        assert_eq!(data_count3[0][1], serde_json::json!(120)); // Total is 120
        assert_eq!(data_count3[0][2], serde_json::json!(["a", 40])); 
        assert_eq!(data_count3[0][3], serde_json::json!(["b", 80])); 
        assert_eq!(data_count3[0][4], serde_json::json!(["c", 120])); 

        Ok(())
    }
    
    #[test]
    fn test_save_to_json_duplicate_scaling() -> io::Result<()> {
        // Test case where followers would be scaled to the same value with d-scaling
        // This should force a switch to 10^k-1 scaling
        let entries = vec![WordFollowEntry {
            prefix: vec!["duplicate".to_string()],
            followers: vec![
                ("first".to_string(), 1),
                ("second".to_string(), 1),
                ("third".to_string(), 1),
                ("fourth".to_string(), 1),  // With scale_d = 3, these identical counts would create duplicates
            ],
        }];

        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path().to_owned();
        
        // Create metadata
        let metadata = Metadata {
            title: "Duplicate Test".to_string(),
            author: "Duplicate Author".to_string(),
            url: "https://example.com/duplicate".to_string(),
            n: 2,
        };

        // With scale_d = 3, we'd normally use [1,3] scaling
        // But since we have 4 followers with identical counts, they'd get scaled to the same values
        // So we should switch to 10^k-1 scaling (total is 4, so k=1, max_val=9)
        save_to_json(&entries, &path, Some(3), Some(&metadata))?;
        let json_result: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data = json_result.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        // Total count is 4, so k=1, max_val=9
        assert_eq!(data[0][1], serde_json::json!(9));
        
        // Check that values are properly scaled and not duplicates
        let first_val = data[0][2][1].as_u64().unwrap();
        let second_val = data[0][3][1].as_u64().unwrap();
        let third_val = data[0][4][1].as_u64().unwrap();
        let fourth_val = data[0][5][1].as_u64().unwrap();
        
        // Values should be strictly increasing in 10^k-1 scaling
        assert!(first_val < second_val, "Values should be strictly increasing");
        assert!(second_val < third_val, "Values should be strictly increasing");
        assert!(third_val < fourth_val, "Values should be strictly increasing");
        assert_eq!(fourth_val, 9, "Last value should be the maximum");
        
        // Check metadata
        let meta = json_result.get("metadata").expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Duplicate Test");
        assert_eq!(meta.get("author").unwrap(), "Duplicate Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/duplicate");
        assert_eq!(meta.get("n").unwrap(), 2);
        
        // Test edge case with scale_d = 1 and multiple identical followers
        let entries_edge = vec![WordFollowEntry {
            prefix: vec!["edge".to_string()],
            followers: vec![
                ("a".to_string(), 1),
                ("b".to_string(), 1),
            ],
        }];
        
        // Different metadata for edge case
        let metadata_edge = Metadata {
            title: "Edge Test".to_string(),
            author: "Edge Author".to_string(),
            url: "https://example.com/edge".to_string(),
            n: 2,
        };
        
        // With scale_d = 1, we can't scale 2 followers uniquely to [1,1]
        save_to_json(&entries_edge, &path, Some(1), Some(&metadata_edge))?;
        let json_edge: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_edge = json_edge.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        // Should use 10^k-1 scaling (k=1 because total is 2, so max is 9)
        assert_eq!(data_edge[0][1], serde_json::json!(9));
        
        // Another test with mixed counts
        let entries_mixed = vec![WordFollowEntry {
            prefix: vec!["mixed".to_string()],
            followers: vec![
                ("a".to_string(), 1),
                ("b".to_string(), 99),
            ],
        }];
        
        // Different metadata for mixed case
        let metadata_mixed = Metadata {
            title: "Mixed Test".to_string(),
            author: "Mixed Author".to_string(),
            url: "https://example.com/mixed".to_string(),
            n: 2,
        };
        
        // With scale_d = 2, the scaling would be very uneven but should work
        save_to_json(&entries_mixed, &path, Some(2), Some(&metadata_mixed))?;
        let json_mixed: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;
            
        // Extract the data array
        let data_mixed = json_mixed.get("data").expect("Should have data field")
            .as_array().expect("Data should be an array");
        
        // If it used scale_d=2, the total would be 2
        assert_eq!(data_mixed[0][1], serde_json::json!(2));
        assert_eq!(data_mixed[0][2][1], serde_json::json!(1)); // first follower
        assert_eq!(data_mixed[0][3][1], serde_json::json!(2)); // second follower
        
        Ok(())
    }
}
