# CLI tool guide

## Overview

Rust CLI tool for processing text corpora into N-gram models and generating
typeset PDF booklets for dice-based text generation.

## Core workflow

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

## Key files

- `src/main.rs` - CLI entry point with argument parsing
- `src/lib.rs` - Core N-gram processing logic
- `src/tokenizer.rs` - Text tokenization (lowercases, removes punctuation except
  apostrophes)
- `src/preprocessor.rs` - Text cleaning and preprocessing
- `book.typ` - Main booklet template (reads from model.json)
- `Makefile` - Batch processing for multiple texts/formats
- `scripts/build_books.py` - Python helper for building multiple booklets

## Essential commands

```bash
# Build the tool
cargo build --release

# Generate N-gram model
./target/release/llms_unplugged ../data/frankenstein.txt -n 2

# Generate booklet
typst compile book.typ output.pdf

# Build all configured booklets
make booklets

# Build workshop booklets
make workshop

# Run tests
cargo test
```

## CLI options

- `-o, --output <file>` - Output JSON file (default: model.json)
- `-n, --n <N>` - N-gram size: 2 for bigrams, 3 for trigrams (default: 2)
- `--raw` - Output raw counts without scaling
- `-b <N>` - Split large models across N books

## Input file format

Text files must include YAML frontmatter:

```yaml
---
title: "Title of the Text"
author: "Author Name"
url: "https://source.url"
---
Your text content here...
```

## Configuration

- Counts are always scaled for d10 dice using 10^k-1 scaling (e.g., 0-9, 0-99, 0-999)
- Paper sizes configured in book.typ: a4 (4 columns), a5 (3 columns)
- Typst inputs: paper_size, font_size, columns, subtitle

## Testing

Test files in `tests/` cover:

- Capitalization rules
- Tokenization edge cases
- Full integration tests

Test output must be pristine with zero failures.

## Typst details

- Uses Libertinus Serif font
- Special formatting for punctuation tokens (boxed display)
- Guide words in headers for navigation
- Automatic page layout for booklet printing

## Common issues

1. **Guide words** - Header display of first/last entries per page
2. **Performance** - Large texts may process slowly
3. **Book splitting** - Use `-b N` flag for trigrams
4. **Punctuation tokens** - PERIOD, COMMA get special box formatting

## Code conventions

- Match existing Rust style and patterns
- Tests must cover functionality (no mocks)
- Never commit without running tests
