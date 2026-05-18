# LLMs Unplugged

Understanding how AI language models work starts with building one yourself.
This teaching project shows you how to create N-gram language models from
scratch---either by hand in 20 minutes with pen and paper, or with automated
tools that generate dice-powered text generation booklets.

The core insight is simple: language models predict what comes next by counting
word patterns. A bigram model asks "after seeing word X, what usually comes
next?" By building this yourself rather than treating it as a black box, you
develop intuition for how larger models work.

**Website**: [www.llmsunplugged.org](https://www.llmsunplugged.org)

This is a [Cybernetic Studio](https://github.com/ANUcybernetics/) artefact by
[Ben Swift](https://benswift.me) as part of the _Human-Scale AI_ project.

## What's in this repository

This repository contains both teaching materials and software tools. The
teaching materials (lesson plans, worksheets in the `handouts/` directory) can
be used standalone without any software installation. The software tools (the
`llms_unplugged` CLI tool + other helper scripts in the `cli/` directory) are
only necessary if you want to create your own pre-trained N-gram booklets from
custom text corpora.

The `website/` directory contains the source for the project website at
[www.llmsunplugged.org](https://www.llmsunplugged.org).

## Which path should I take?

This project offers several entry points depending on your goals:

**Want to understand the fundamentals in 20 minutes?** Use the pen and paper
approach with the [grid template](handouts/out/worksheets/grid.pdf) and
step-by-step instructions (in [lessons 01 and 02](handouts/out/lessons.pdf)). No
software required.

**Teaching a class or workshop?** Explore the
[teaching lessons](handouts/out/lessons.pdf) and
[instructor notes](https://www.llmsunplugged.org/instructor-notes/) for
structured lesson plans and materials.

**Want to create your own N-gram booklet?** You have two options:

- **Use a pre-built release**: Download the binary for your platform from the
  [releases page](https://github.com/ANUcybernetics/llms-unplugged/releases),
  unpack it, and run the `llms_unplugged` on a `.txt` file containing your
  training data (see `data/frankenstein.txt` for an example)
- **Build from source**: Use the Rust toolchain to compile and customize the
  tool yourself

## Creating your own N-gram booklets

Process any text corpus into a typeset N-gram model booklet for dice-based text
generation.

You'll need:

- [Typst](https://github.com/typst/typst/)
- [Rust toolchain](https://rustup.rs/) (optional---only if you want to modify
  the tool)

### Quickstart

If you've downloaded the release tarball:

```bash
# Unpack the release archive
tar -xzf llms_unplugged-v1.0.0.tar.gz
cd llms_unplugged

# Generate a booklet (JSON + PDF) from the included sample text
# (use the binary for your platform from the bin/ directory)
./bin/llms_unplugged-linux-x86_64 pdf --target frankenstein-2-1 --input data/frankenstein.txt --out-dir out
```

The resulting PDF contains your N-gram model formatted for dice-roll-based text
generation. For all options see `--help`.

### Input file format

Your input text file must include YAML frontmatter with these keys:

```yaml
---
title: "Title of the Text"
author: "Author Name"
url: "https://source.url"
---
Your text content here...
```

The tokenizer lowercases text and keeps single-character punctuation (`.` `,`
`!` `?` `;` `:`) as separate tokens. Paired marks (quotes, brackets,
em-dashes) are dropped; apostrophes inside contractions are preserved.

### Subcommands and key options

- `build` - Produce JSON only.
  - `--n <N>`: N-gram size (default 2)
  - `--books <N>`: Split large models into multiple JSON files
  - `--raw`: Emit raw counts (no dice scaling)
- `pdf` - Produce PDFs (and JSON if needed).
  - `--target name-n-books`: Matches Makefile targets (e.g. `frankenstein-3-2`)
  - `--paper-size`, `--columns`, `--template book.typ`, `--subtitle`
  - `--pdf-only` / `--json-only` for incremental builds
- `tsv` - Export a bigram TSV matrix for spreadsheets (n=2 only).
- `cutouts` - Generate printable token cutouts for the cutouts lesson variant.
  - `--n <N>`: prefix length (cutouts show `n - 1` prefix words + token)
  - `--paper-size`: paper size (default `a4`)
  - `--duplex`: emit a double-sided PDF where each cutout page is paired with
    a mirrored back, so the same cutouts appear on both faces of each sheet.
    Print with "flip on short edge" binding (currently hard-coded to a4
    landscape).
  - `--tool NAME[:COUNT]`: inject a tool-trigger cutout for the agentic tool
    use lesson (e.g. `--tool VOTE` or `--tool ACTION:5`). `COUNT` defaults to
    3 and seeds that many trigger copies at the top `COUNT` most common
    previous-word contexts in the corpus, so triggers fire from positions
    where the corpus is already variable. Repeat the flag to add multiple
    tools. Triggers render in a distinct black-on-gold style so they remain
    visually unambiguous even when the corpus contains the same word.
- `sample` - Build an N-gram model in memory from a corpus and sample text
  from it. Useful as a sanity check on the model without printing a booklet.
  - `--input <FILE>`, `--n <N>` (default 2)
  - `--prompt <WORDS>`: starting text (must have at least `n - 1` normalised
    tokens; is run through the same tokeniser as the corpus)
  - `--tokens <N>`: number of tokens to sample (default 50)
  - `--seed <U64>`: optional, for reproducible output
  - On dead-end (a sampled context with no successors) the partial output is
    printed to stdout, an error is written to stderr, and the command exits 1.

By default, counts are scaled for d10 dice using 10^k-1 scaling (e.g., 0-9,
0-99, 0-999), making it easy to add more dice for larger ranges.

### How the pipeline works

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

The Rust tool (`cli/src/main.rs`, `cli/src/lib.rs`) processes your text through
a unified normalizer (`cli/src/text.rs`) to generate N-gram statistics. The
Typst template (`cli/book.typ`) reads `model.json` and typesets it into a
printable booklet with guide words, proper pagination, and dice-roll ranges.

For large trigram models, use the `-b` flag to split across multiple books.

### Project structure

- `cli/` - Rust CLI tool and booklet generation pipeline
  - `src/` - Rust source code for N-gram processing and CLI
  - `book.typ` - Main booklet template
- `data/` - Input text corpora (\*.txt files with YAML frontmatter)
- `handouts/` - Teaching materials (lessons, worksheets, runsheets)
- `website/` - Project website source (Vitepress)
- `backlog/` - Task management

### Testing

```bash
# Rust CLI tests (from cli/ directory)
cd cli && cargo test

# Website tests (from website/ directory)
cd website && npm run test
```

Tests cover capitalization rules, tokenization edge cases, and full integration
tests. Test output must be pristine with zero failures.

## Citation

If you use these teaching materials, please cite them:

```bibtex
@misc{swift2025llmsunplugged,
  author = {Swift, Ben},
  title = {LLMs Unplugged: Understand how AI language models work by building one yourself.},
  year = {2025},
  publisher = {Zenodo},
  doi = {10.5281/zenodo.17403824},
  url = {https://doi.org/10.5281/zenodo.17403824}
}
```

## Author

(c) 2025 Ben Swift

This work is a project of the _Cybernetic Studio_ at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au).

## License

Source code for this project is licensed under the MIT License. See the
[LICENSE](./LICENSE) file for details.

Documentation (in `handouts/`) and any typeset "N-gram model booklets" are
licenced under a CC BY-NC-SA 4.0 license. See
[handouts/LICENSE](./handouts/LICENSE) for the full license text.

Source text licenses used as input for the language model remain as described in
their original sources.
