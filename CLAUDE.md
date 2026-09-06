# LLMs Unplugged

A teaching project for creating N-gram language models from scratch, with both
manual (pen-and-paper) and automated tools.

**Website**: [www.llmsunplugged.org](https://www.llmsunplugged.org)

## Project structure

- `cli/` --- Rust CLI tool for generating N-gram models and PDF booklets
- `handouts/` --- Typst standalone materials (worksheets, designer references)
- `website/` --- project website (Astro), including all lessons
- `data/` --- input text corpora (`*.txt` with YAML frontmatter). Gitignored
  apart from `frankenstein.txt`, `sycophancy.txt` and the `school-day-*.txt`
  set; the full set, with provenance and cleaning recipes, is the private
  [llms-unplugged-corpora](https://github.com/benswift/llms-unplugged-corpora)
  repo --- clone it and copy `texts/*.txt` in here
- `backlog/` --- task management

The README documents the CLI subcommands and their options; read it rather than
guessing flags.

## Commands

```bash
cd cli && cargo build --release   # build the CLI
cd cli && cargo test              # CLI tests
cd handouts && make               # build handout PDFs
cd website && pnpm run dev        # website dev server
# website tests --- build first: test/build.test.ts reads dist/
cd website && pnpm run build && pnpm test
```

## Conventions

- Use the `backlog` CLI for task management; never edit task files directly
- Test output must be pristine (zero failures)
- Format Typst files with `typstyle --wrap-text`
