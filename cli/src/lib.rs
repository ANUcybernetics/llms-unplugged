use frontmatter_gen::extract;
use serde::Serialize;
use std::collections::HashMap;
use std::collections::VecDeque;
use std::fs::File;
use std::io;
use std::path::Path;

// New module declarations
mod preprocessor;
mod tokenizer;

// Use functions from new modules
use preprocessor::preprocess;
use tokenizer::tokenize;

/// Helper function to get model type string (e.g., "bigram", "trigram")
pub fn model_type_str(n: usize) -> String {
    match n {
        1 => "unigram".to_string(),
        2 => "bigram".to_string(),
        3 => "trigram".to_string(),
        _ => format!("{}-gram", n),
    }
}

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
    /// Subtitle for the booklet (e.g., "A bigram language model" or "A trigram language model: A-K (Book 1 of 3)")
    pub subtitle: String,
    /// CLI version used to generate this model
    pub version: String,
    /// Summary statistics for the processed text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stats: Option<ProcessingStats>,
}

/// Contains summary statistics for processed text
#[derive(Debug, Clone, Serialize)]
pub struct ProcessingStats {
    /// Total number of tokens in the text
    pub total_tokens: usize,
    /// Total number of unique n-grams found
    pub unique_ngrams: usize,
    /// Total number of n-gram occurrences
    pub total_ngram_occurrences: usize,
    /// Most common n-gram prefix and its most common follower
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_common_ngram: Option<(Vec<String>, String, usize)>,
    /// Prefix with the most cumulative followers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub most_popular_prefix: Option<(Vec<String>, usize)>,
}

/// Represents an N-gram prefix and its following words with their counts
#[derive(Serialize, Debug, PartialEq, Eq, Hash, Clone)] // Added Eq, Hash, Clone for HashMap key
pub struct NGramPrefix(Vec<String>); // Wrapper struct for clarity and potential future methods

#[derive(Serialize, Debug, PartialEq, Clone)]
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
    /// Maps lowercase token -> canonical form (either original case or lowercase if multiple variants seen)
    canonical_forms: HashMap<String, String>,
    /// Punctuation characters to preserve as separate tokens
    punctuation: Vec<char>,
}

impl NGramCounter {
    /// Creates a new NGramCounter with the specified n-gram size and punctuation chars
    pub fn new(n: usize, punctuation: Vec<char>) -> Self {
        if n < 2 {
            eprintln!("Warning: N must be 2 or greater for N-gram analysis. Defaulting to 2.");
            return Self::new(2, punctuation);
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
            canonical_forms: HashMap::new(),
            punctuation,
        }
    }

    /// Get the canonical form of a token, updating tracking if needed
    fn get_canonical_form(&mut self, token: &str) -> String {
        let lowercase = token.to_lowercase();

        // Special case: "I" should never be normalized to lowercase
        if lowercase == "i" {
            return token.to_string(); // Keep original form, will be fixed in preprocessing
        }

        // Check if we've seen this token before (in any form)
        match self.canonical_forms.get(&lowercase) {
            Some(canonical) if canonical != token => {
                // Different capitalization seen - switch to lowercase
                self.canonical_forms
                    .insert(lowercase.clone(), lowercase.clone());
                lowercase
            }
            Some(canonical) => {
                // Same form seen before
                canonical.clone()
            }
            None => {
                // First time seeing this token - store original form
                self.canonical_forms
                    .insert(lowercase.clone(), token.to_string());
                token.to_string()
            }
        }
    }

