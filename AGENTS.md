# LLMs Unplugged

A teaching project for creating N-gram language models from scratch, with both
manual (pen-and-paper) and automated tools.

**Website**: [www.llmsunplugged.org](https://www.llmsunplugged.org)

## Project structure

This repository has three main parts, each with its own AGENTS.md:

- **`cli/`** - Rust CLI tool for generating N-gram models and PDF booklets
- **`handouts/`** - Typst teaching materials (modules, worksheets, runsheets)
- **`website/`** - Project website (Eleventy + Tailwind)

Supporting directories:

- `data/` - Input text corpora (*.txt files with YAML frontmatter)
- `backlog/` - Task management (use `backlog` CLI tool)

## Core workflow

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

## Quick start

```bash
# Build CLI tool
cd cli && cargo build --release

# Generate a booklet
./cli/target/release/llms_unplugged data/frankenstein.txt -n 2
typst compile cli/book.typ book.pdf

# Build teaching handouts
cd handouts && make modules

# Run website dev server
cd website && npm run dev
```

## Testing

```bash
# CLI tests
cd cli && cargo test

# Website tests
cd website && npm run build && npm test
```

## General conventions

- Use `backlog` CLI for task management (never edit task files directly)
- Test output must be pristine (zero failures)
- Format Typst files with `typstyle --wrap-text`
- Never create files unless necessary---prefer editing existing ones

## Notes

- Project teaches human-scale AI concepts
- Designed for physical dice-based text generation
- Part of ANU Cybernetic Studio research
