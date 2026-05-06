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
- `src/text.rs` - Unified tokenization/normalization pipeline (case handling,
  punctuation tokens, filters)
- `book.typ` - Main booklet template (reads from model.json)
- `Makefile` - Batch processing for multiple texts/formats

## Essential commands

```bash
# Build the tool
cargo build --release

# Generate JSON
./target/release/llms_unplugged build ../data/frankenstein.txt --n 2 --output out/json/frankenstein-2-1.json

# Generate PDFs (and JSON if needed)
./target/release/llms_unplugged pdf --target frankenstein-2-1 --input ../data/frankenstein.txt --out-dir out

# Export bigram TSV for spreadsheets
./target/release/llms_unplugged tsv ../data/frankenstein.txt > bigrams.tsv

# Generate token cutouts (single-sided)
./target/release/llms_unplugged cutouts -i ../data/green-eggs-and-ham.txt -n 2

# Generate double-sided cutouts: each cutout page is paired with a mirrored
# back so the same cutouts appear on both faces of each sheet. Print with
# "flip on short edge" binding. Currently assumes a4 landscape.
./target/release/llms_unplugged cutouts -i ../data/green-eggs-and-ham.txt -n 2 --duplex

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
- `--book-binding` - Add blank pages for bound book layout (off by default)
- `--duplex` (cutouts only) - Generate a double-sided PDF where each cutout
  page is paired with a mirrored back. Requires "flip on short edge" binding
  when printed. Currently hard-coded to a4 landscape.

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

- Counts are always scaled for d10 dice using 10^k-1 scaling (e.g., 0-9, 0-99,
  0-999)
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
