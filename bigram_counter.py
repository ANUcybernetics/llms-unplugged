#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["typer"]
# ///

"""
Bigram counter that tokenizes text and generates a bigram frequency matrix.

Tokenization rules:
- Strip all punctuation except apostrophes
- Treat hyphens as whitespace
- Downcase all words except "I" which remains uppercase
- Remove numbers and roman numerals
- Remove empty tokens
"""

import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterator

import typer


def tokenise_text(text: str) -> list[str]:
    """
    Tokenise text according to specific rules.
    
    Args:
        text: Input text to tokenise
        
    Returns:
        List of processed tokens
    """
    # Replace hyphens with spaces
    text = text.replace('-', ' ')
    
    # Remove all punctuation except apostrophes
    # This regex keeps letters, numbers, apostrophes, and whitespace
    text = re.sub(r"[^\w\s']", '', text)
    
    # Split into tokens
    tokens = text.split()
    
    # Regex to match roman numerals (lowercase)
    roman_pattern = re.compile(r'^m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$')
    
    # Process each token
    processed_tokens = []
    for token in tokens:
        if not token:  # Skip empty tokens
            continue
        
        # Strip leading and trailing single quotes (quote marks)
        # But keep internal apostrophes
        token = token.strip("'")
        
        if not token:  # Skip if stripping quotes left nothing
            continue
            
        # Downcase everything except "I"
        if token.upper() == 'I':
            processed = 'I'
        else:
            processed = token.lower()
        
        # Skip tokens that start with a number (includes pure numbers)
        if processed and processed[0].isdigit():
            continue
            
        # Skip roman numerals (check after downcasing)
        if roman_pattern.match(processed):
            continue
        
        processed_tokens.append(processed)
    
    return processed_tokens


def extract_bigrams(tokens: list[str]) -> Iterator[tuple[str, str]]:
    """
    Generate bigrams (consecutive word pairs) from a list of tokens.
    
    Args:
        tokens: List of word tokens
        
    Yields:
        Tuples of consecutive words
    """
    for i in range(len(tokens) - 1):
        yield (tokens[i], tokens[i + 1])


def count_bigrams(tokens: list[str]) -> dict[tuple[str, str], int]:
    """
    Count occurrences of bigrams in the token list.
    
    Args:
        tokens: List of word tokens
        
    Returns:
        Dictionary mapping bigrams to their counts
    """
    return Counter(extract_bigrams(tokens))


def create_bigram_matrix(
    bigram_counts: dict[tuple[str, str], int]
) -> tuple[list[str], dict[str, dict[str, int]]]:
    """
    Create a matrix representation of bigram counts.
    
    Args:
        bigram_counts: Dictionary of bigram counts
        
    Returns:
        Tuple of (sorted vocabulary, matrix as nested dict)
    """
    # Extract unique words from all bigrams
    vocabulary = set()
    for first_word, second_word in bigram_counts.keys():
        vocabulary.add(first_word)
        vocabulary.add(second_word)
    
    # Sort vocabulary for consistent output
    sorted_vocab = sorted(vocabulary)
    
    # Build matrix as nested dictionary
    matrix = defaultdict(lambda: defaultdict(int))
    for (first_word, second_word), count in bigram_counts.items():
        matrix[first_word][second_word] = count
    
    return sorted_vocab, dict(matrix)


def output_tsv_matrix(
    vocabulary: list[str],
    matrix: dict[str, dict[str, int]]
) -> None:
    """
    Output the bigram matrix as a tab-separated table.
    
    The format is:
    - First row: empty cell, then all vocabulary words
    - Subsequent rows: word, then cumulative counts along the row
    - Empty cells for zero counts
    
    Args:
        vocabulary: Sorted list of unique words
        matrix: Nested dictionary of bigram counts
    """
    # Print header row
    header = [''] + vocabulary
    print('\t'.join(header))
    
    # Print each row with cumulative counts
    for first_word in vocabulary:
        row = [first_word]
        cumulative = 0
        for second_word in vocabulary:
            count = matrix.get(first_word, {}).get(second_word, 0)
            if count > 0:
                cumulative += count
                row.append(str(cumulative))
            else:
                row.append('')
        print('\t'.join(row))


def main(
    filename: Path = typer.Argument(
        ...,
        help="Path to the text file to process",
        exists=True,
        file_okay=True,
        dir_okay=False,
        readable=True
    )
) -> None:
    """
    Count bigrams in a text file and output a frequency matrix.
    
    The output is a tab-separated table with:
    - Sorted vocabulary in first row and first column
    - Cell (i,j) contains cumulative count up to and including word j for row i
    - Empty cells (not 0) when count is zero
    """
    try:
        # Read the file
        text = filename.read_text(encoding='utf-8')
        
        # Tokenise
        tokens = tokenise_text(text)
        
        if not tokens:
            print("Error: No tokens found in the input file", file=sys.stderr)
            raise typer.Exit(1)
        
        if len(tokens) < 2:
            print("Error: Not enough tokens to form bigrams (file may contain only one token)", file=sys.stderr)
            raise typer.Exit(1)
        
        # Count bigrams
        bigram_counts = count_bigrams(tokens)
        
        if not bigram_counts:
            print("Error: No bigrams found", file=sys.stderr)
            raise typer.Exit(1)
        
        # Create matrix
        vocabulary, matrix = create_bigram_matrix(bigram_counts)
        
        # Output as TSV
        output_tsv_matrix(vocabulary, matrix)
        
    except UnicodeDecodeError:
        print(f"Error: Unable to decode file '{filename}' as UTF-8", file=sys.stderr)
        raise typer.Exit(1)
    except Exception as e:
        print(f"Error processing file: {e}", file=sys.stderr)
        raise typer.Exit(1)


if __name__ == "__main__":
    typer.run(main)