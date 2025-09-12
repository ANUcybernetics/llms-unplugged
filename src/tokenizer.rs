/// Tokenizes a line into words and punctuation tokens, preserving original capitalization.
/// 
/// Rules:
/// 1. Strip all punctuation except comma, period, and apostrophes in contractions/possessives
/// 2. Split on whitespace, with comma/period as separate tokens
/// 3. **Preserve original capitalization** (normalization happens later in NGramCounter)
/// 4. Remove tokens starting with digits
/// 5. Strip quote apostrophes but keep contraction/possessive apostrophes
/// 
/// Note: This function returns tokens with their original capitalization intact.
/// The NGramCounter handles smart normalization based on consistency.
pub fn tokenize(line: &str) -> Vec<String> {
    // Normalize specific non-ASCII apostrophes  
    let normalized_line = line.replace("'", "'");
    
    let mut tokens = Vec::new();
    let mut current_token = String::new();
    
    for c in normalized_line.chars() {
        match c {
            // Letters and apostrophes can be part of words
            c if c.is_ascii_alphabetic() => {
                current_token.push(c);  // Keep original case
            }
            '\'' => {
                // Apostrophes are included in the token
                current_token.push('\'');
            }
            // Comma and period end current token and become their own tokens
            ',' => {
                if !current_token.is_empty() {
                    tokens.push(current_token.clone());
                    current_token.clear();
                }
                tokens.push(",".to_string());
            }
            '.' => {
                if !current_token.is_empty() {
                    tokens.push(current_token.clone());
                    current_token.clear();
                }
                tokens.push(".".to_string());
            }
            // Any other character (including digits and spaces) ends the current token
            _ => {
                if !current_token.is_empty() {
                    tokens.push(current_token.clone());
                    current_token.clear();
                }
            }
        }
    }
    
    // Add any remaining token
    if !current_token.is_empty() {
        tokens.push(current_token);
    }
    
    // Filter and clean tokens
    tokens
        .into_iter()
        .filter_map(|mut token| {
            // Strip leading apostrophes (quote marks)
            while token.starts_with('\'') {
                token.remove(0);
                if token.is_empty() {
                    return None;
                }
            }
            
            // Strip trailing apostrophes that are quote marks
            // Keep apostrophes that are part of possessives/contractions
            while token.ends_with('\'') && token.len() > 1 {
                let chars: Vec<char> = token.chars().collect();
                let len = chars.len();
                
                // Check patterns for possessive/contraction apostrophes to keep:
                // 1. Word ending in 's (possessive, like bird's)
                // 2. Word ending in s' (plural possessive, like birds')
                // 3. Word ending in n't (contraction, like don't)
                // 4. Word ending in 'll, 've, 're, 'd, 'm (contractions)
                // 5. Word ending in in', an', o' (informal contractions like goin')
                
                if len >= 2 && chars[len - 2] == 's' && chars[len - 1] == '\'' {
                    // Ends with s' (plural possessive)
                    break;
                }
                
                if len >= 3 {
                    let last_three: String = chars[len - 3..].iter().collect();
                    if last_three == "n't" || last_three == "'ll" || last_three == "'ve" || 
                       last_three == "'re" || last_three == "'d" || last_three == "in'" ||
                       last_three == "an'" {
                        // Common contractions
                        break;
                    }
                }
                
                if len >= 2 {
                    let last_two: String = chars[len - 2..].iter().collect();
                    if last_two == "'s" || last_two == "'m" || last_two == "o'" || last_two == "n'" {
                        // Possessive or contraction
                        break;
                    }
                }
                
                // Not a recognized possessive/contraction pattern, strip the apostrophe
                token.pop();
                if token.is_empty() {
                    return None;
                }
            }
            
            // Filter tokens starting with digits
            if !token.is_empty() && token.chars().next().unwrap().is_ascii_digit() {
                return None;
            }
            
            // Return the token if not empty
            if !token.is_empty() {
                Some(token)
            } else {
                None
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_simple_line() {
        let line = "Hello, world! This is a test.";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["Hello", ",", "world", "This", "is", "a", "test", "."]);
    }

    #[test]
    fn test_tokenize_filters_numbers_and_preserves_contractions() {
        let line = "Version2 and 123numbers shouldn't be filtered. Don't.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec![
                "Version",
                "and",
                "numbers",
                "shouldn't",
                "be",
                "filtered",
                ".",
                "Don't",
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
                "I", "think", "that", "I", "am", "thinking", "and", "I'm", "sure", "that", "I",
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
                "Don't", "can't", "won't", "I've", "I'm", "you're", "they'll", "it's", "quote",
                "he'd", "we've", "ello", "goin'"
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
                "ello", "tis", "twas", "s", "goin'", "talkin'", "n'", "writin'", "can't", "don't",
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
                "Bobbie", ",", "Bobbie", "she", "said", ",", "Come", "and", "kiss", "me", ",", "Bobbie"
            ]
        );
    }

    #[test]
    fn test_tokenize_non_ascii_apostrophe() {
        let line = "It's a test with '90s style goin' talkin'.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["It's", "a", "test", "with", "s", "style", "goin'", "talkin'", "."]
        );
    }

    #[test]
    fn test_tokenize_empty_and_edge_cases() {
        assert_eq!(tokenize(""), Vec::<String>::new());
        assert_eq!(tokenize("   "), Vec::<String>::new());
        assert_eq!(tokenize("''"), Vec::<String>::new());
        assert_eq!(tokenize("'"), Vec::<String>::new());
        assert_eq!(tokenize(" ' "), Vec::<String>::new());
        assert_eq!(tokenize("a'"), vec!["a"]);  // Trailing quote apostrophe stripped
        assert_eq!(tokenize("'a"), vec!["a"]);  // Leading quote apostrophe stripped
        assert_eq!(tokenize("a'b"), vec!["a'b"]);  // Internal apostrophe kept
        assert_eq!(tokenize(" leading space"), vec!["leading", "space"]);
        assert_eq!(tokenize("trailing space "), vec!["trailing", "space"]);
        assert_eq!(tokenize("token1 token2"), vec!["token", "token"]); // Numbers filtered
    }

    #[test]
    fn test_tokenize_double_single_quotes_around_sentence() {
        let line = "''You two are so...''";
        let tokens = tokenize(line);
        assert_eq!(tokens, vec!["You", "two", "are", "so", ".", ".", "."]);
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
            vec!["I'm", "not", "sure", ",", "she", "said", ",", "tis", "a", "problem", "."]
        );
    }

    #[test]
    fn test_tokenize_single_quotes_within_word_not_stripped() {
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
        assert_eq!(tokens, vec!["Hello", ",", "world", ".", "How", "are", "you", ",", "friend"]);
        
        // Test multiple consecutive punctuation
        let line2 = "Wait... really?!";
        let tokens2 = tokenize(line2);
        assert_eq!(tokens2, vec!["Wait", ".", ".", ".", "really"]);
        
        // Test mixed punctuation
        let line3 = "Yes, no. Maybe, sure.";
        let tokens3 = tokenize(line3);
        assert_eq!(tokens3, vec!["Yes", ",", "no", ".", "Maybe", ",", "sure", "."]);
        
        // Test that other punctuation is still ignored
        let line4 = "Hello! World? Test: example; done-";
        let tokens4 = tokenize(line4);
        assert_eq!(tokens4, vec!["Hello", "World", "Test", "example", "done"]);
    }
    
    #[test]
    fn test_possessive_apostrophes() {
        let line = "The bird's nest and the birds' nests. James's book.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["The", "bird's", "nest", "and", "the", "birds'", "nests", ".", "James's", "book", "."]
        );
    }
    
    #[test]
    fn test_mixed_numbers_and_apostrophes() {
        let line = "The 1980's were great but '80s is shorter";
        let tokens = tokenize(line);
        // 1980's becomes "s" after filtering "1980"
        // '80s becomes "s" after filtering "80"
        assert_eq!(
            tokens,
            vec!["The", "s", "were", "great", "but", "s", "is", "shorter"]
        );
    }
    
    #[test]
    fn test_contractions_at_start() {
        // Leading apostrophes are stripped, so 'tis becomes tis
        let line = "'Tis the season, 'twas the night";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["Tis", "the", "season", ",", "twas", "the", "night"]
        );
    }
    
    #[test]
    fn test_roman_numerals_later_filtered() {
        // These should tokenize fine here, but be filtered in preprocessing
        let line = "Chapter IV: Section III and Appendix VII.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["Chapter", "IV", "Section", "III", "and", "Appendix", "VII", "."]
        );
    }
}