    /// Process a single line of text
    pub fn process_line(&mut self, line: &str) {
        let raw_tokens = tokenize(line, &self.punctuation);

        // Apply canonical form tracking before preprocessing
        let canonical_tokens: Vec<String> = raw_tokens
            .into_iter()
            .map(|token| self.get_canonical_form(&token))
            .collect();

        let words = preprocess(canonical_tokens);
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
                        subtitle: format!("A {} language model", model_type_str(self.n)),
                        version: env!("CARGO_PKG_VERSION").to_string(),
                        stats: None, // Will be set during save_to_json
                    });
                } else {
                    // Missing required fields, return error
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        "Frontmatter missing required fields (title, author, url).",
                    ));
                }
            }
            Err(_) => {
                // Failed to extract frontmatter, return error
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "No valid YAML frontmatter found. Input must start with '---', contain valid YAML key-value pairs, and end with '---'.",
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
        // Apply final canonical forms to all entries
        let mut normalized_map: HashMap<Vec<String>, HashMap<String, usize>> = HashMap::new();

        for (prefix, followers) in &self.prefix_map {
            // Normalize each word in the prefix using the final canonical forms
            let normalized_prefix: Vec<String> = prefix
                .iter()
                .map(|word| {
                    // The canonical form should always exist since we track everything
                    let lowercase = word.to_lowercase();
                    self.canonical_forms.get(&lowercase).unwrap_or(word).clone()
                })
                .collect();

            // Normalize followers too
            let normalized_followers = followers.iter().map(|(word, count)| {
                let lowercase = word.to_lowercase();
                let canonical = self
                    .canonical_forms
                    .get(&lowercase)
                    .cloned()
                    .unwrap_or_else(|| word.clone());
                (canonical, *count)
            });

            // Merge into normalized map
            let entry = normalized_map
                .entry(normalized_prefix)
                .or_insert_with(HashMap::new);
            for (word, count) in normalized_followers {
                *entry.entry(word).or_insert(0) += count;
            }
        }

        let mut result = convert_to_entries(&normalized_map);

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
    let punctuation = vec![',', '.'];
    let mut counter = NGramCounter::new(n, punctuation);
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
                b.1.cmp(&a.1)
                    .then_with(|| a.0.to_lowercase().cmp(&b.0.to_lowercase()))
            });

            WordFollowEntry {
                prefix: prefix.clone(), // Changed from word
                followers: follower_entries,
            }
        })
        .collect()
}

/// Splits entries into multiple books based on estimated rendered size
pub fn split_entries_into_books(
    entries: &[WordFollowEntry],
    num_books: usize,
) -> Vec<(String, Vec<WordFollowEntry>)> {
    if num_books <= 1 {
        // No splitting, return all entries in one book
        return vec![("".to_string(), entries.to_vec())];
    }

    // Group entries by first letter and calculate cumulative character counts
    let mut letter_groups = Vec::new();
    let mut current_letter = String::new();
    let mut current_start_idx = 0;
    let mut cumulative_chars = 0usize;

    for (i, entry) in entries.iter().enumerate() {
        let first_letter = entry.prefix[0]
            .chars()
            .next()
            .unwrap_or('?')
            .to_lowercase()
            .to_string();

        // Calculate total characters for this entry (prefix + all followers with counts)
        let prefix_chars: usize = entry.prefix.iter().map(|s| s.len()).sum();
        let follower_chars: usize = entry
            .followers
            .iter()
            .map(|(word, count)| word.len() * count)
            .sum();
        let entry_chars = prefix_chars + follower_chars;

        // When letter changes, record the group
        if first_letter != current_letter && !current_letter.is_empty() {
            letter_groups.push((
                current_start_idx,
                i,
                current_letter.clone(),
                cumulative_chars,
            ));
            current_start_idx = i;
        }

        if first_letter != current_letter {
            current_letter = first_letter;
        }
        cumulative_chars += entry_chars;
    }

    // Add final group
    if !current_letter.is_empty() {
        letter_groups.push((
            current_start_idx,
            entries.len(),
            current_letter,
            cumulative_chars,
        ));
    }

    let total_chars = cumulative_chars;
    let target_per_book = total_chars / num_books;

    // Calculate target thresholds for each book
    let thresholds: Vec<usize> = (1..num_books).map(|i| target_per_book * i).collect();

    // Find the first letter group that exceeds each threshold
    let mut split_indices = vec![0];
    let mut group_idx = 0;

    for threshold in thresholds {
        // Find first group whose cumulative chars exceeds this threshold
        while group_idx < letter_groups.len() && letter_groups[group_idx].3 <= threshold {
            group_idx += 1;
        }

        if group_idx < letter_groups.len() {
            split_indices.push(letter_groups[group_idx].1);
            group_idx += 1; // Move past this split for the next threshold
        }
    }

    split_indices.push(entries.len());

    // Build books from the split indices
    let mut books = Vec::new();

    for i in 0..split_indices.len() - 1 {
        let start_idx = split_indices[i];
        let end_idx = split_indices[i + 1];

        if start_idx >= end_idx {
            continue; // Skip empty ranges
        }

        let book_entries: Vec<WordFollowEntry> = entries[start_idx..end_idx].to_vec();

        // Determine the letter range for this book
        let start_letter = book_entries[0].prefix[0]
            .chars()
            .next()
            .unwrap_or('?')
            .to_lowercase()
            .to_string();

        let end_letter = book_entries[book_entries.len() - 1].prefix[0]
            .chars()
            .next()
            .unwrap_or('?')
            .to_lowercase()
            .to_string();

        let book_name = if start_letter == end_letter {
            start_letter.to_uppercase()
        } else {
            format!(
                "{}-{}",
                start_letter.to_uppercase(),
                end_letter.to_uppercase()
            )
        };

        books.push((book_name, book_entries));
    }

    books
}

