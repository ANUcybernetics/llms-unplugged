# LLMs Unplugged - Codebase Guide

## Project overview

A teaching project for creating N-gram language models from scratch, with both
manual (pen-and-paper) and automated tools. The pipeline: text corpus →
tokenization → N-gram statistics → typeset PDF booklets for dice-based text
generation.

**Website**: [www.llmsunplugged.org](https://www.llmsunplugged.org)

## Core workflow

```
text file → rust CLI → model.json → typst → PDF booklet
```

## Key directories

- `cli/` - Rust CLI tool and booklet generation pipeline
  - `src/` - Rust source code for N-gram processing
  - `tests/` - Rust integration tests
  - `scripts/` - Helper Python scripts (bigram_counter.py, build_books.py)
  - `book.typ` - Main booklet template (reads from model.json)
- `data/` - Input text corpora (\*.txt files with YAML frontmatter)
- `handouts/` - Teaching materials (modules, worksheets, runsheets)
  - numbered modules (00-09): landscape PDF cards for workshops
  - `worksheets/` - blank templates (grid, trigram-template, blank-module)
  - `draft/` - modules in draft form
  - `runsheets/` - session runsheets
  - `images/` - all images and svg files
- `website/` - Project website source (Eleventy + Tailwind)
- `backlog/` - Task management (use `backlog` CLI tool)

## Essential commands

```bash
# Build the tool (from cli/ directory)
cd cli && cargo build --release

# Generate N-gram model
./cli/target/release/llms_unplugged input.txt --scale-d 120 -n 2  # bigram with d120 scaling

# Generate booklet
typst compile cli/book.typ output.pdf

# Build all booklets (from cli/ directory)
cd cli && make booklets

# Build all handouts (from handouts/ directory)
cd handouts && make modules

# Format typst files
typstyle --wrap-text *.typ  # ALWAYS use --wrap-text flag
```

## Critical files

### Processing pipeline

- `cli/src/main.rs` - CLI entry point
- `cli/src/lib.rs` - Core N-gram logic
- `cli/src/tokenizer.rs` - Text tokenization (lowercases, removes punctuation except
  apostrophes)
- `cli/src/preprocessor.rs` - Text cleaning
- `cli/book.typ` - Main booklet template (reads from model.json)
- `cli/Makefile` - Batch processing for multiple texts/formats

### Configuration

- Input texts MUST have YAML frontmatter with: title, author, url
- `--scale-d N` scales counts to dice rolls (e.g., d10, d20, d120)
- Paper sizes: a4 (4 columns), a5 (3 columns)

## Common issues

1. **Guide words** - Header display of first/last entries per page (see
   task-010)
2. **Performance** - Large texts may process slowly (see task-008)
3. **Book splitting** - Trigrams split into multiple books with `-b N` flag
4. **Punctuation tokens** - Special handling for PERIOD, COMMA boxes in output

## Code conventions

- Match existing Rust style and patterns
- Tests must cover functionality (no mocks)
- Test output must be pristine (zero failures)
- Never commit without running tests
- Use `backlog` for task management

## Typst details

- Uses Libertinus Serif font
- Configurable via `sys.inputs`: paper_size, font_size, columns, subtitle
- Special formatting for punctuation tokens (boxed display)
- Guide words in headers for navigation
- Automatic page layout for booklet printing

## Testing

```bash
# Rust CLI tests (from cli/ directory)
cd cli && cargo test

# Website tests (from website/ directory)
cd website && npm run test
```

Test files in `cli/tests/` cover:

- Capitalization rules
- Tokenization edge cases
- Full integration tests

No current automated testing for Typst compilation of module files.

## Notes

- Project is for teaching human-scale AI concepts
- Designed for physical dice-based text generation
- Part of ANU Cybernetic Studio research
- Never create files unless necessary---prefer editing existing ones
