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
- `tokenized-cutouts.typ` - Cutouts template (cut-up tokens for the table)
- `tokenized-sheets.typ` - Search-sheet template (one page per participant, no
  cutting)
- `cutout-common.typ` - Palettes, colour hash and token renderers shared by both
  cutout-family templates. Two palettes: `large-palette` (30 colours, cutouts at
  36pt) and `compact-palette` (12, sheets at ~11pt); `renderers(palette: ...)`
  builds the token renderers against one. Also copied into the website so the
  browser compiler resolves it (`website/scripts/copy-cli-templates.ts`)
- `Makefile` - Batch processing for multiple texts/formats

## Essential commands

```bash
# Build the tool
cargo build --release

# Generate JSON
./target/release/llms_unplugged build -i ../data/frankenstein.txt --n 2 --output out/json/frankenstein-2-1.json

# Generate PDFs (and JSON if needed)
./target/release/llms_unplugged pdf --target frankenstein-2-1 --input ../data/frankenstein.txt --out-dir out

# Export bigram TSV for spreadsheets
./target/release/llms_unplugged tsv -i ../data/frankenstein.txt > bigrams.tsv

# Sample text from an in-memory N-gram model built from a corpus
./target/release/llms_unplugged sample -i ../data/frankenstein.txt -p "the" -t 30 --seed 42

# Generate token cutouts (single-sided)
./target/release/llms_unplugged cutouts -i ../data/sycophancy.txt -n 2

# Generate double-sided cutouts: each cutout page is paired with a mirrored
# back so the same cutouts appear on both faces of each sheet. Print with
# "flip on short edge" binding. Currently assumes a4 landscape.
./target/release/llms_unplugged cutouts -i ../data/sycophancy.txt -n 2 --duplex

# Generate per-participant search sheets: no cutting, one page each. The corpus
# is shuffled and dealt round-robin, so the room collectively holds the model.
./target/release/llms_unplugged sheets -i ../data/the-cat-in-the-hat.txt -n 2 --sheets 24

# Same, but each sheet ordered by context (the "now organise your data" round)
./target/release/llms_unplugged sheets -i ../data/the-cat-in-the-hat.txt -n 2 --sheets 24 --sort

# Regenerate the pre-prepared search-sheet PDFs (targets are
# <corpus>-<participants>; PDFs land in website/public/assets/pdfs/sheets/)
make sheets

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
- `--duplex` (cutouts only) - Generate a double-sided PDF where each cutout page
  is paired with a mirrored back. Requires "flip on short edge" binding when
  printed. Currently hard-coded to a4 landscape.
- `--shuffle` / `--seed` (cutouts only) - Emit cutouts in random rather than
  corpus order, so an uncut page doesn't read as the source text
- `--sheets <N>` (sheets only, required) - Number of participants; the corpus is
  partitioned across this many one-page sheets
- `--sort` (sheets only) - Order each sheet by context instead of shuffling it
- `--columns` / `--font-size` (sheets only) - Sheet density. Columns default to
  4 for bigrams and narrow as n grows; the command warns when a sheet spills
  onto a second page

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

- Counts are scaled for d10 dice using 10^k-1 scaling (e.g., 0-9, 0-99, 0-999)
  unless `--raw` is given
- Paper size and columns are CLI flags (`--paper-size`, `--columns`; defaults a4
  and 4)
- book.typ inputs (via `--input key=value`): paper_size, font_size, columns,
  subtitle, json_path, book_binding

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
4. **Punctuation tokens** - `.`, `,` and friends get special boxed formatting

## Code conventions

- Match existing Rust style and patterns
- Tests must cover functionality (no mocks)
- Never commit without running tests