/// Saves the N-gram follow entries to a JSON file
pub fn save_to_json<P: AsRef<Path>>(
    entries: &[WordFollowEntry],
    path: P,
    metadata: Option<&Metadata>,
    stats: Option<&ProcessingStats>,
    raw: bool,
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
            let _num_unique_followers = entry.followers.len();

            // Calculate original cumulative counts
            let mut original_cumulative_counts = Vec::new();
            let mut running_sum = 0;

            for (follower, count) in &entry.followers {
                running_sum += count;
                original_cumulative_counts.push((follower.clone(), running_sum));
            }

            // Determine scaling strategy and apply it
            let (json_total_for_prefix, scaled_follower_values_json) = if total_original_count == 0
            {
                // If there are no follower occurrences, total is 0, no follower data.
                (serde_json::json!(0), Vec::new())
            } else if raw {
                // Raw output mode - no scaling
                let actual_json_total = serde_json::json!(total_original_count);
                let followers_json_list: Vec<serde_json::Value> = original_cumulative_counts
                    .iter()
                    .map(|(follower_word, original_cumul)| {
                        serde_json::json!([follower_word, original_cumul])
                    })
                    .collect();
                (actual_json_total, followers_json_list)
            } else {
                // Always use 10^k-1 scaling for d10 (0-9 range on each die)
                // k is the number of digits in total_original_count
                let k_digits = total_original_count.to_string().len() as u32;
                // max_val is 10^k_digits - 1 (e.g., if count is 75, k=2, max_val=99)
                let max_val_for_scaling = 10_u32.pow(k_digits).saturating_sub(1);

                let actual_json_total = serde_json::json!(max_val_for_scaling);
                let scaling_factor = max_val_for_scaling as f64 / total_original_count as f64;

                let followers_json_list: Vec<serde_json::Value> = original_cumulative_counts
                    .iter()
                    .map(|(follower_word, original_cumul)| {
                        let scaled_cumul =
                            (*original_cumul as f64 * scaling_factor).round() as usize;
                        serde_json::json!([follower_word, scaled_cumul])
                    })
                    .collect();
                (actual_json_total, followers_json_list)
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
        // Clone metadata and add stats
        let mut meta_with_stats = meta.clone();
        meta_with_stats.stats = stats.cloned();
        output.insert(
            "metadata".to_string(),
            serde_json::to_value(meta_with_stats)?,
        );
    } else {
        // Create minimal metadata with just the n value
        let mut meta_map = serde_json::Map::new();
        meta_map.insert(
            "n".to_string(),
            serde_json::Value::Number(serde_json::Number::from(entries[0].prefix.len() + 1)),
        );
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
    use std::io::{BufReader, Write};
    use tempfile::NamedTempFile;

    #[test]
    fn test_follower_sort_order() {
        // Test the sorting of followers by count (largest to smallest)
        let mut counter = NGramCounter::new(2, vec![',', '.']);
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
        let mut counter2 = NGramCounter::new(2, vec![',', '.']);
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
            // Test capitalization: "Hello" appears twice (consistent) -> stays "Hello"
            // "Number123" -> "Number" (digits removed), "!" is not preserved
            writeln!(
                file,
                "Hello world. Hello again world! Number123 will be ignored."
            )?;
            file.flush()?;
        }

        // Process with n=2 for bigrams
        let (entries, stats, metadata) = process_file(&path, 2)?;

        // Expected tokens: "hello", "world", ".", "hello", "again", "world", "number", "will", "be", "ignored", "."
        // Expected unique prefixes (n-1=1):
        // "hello" -> "world" (1), "again" (1)
        // "world" -> "." (1), "number" (1)
        // "." -> "hello" (1)
        // "again" -> "world" (1)
        // "number" -> "will" (1)
        // "will" -> "be" (1)
        // "be" -> "ignored" (1)
        // "ignored" -> "." (1)
        // Total 8 unique prefixes
        assert_eq!(
            entries.len(),
            8,
            "Expected 8 unique bigram prefixes. Got: {:?}",
            entries
        );

        // Check prefix ["Hello"] - preserved since consistent capitalization
        let hello_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["Hello".to_string()])
            .expect("Prefix ['Hello'] not found in entries");
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
        // "world" appears twice: "Hello world." and "again world!"
        // Since "!" is not preserved, second "world" is followed by "Number"
        let world_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["world".to_string()])
            .expect("Prefix ['world'] not found in entries");
        assert_eq!(
            world_entry.followers.len(),
            2,
            "Expected 'world' to have 2 followers, got: {:?}",
            world_entry.followers
        );
        assert!(
            world_entry
                .followers
                .iter()
                .any(|(word, count)| word == "." && *count == 1),
            "Expected 'world' to be followed by '.'"
        );
        assert!(
            world_entry
                .followers
                .iter()
                .any(|(word, count)| word == "Number" && *count == 1),
            "Expected 'world' to be followed by 'Number'"
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

        // Check prefix ["Number"] - preserved capitalization
        let number_entry = entries
            .iter()
            .find(|e| e.prefix == vec!["Number".to_string()])
            .expect("Prefix ['Number'] not found in entries");
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
            stats.total_tokens, 11,
            "Expected 11 tokens: hello, world, ., hello, again, world, number, will, be, ignored, ."
        );
        assert_eq!(
            stats.unique_ngrams, 8,
            "Expected 8 unique prefixes: hello, world, ., again, number, will, be, ignored"
        );
        assert_eq!(
            stats.total_ngram_occurrences, 10,
            "Expected 10 total bigram occurrences"
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
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

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
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Bigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/bigrams");
        assert_eq!(meta.get("n").unwrap(), 2);

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
            subtitle: "A trigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        // Both entries: total_original_count=1 (k=1, max_val=9)
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

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
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Test Trigrams");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/trigrams");
        assert_eq!(meta.get("n").unwrap(), 3);

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
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with default 10^k-1 scaling
        // total_original_count=10 (k=2, max_val=99). Factor = 9.9
        // Original cumulative: dog:5, cat:8 (5+3), bird:10 (8+2)
        save_to_json(&entries, &path, Some(&metadata), None, false)?;
        let json_none: serde_json::Value =
            serde_json::from_reader(BufReader::new(File::open(&path)?))?;

        // Extract the data array
        let data = json_none
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        assert_eq!(data.len(), 1);
        assert_eq!(data[0][0], serde_json::json!("the"));
        assert_eq!(data[0][1], serde_json::json!(99)); // Total scaled to 99
        assert_eq!(
            data[0][2],
            serde_json::json!(["dog", (5.0_f64 * 9.9_f64).round() as u64])
        ); // 50
        assert_eq!(
            data[0][3],
            serde_json::json!(["cat", (8.0_f64 * 9.9_f64).round() as u64])
        ); // 79
        assert_eq!(
            data[0][4],
            serde_json::json!(["bird", (10.0_f64 * 9.9_f64).round() as u64])
        ); // 99

        // Check metadata
        let meta = json_none
            .get("metadata")
            .expect("Should have metadata field");
        assert_eq!(meta.get("title").unwrap(), "Cumulative Test");
        assert_eq!(meta.get("author").unwrap(), "Test Author");
        assert_eq!(meta.get("url").unwrap(), "https://example.com/cumulative");
        assert_eq!(meta.get("n").unwrap(), 2);

        Ok(())
    }

    #[test]
    fn test_save_to_json_raw_output() -> Result<(), Box<dyn std::error::Error>> {
        use serde_json::Value;
        use std::fs;
        use tempfile::NamedTempFile;

        // Create test entries with known counts
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["the".to_string()],
                followers: vec![
                    ("dog".to_string(), 3),
                    ("cat".to_string(), 2),
                    ("bird".to_string(), 1),
                ],
            },
            WordFollowEntry {
                prefix: vec!["a".to_string()],
                followers: vec![("house".to_string(), 5), ("tree".to_string(), 4)],
            },
        ];

        let metadata = Metadata {
            title: "Test Document".to_string(),
            author: "Test Author".to_string(),
            url: "https://test.com".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test with raw=true (no scaling)
        let temp_file = NamedTempFile::new()?;
        let path = temp_file.path();

        save_to_json(&entries, &path, Some(&metadata), None, true)?;

        let content = fs::read_to_string(&path)?;
        let json: Value = serde_json::from_str(&content)?;

        // Check the data array
        let data = json
            .get("data")
            .expect("Should have data field")
            .as_array()
            .expect("Data should be an array");

        // First entry: "the" with raw cumulative counts
        assert_eq!(data[0][0], serde_json::json!("the"));
        assert_eq!(data[0][1], serde_json::json!(6)); // Total: 3+2+1=6
        assert_eq!(data[0][2], serde_json::json!(["dog", 3])); // Raw cumulative: 3
        assert_eq!(data[0][3], serde_json::json!(["cat", 5])); // Raw cumulative: 3+2=5
        assert_eq!(data[0][4], serde_json::json!(["bird", 6])); // Raw cumulative: 3+2+1=6

        // Second entry: "a" with raw cumulative counts
        assert_eq!(data[1][0], serde_json::json!("a"));
        assert_eq!(data[1][1], serde_json::json!(9)); // Total: 5+4=9
        assert_eq!(data[1][2], serde_json::json!(["house", 5])); // Raw cumulative: 5
        assert_eq!(data[1][3], serde_json::json!(["tree", 9])); // Raw cumulative: 5+4=9

        Ok(())
    }

    #[test]
    fn test_save_to_json_raw_vs_scaled() -> Result<(), Box<dyn std::error::Error>> {
        use serde_json::Value;
        use std::fs;
        use tempfile::NamedTempFile;

        // Create test entries
        let entries = vec![WordFollowEntry {
            prefix: vec!["test".to_string()],
            followers: vec![
                ("word1".to_string(), 10),
                ("word2".to_string(), 8),
                ("word3".to_string(), 7),
            ],
        }];

        let metadata = Metadata {
            title: "Test".to_string(),
            author: "Test".to_string(),
            url: "https://test.com".to_string(),
            n: 2,
            subtitle: "A bigram language model".to_string(),
            version: "test".to_string(),
            stats: None,
        };

        // Test raw output
        let raw_file = NamedTempFile::new()?;
        save_to_json(&entries, raw_file.path(), Some(&metadata), None, true)?;

        let raw_content = fs::read_to_string(raw_file.path())?;
        let raw_json: Value = serde_json::from_str(&raw_content)?;
        let raw_data = raw_json.get("data").unwrap().as_array().unwrap();

        // Check raw values
        assert_eq!(raw_data[0][1], serde_json::json!(25)); // Total: 10+8+7=25
        assert_eq!(raw_data[0][2][1], serde_json::json!(10)); // First cumulative
        assert_eq!(raw_data[0][3][1], serde_json::json!(18)); // Second cumulative
        assert_eq!(raw_data[0][4][1], serde_json::json!(25)); // Third cumulative

        // Test scaled output (default scaling)
        let scaled_file = NamedTempFile::new()?;
        save_to_json(&entries, scaled_file.path(), Some(&metadata), None, false)?;

        let scaled_content = fs::read_to_string(scaled_file.path())?;
        let scaled_json: Value = serde_json::from_str(&scaled_content)?;
        let scaled_data = scaled_json.get("data").unwrap().as_array().unwrap();

        // With total 25, should scale to [0, 99] range
        assert_eq!(scaled_data[0][1], serde_json::json!(99)); // Scaled total

        // Values should be different from raw
        assert_ne!(scaled_data[0][2][1], raw_data[0][2][1]);
        assert_ne!(scaled_data[0][3][1], raw_data[0][3][1]);
        assert_ne!(scaled_data[0][4][1], raw_data[0][4][1]);

        Ok(())
    }

    #[test]
    fn test_split_entries_into_books() {
        // Create test entries with various prefixes
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["apple".to_string()],
                followers: vec![("pie".to_string(), 3), ("juice".to_string(), 2)],
            },
            WordFollowEntry {
                prefix: vec!["banana".to_string()],
                followers: vec![("split".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["cherry".to_string()],
                followers: vec![("pie".to_string(), 2)],
            },
            WordFollowEntry {
                prefix: vec!["date".to_string()],
                followers: vec![("palm".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["elderberry".to_string()],
                followers: vec![("wine".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["fig".to_string()],
                followers: vec![("tree".to_string(), 2)],
            },
            WordFollowEntry {
                prefix: vec!["grape".to_string()],
                followers: vec![("vine".to_string(), 3), ("juice".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["honeydew".to_string()],
                followers: vec![("melon".to_string(), 1)],
            },
        ];

        // Test with no splitting (1 book)
        let books = split_entries_into_books(&entries, 1);
        assert_eq!(books.len(), 1);
        assert_eq!(books[0].0, "");
        assert_eq!(books[0].1.len(), 8);

        // Test with 2 books
        let books = split_entries_into_books(&entries, 2);
        assert_eq!(books.len(), 2);
        // First book should contain entries starting with a-d/e
        assert!(books[0].0.contains("-") || books[0].0.len() == 1);
        // Second book should contain remaining entries
        assert!(books[1].0.contains("-") || books[1].0.len() == 1);
        // Total entries should be preserved
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 8);

        // Test with 3 books - the algorithm may decide 2 or 3 books is optimal
        let books = split_entries_into_books(&entries, 3);
        assert!(
            books.len() >= 2 && books.len() <= 3,
            "Expected 2 or 3 books, got {}",
            books.len()
        );
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 8);

        // Test that entries are not duplicated or lost
        for book in &books {
            for entry in &book.1 {
                // Check that each entry appears in original list
                assert!(entries.iter().any(|e| e.prefix == entry.prefix));
            }
        }
    }

    #[test]
    fn test_split_entries_balanced() {
        // Create entries with uneven distribution of followers
        let entries = vec![
            WordFollowEntry {
                prefix: vec!["a".to_string()],
                followers: vec![("x".to_string(), 100)], // Heavy entry
            },
            WordFollowEntry {
                prefix: vec!["b".to_string()],
                followers: vec![("y".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["c".to_string()],
                followers: vec![("z".to_string(), 1)],
            },
            WordFollowEntry {
                prefix: vec!["d".to_string()],
                followers: vec![("w".to_string(), 100)], // Heavy entry
            },
        ];

        // Split into 2 books - should balance by follower count
        let books = split_entries_into_books(&entries, 2);

        // Debug output
        eprintln!("Books created: {}", books.len());
        for (name, entries) in &books {
            eprintln!("  Book '{}': {} entries", name, entries.len());
        }

        assert_eq!(books.len(), 2);

        // Both books should have entries
        assert!(books[0].1.len() > 0);
        assert!(books[1].1.len() > 0);

        // Total entries preserved
        let total_entries: usize = books.iter().map(|(_, entries)| entries.len()).sum();
        assert_eq!(total_entries, 4);
    }
}
