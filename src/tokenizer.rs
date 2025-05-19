/// Tokenizes a line into normalized words.
/// This function handles basic splitting, lowercasing, and apostrophe normalization/stripping.
pub fn tokenize(line: &str) -> Vec<String> {
    // Normalize specific non-ASCII characters like ’ to '
    let normalized_line = line.replace('’', "'");

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
        }
    }

    // Add the last token if there is one
    if !current_token.is_empty() {
        tokens.push(current_token);
    }

    // Filter any empty tokens, strip apostrophes at beginning and end
    tokens.into_iter()
        .filter(|token| !token.is_empty() && token != "'")
        .map(|token| {
            // Strip apostrophes at beginning and end
            let mut cleaned_token = token; // Already a String

            // Remove leading apostrophe if present
            if cleaned_token.starts_with('\'') {
                cleaned_token.remove(0);
            }

            // Remove trailing apostrophe if present
            // Check length again as it might be a single quote token that became empty
            if !cleaned_token.is_empty() && cleaned_token.ends_with('\'') {
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
        assert_eq!(
            tokens,
            vec!["hello", "world", "this", "is", "a", "test"]
        );
    }

    #[test]
    fn test_tokenize_filters_numbers_and_preserves_contractions() {
        let line = "Version2 and 123numbers shouldn't be filtered. Don't.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["version", "and", "numbers", "shouldn't", "be", "filtered", "don't"]
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
                "said", "so"
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
            vec!["ello", "tis", "twas", "s", "goin", "talkin", "n", "writin", "can't", "don't", "won't"]
        );
    }
    
    #[test]
    fn test_tokenize_complex_case_from_original() {
        let complex_line = "'Bobbie, Bobbie!' she said, 'Come and kiss me, Bobbie!'";
        let complex_tokens = tokenize(complex_line);
        assert_eq!(
            complex_tokens,
            vec!["bobbie", "bobbie", "she", "said", "come", "and", "kiss", "me", "bobbie"]
        );
    }

    #[test]
    fn test_tokenize_non_ascii_apostrophe() {
        let line = "It’s a test with ’90s style goin’ talkin’.";
        let tokens = tokenize(line);
        assert_eq!(
            tokens,
            vec!["it's", "a", "test", "with", "s", "style", "goin", "talkin"]
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
}