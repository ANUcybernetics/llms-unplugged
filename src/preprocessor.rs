use std::collections::HashMap;
use std::sync::OnceLock;

/// Returns a reference to the case exception map.
/// These are applied *after* initial lowercasing by the tokenizer.
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
        // Add more exceptions if needed
        map
    })
}

/// Returns a set of lowercase Roman numerals to be filtered.
fn is_roman_numeral(s: &str) -> bool {
    // Simple regex-like approach: check if string contains only roman numeral characters
    // and is not empty
    if s.is_empty() {
        return false;
    }

    // Check if all characters are valid roman numeral characters (lowercase)
    s.chars()
        .all(|c| matches!(c, 'i' | 'v' | 'x' | 'l' | 'c' | 'd' | 'm'))
}

/// Preprocesses a list of tokens:
/// - Applies case exceptions.
/// - Filters out specified Roman numerals.
/// - Filters out the specific string "<|endoftext|>".
pub fn preprocess(tokens: Vec<String>) -> Vec<String> {
    let exceptions = case_exceptions();
    let end_of_text_marker = "<|endoftext|>";

    tokens
        .into_iter()
        .filter_map(|token| {
            // 1. Filter "<|endoftext|>"
            if token == end_of_text_marker {
                return None;
            }

            // 2. Filter Roman numerals (check before applying case exceptions for "i")
            // We assume tokens are already lowercased by the tokenizer.
            // The case exception for "i" to "I" should take precedence if "i" is not part of a larger Roman numeral.
            // If the token is "i", and it's in case_exceptions, it will be processed there.
            // If it's "ii", "iii", etc., it should be caught here.
            if token != "i" && is_roman_numeral(&token) {
                return None;
            }

            // 3. Apply case exceptions
            if let Some(exception_case) = exceptions.get(&token) {
                Some(exception_case.clone())
            } else {
                Some(token) // Return the original token if no exception applies
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preprocess_case_exceptions() {
        let tokens = vec![
            "i".to_string(),
            "think".to_string(),
            "i'm".to_string(),
            "happy".to_string(),
        ];
        let processed = preprocess(tokens);
        assert_eq!(processed, vec!["I", "think", "I'm", "happy"]);
    }

    #[test]
    fn test_preprocess_filters_roman_numerals() {
        let tokens = vec![
            "chapter".to_string(),
            "iv".to_string(), // should be filtered
            "section".to_string(),
            "i".to_string(), // should become "I" due to case exception, not filtered as "i" numeral
            "part".to_string(),
            "x".to_string(), // should be filtered
            "appendix".to_string(),
            "m".to_string(), // should be filtered
            "notaroman".to_string(),
        ];
        let processed = preprocess(tokens);
        assert_eq!(
            processed,
            vec!["chapter", "section", "I", "part", "appendix", "notaroman"]
        );
    }

    #[test]
    fn test_preprocess_filters_endoftext_marker() {
        let tokens = vec![
            "this".to_string(),
            "is".to_string(),
            "<|endoftext|>".to_string(),
            "some".to_string(),
            "text".to_string(),
        ];
        let processed = preprocess(tokens);
        assert_eq!(processed, vec!["this", "is", "some", "text"]);
    }

    #[test]
    fn test_preprocess_combined() {
        let tokens = vec![
            "i".to_string(),             // -> "I"
            "saw".to_string(),           // -> "saw"
            "part".to_string(),          // -> "part"
            "ii".to_string(),            // filtered
            "of".to_string(),            // -> "of"
            "the".to_string(),           // -> "the"
            "book".to_string(),          // -> "book"
            "<|endoftext|>".to_string(), // filtered
            "i'll".to_string(),          // -> "I'll"
            "read".to_string(),          // -> "read"
            "v".to_string(),             // filtered
            "later".to_string(),         // -> "later"
        ];
        let processed = preprocess(tokens);
        assert_eq!(
            processed,
            vec![
                "I", "saw", "part", "of", "the", "book", "I'll", "read", "later"
            ]
        );
    }

    #[test]
    fn test_roman_numeral_i_is_exception_not_filtered() {
        // "i" alone should be treated by case_exceptions, not filtered as a Roman numeral
        let tokens = vec!["i".to_string()];
        let processed = preprocess(tokens);
        assert_eq!(processed, vec!["I"]);

        // "ii", "iii" should be filtered
        let tokens_ii = vec!["ii".to_string()];
        let processed_ii = preprocess(tokens_ii);
        assert_eq!(processed_ii, Vec::<String>::new());

        let tokens_iii = vec!["iii".to_string()];
        let processed_iii = preprocess(tokens_iii);
        assert_eq!(processed_iii, Vec::<String>::new());
    }

    #[test]
    fn test_empty_input() {
        let tokens: Vec<String> = vec![];
        let processed = preprocess(tokens);
        assert_eq!(processed, Vec::<String>::new());
    }

    #[test]
    fn test_no_changes_needed() {
        let tokens = vec!["hello".to_string(), "world".to_string()];
        let processed = preprocess(tokens.clone()); // clone as preprocess consumes
        assert_eq!(processed, tokens);
    }
}
