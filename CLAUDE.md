# LLMs Unplugged

A teaching project for creating N-gram language models from scratch, with both
manual (pen-and-paper) and automated tools.

**Website**: [www.llmsunplugged.org](https://www.llmsunplugged.org)

## Project structure

This repository has three main parts:

- **`cli/`** - Rust CLI tool for generating N-gram models and PDF booklets
- **`handouts/`** - Typst standalone materials (worksheets, runsheets, poster)
- **`website/`** - Project website (Astro) including all lessons

Supporting directories:

- `data/` - Input text corpora (\*.txt files with YAML frontmatter)
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
./cli/target/release/llms_unplugged pdf -i data/frankenstein.txt -n 2

# Generate token cutouts for the cutouts lesson variant
./cli/target/release/llms_unplugged cutouts -i data/sycophancy.txt -n 2

# Same, but double-sided so cutouts read on either face
# (print with "flip on short edge" binding; assumes a4 landscape)
./cli/target/release/llms_unplugged cutouts -i data/sycophancy.txt -n 2 --duplex

# Build handouts (worksheets, runsheets, poster)
cd handouts && make

# Run website dev server
cd website && pnpm run dev
```

## Testing

```bash
# CLI tests
cd cli && cargo test

# Website tests
cd website && pnpm run build && pnpm test
```

## General conventions

- Use `backlog` CLI for task management (never edit task files directly)
- Test output must be pristine (zero failures)
- Format Typst files with `typstyle --wrap-text`
- Never create files unless necessary---prefer editing existing ones
- In markdown, use blank lines around containers (`::: info` etc.) so
  Prettier doesn't mangle them

## Notes

- Project teaches human-scale AI concepts
- Designed for physical dice-based text generation
- Part of ANU Cybernetic Studio research
- The website is now powered by Astro, but was previously an eleventy (11ty)
  site --- the `11ty` git tag is the last commit with the eleventy site
