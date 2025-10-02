# My First LM - Codebase Guide

## Project overview

A teaching project for creating N-gram language models from scratch, with both
manual (pen-and-paper) and automated tools. The pipeline: text corpus →
tokenization → N-gram statistics → typeset PDF booklets for dice-based text
generation.

## Core workflow

```
text file → rust CLI → model.json → typst → PDF booklet
```

## Key directories

- `src/` - Rust source code for N-gram processing
- `data/` - Input text corpora (\*.txt files with YAML frontmatter)
- `docs/modules/` - Teaching modules (\*.typ files)
- `out/` - Generated PDFs and intermediate files
- `backlog/` - Task management (use `backlog` CLI tool)

## Essential commands

(useful to know, but mostly the `Makefile` handles this)

```bash
# Build the tool
cargo build --release

# Generate N-gram model
./target/release/my_first_lm input.txt --scale-d 120 -n 2  # bigram with d120 scaling

# Generate booklet
typst compile book.typ output.pdf

# Run all builds
make all  # builds all configured texts/sizes

# Format typst files
typstyle --wrap-text *.typ  # ALWAYS use --wrap-text flag
```

## Critical files

### Processing pipeline

- `src/main.rs` - CLI entry point
- `src/lib.rs` - Core N-gram logic
- `src/tokenizer.rs` - Text tokenization (lowercases, removes punctuation except
  apostrophes)
- `src/preprocessor.rs` - Text cleaning
- `book.typ` - Main booklet template (reads from model.json)
- `Makefile` - Batch processing for multiple texts/formats

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
cargo test  # run all tests
```

Test files in `tests/` cover:

- Capitalization rules
- Tokenization edge cases
- Full integration tests

## Notes

- Project is for teaching human-scale AI concepts
- Designed for physical dice-based text generation
- Part of ANU Cybernetic Studio research
- Never create files unless necessary---prefer editing existing ones
