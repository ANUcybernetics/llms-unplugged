/// Tokenizes a line into normalized words and punctuation tokens.
/// This function handles basic splitting, lowercasing, apostrophe normalization/stripping,
/// and preserves comma and period as separate tokens.
pub fn tokenize(line: &str) -> Vec<String> {
    // Normalize specific non-ASCII characters like ' to '
    let normalized_line = line.replace("'", "'");

    let mut tokens = Vec::new();
    let mut current_token = String::new();

    // Process character by character
    for c in normalized_line.chars() {
        if c.is_ascii_alphabetic() || c == '\'' {
            // Add alphabetic characters and apostrophes to the current token
            // Convert to lowercase during token building
            current_token.push(c.to_lowercase().next().unwrap_or(c));
        } else {
            // Non-alphabetic and non-apostrophe character ends the current token
            if !current_token.is_empty() {
                tokens.push(current_token.clone());
                current_token.clear();
            }
            
            // Check if the character is a comma or period and add it as a separate token
            if c == ',' {
                tokens.push(",".to_string());
            } else if c == '.' {
                tokens.push(".".to_string());
            }
        }
    }

    // Add the last token if there is one
    if !current_token.is_empty() {
        tokens.push(current_token);
    }

    // Filter any empty tokens, strip apostrophes at beginning and end
    tokens
        .into_iter()
        .filter(|token| !token.is_empty() && token != "'")
        .map(|token| {
            // Strip apostrophes at beginning and end
            let mut cleaned_token = token; // Already a String

            // Repeatedly remove leading apostrophes
            while cleaned_token.starts_with('\'') {
                if cleaned_token.len() == 1 {
                    // Token is just "'" or became "'"
                    cleaned_token.clear(); // Make it empty to be filtered out later
                    break;
                }
                cleaned_token.remove(0);
            }

            // Repeatedly remove trailing apostrophes
            // Check length again as it might have been all apostrophes or became empty
            while !cleaned_token.is_empty() && cleaned_token.ends_with('\'') {
                if cleaned_token.len() == 1 {
                    // Token is just "'" or became "'"
                    cleaned_token.clear(); // Make it empty to be filtered out later
                    break;
                }
                cleaned_token.pop();
            }
            cleaned_token
        })
        .filter(|token| !token.is_empty()) // Ensure we don't have any empty tokens after stripping
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_simple_line() {
        let line = "Hello, world! This is a test.";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["hello", ",", "world", "this", "is", "a", "test", "."]);
    }

    #[test]
    fn test_tokenize_filters_numbers_and_preserves_contractions() {
        let line = "Version2 and 123numbers shouldn't be filtered. Don't.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec![
                "version",
                "and",
                "numbers",
                "shouldn't",
                "be",
                "filtered",
                ".",
                "don't",
                "."
            ]
        );
    }

    #[test]
    fn test_tokenize_special_cases_lowercase() {
        let line = "I think that I am thinking and I'm sure that I said so.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec![
                "i", "think", "that", "i", "am", "thinking", "and", "i'm", "sure", "that", "i",
                "said", "so", "."
            ]
        );
    }

    #[test]
    fn test_tokenize_filters_numbers() {
        let line = "abc123 456def 789 alpha2beta";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["abc", "def", "alpha", "beta"]);
    }

    #[test]
    fn test_tokenize_handles_contractions_lowercase() {
        let line = "Don't can't won't I've I'm you're they'll it's 'quote' he'd we've 'ello goin'";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec![
                "don't", "can't", "won't", "i've", "i'm", "you're", "they'll", "it's", "quote",
                "he'd", "we've", "ello", "goin"
            ]
        );
    }

    #[test]
    fn test_tokenize_handles_apostrophes() {
        let line = "'ello 'tis 'twas '90s goin' talkin' 'n' writin' can't don't won't";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec![
                "ello", "tis", "twas", "s", "goin", "talkin", "n", "writin", "can't", "don't",
                "won't"
            ]
        );
    }

    #[test]
    fn test_tokenize_complex_case_from_original() {
        let complex_line = "'Bobbie, Bobbie!' she said, 'Come and kiss me, Bobbie!'";
        let complex_tokens = tokenize(complex_line);
        assert_eq!(
            complex_tokens,
            vec![
                "bobbie", ",", "bobbie", "she", "said", ",", "come", "and", "kiss", "me", ",", "bobbie"
            ]
        );
    }

    #[test]
    fn test_tokenize_non_ascii_apostrophe() {
        let line = "It’s a test with ’90s style goin’ talkin’.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["it", "s", "a", "test", "with", "s", "style", "goin", "talkin", "."]
        );
    }

    #[test]
    fn test_tokenize_empty_and_edge_cases() {
        assert_eq!(tokenize(""), Vec::<String>::new());
        assert_eq!(tokenize("   "), Vec::<String>::new());
        assert_eq!(tokenize("''"), Vec::<String>::new());
        assert_eq!(tokenize("'"), Vec::<String>::new());
        assert_eq!(tokenize(" ' "), Vec::<String>::new());
        assert_eq!(tokenize("a'"), vec!["a"]);
        assert_eq!(tokenize("'a"), vec!["a"]);
        assert_eq!(tokenize("a'b"), vec!["a'b"]);
        assert_eq!(tokenize(" leading space"), vec!["leading", "space"]);
        assert_eq!(tokenize("trailing space "), vec!["trailing", "space"]);
        assert_eq!(tokenize("token1 token2"), vec!["token", "token"]); // "token1" -> "token"
    }

    #[test]
    fn test_tokenize_double_single_quotes_around_sentence() {
        let line = "''You two are so...''";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["you", "two", "are", "so", ".", ".", "."]);
    }

    #[test]
    fn test_tokenize_single_quote_around_contraction_phrase() {
        let line = "'don't worry daisy'";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["don't", "worry", "daisy"]);
    }

    #[test]
    fn test_tokenize_handles_mixed_quoting_and_contractions() {
        let line = "''I'm not sure,'' she said, '''tis a problem.'";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["i'm", "not", "sure", ",", "she", "said", ",", "tis", "a", "problem", "."]
        );
    }

    #[test]
    fn test_tokenize_single_quotes_within_word_not_stripped() {
        // This case should not occur with current tokenization rules that split on non-alpha/non-apostrophe,
        // but ensures that if a token like "o'clock" was somehow formed, internal apostrophes aren't stripped.
        // The current tokenizer would split "o'clock" into "o" and "clock" if spaces or punctuation surrounded it.
        // However, if we imagine a scenario where it's a single token, this test makes sense.
        // For now, it will likely pass due to how tokens are split.
        let line = "o'clock";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["o'clock"]);
    }

    #[test]
    fn test_tokenize_multiple_leading_and_trailing_apostrophes() {
        let line = "'''word'''";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["word"]);
    }

    #[test]
    fn test_tokenize_apostrophes_only_token() {
        let line = "'''";
        let tokens = tokenize(line);
        assert_eq!(tokens, Vec::<String>::new());
    }

    #[test]
    fn test_tokenize_apostrophe_with_contraction() {
        let line = "''can't''";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["can't"]);
    }

    #[test]
    fn test_tokenize_punctuation_tokens() {
        // Test that commas and periods are preserved as separate tokens
        let line = "Hello, world. How are you, friend?";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["hello", ",", "world", ".", "how", "are", "you", ",", "friend"]);
        
        // Test multiple consecutive punctuation
        let line2 = "Wait... really?!";
        let tokens2 = tokenize(line2);
        assert_eq!(tokens2, vec!["wait", ".", ".", ".", "really"]);
        
        // Test mixed punctuation
        let line3 = "Yes, no. Maybe, sure.";
        let tokens3 = tokenize(line3);
        assert_eq!(tokens3, vec!["yes", ",", "no", ".", "maybe", ",", "sure", "."]);
        
        // Test that other punctuation is still ignored
        let line4 = "Hello! World? Test: example; done-";
        let tokens4 = tokenize(line4);
        assert_eq!(tokens4, vec!["hello", "world", "test", "example", "done"]);
    }
}
