import re
import sys
from collections import defaultdict


def read_file(filename):
    """Read the content of a file."""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

def tokenize(text):
    """Split text into words, removing punctuation."""
    return re.findall(r'\b\w+\b', text.lower())

def create_bigram_model(words):
    """Create a dictionary of bigram counts."""
    bigram_counts = defaultdict(int)

    for i in range(len(words) - 1):
        current_word = words[i]
        next_word = words[i + 1]
        bigram_counts[(current_word, next_word)] += 1

    return bigram_counts

def main():
    if len(sys.argv) != 2:
        print("Usage: uv run create_unigram_model.py <filename>")
        sys.exit(1)

    filename = sys.argv[1]
    text = read_file(filename)
    words = tokenize(text)

    if not words:
        print("No words found in the file.")
        sys.exit(1)

    bigram_counts = create_bigram_model(words)

    # Print bigram counts
    print("Bigram counts:")
    for bigram, count in sorted(bigram_counts.items(), key=lambda x: x[1]):
        print(f"({bigram[0]}, {bigram[1]}): {count}")

    # Calculate and print the vocabulary size
    vocab = set(word for bigram in bigram_counts.keys() for word in bigram)
    print(f"\nVocabulary size: {len(vocab)}")
    print(f"Total unique bigrams: {len(bigram_counts)}")

if __name__ == "__main__":
    main()
