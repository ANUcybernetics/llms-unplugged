# My First Language Model

Understanding how AI language models work starts with building one yourself.
This teaching project shows you how to create N-gram language models from
scratch---either by hand in 20 minutes with pen and paper, or with automated
tools that generate dice-powered text generation booklets.

The core insight is simple: language models predict what comes next by counting
word patterns. A bigram model asks "after seeing word X, what usually comes
next?" By building this yourself rather than treating it as a black box, you
develop intuition for how larger models work.

This is a [Cybernetic Studio](https://github.com/ANUcybernetics/) artefact by
[Ben Swift](https://benswift.me) as part of the _Human-Scale AI_ project.

## What's in this repository

This repository contains both teaching materials and software tools. The
teaching materials (lesson plans, workshop modules, worksheets in the
`teaching/` directory) can be used standalone without any software installation.
The software tools (the `my_first_lm` CLI tool + other helper scripts) are only
necessary if you want to create your own pre-trained N-gram booklets from custom
text corpora.

## Which path should I take?

This project offers several entry points depending on your goals:

**Want to understand the fundamentals in 20 minutes?** Use the pen and paper
approach with the [grid template](teaching/out/worksheets/grid.pdf) and
step-by-step instructions (in [modules 01 and 02](teaching/out/modules.pdf)). No
software required.

**Teaching a class or workshop?** Explore the
[teaching modules](teaching/out/modules.pdf) and
[instructor notes](teaching/out/instructors-notes.pdf) for structured lesson
plans and materials.

**Want to create your own N-gram booklet?** You have two options:

- **Use a pre-built release**: Download the binary for your platform from the
  [releases page](https://github.com/benswift/my-first-lm/releases), unpack it,
  and run the `my_first_lm` on a `.txt` file containing your training data (see
  `data/frankenstein.txt` for an example)
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
tar -xzf my_first_lm-v1.0.0.tar.gz
cd my_first_lm

# Generate N-gram statistics from the included sample text
# (use the binary for your platform from the bin/ directory)
./bin/my_first_lm-linux-x86_64 data/frankenstein.txt -n 2

# Typeset the booklet
typst compile book.typ book.pdf
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

The tokenizer lowercases text and removes punctuation (except apostrophes in
contractions) to keep the model small.

### Command-line options

- `-o, --output <file>`: Output JSON file (default: `model.json`)
- `-n, --n <N>`: N-gram size---2 for bigrams, 3 for trigrams (default: 2)
- `--scale-d <D>`: Scale counts for a D-sided die (default: 10)
  - `D = 10`: Scales to [0, 9] for d10 dice
  - Other values: Scales to [1, D] when possible, or uses multi-die rolling for
    larger vocabularies
- `--raw`: Output raw counts without scaling

### How the pipeline works

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

The Rust tool (`src/main.rs`, `src/lib.rs`) processes your text through
tokenization (`src/tokenizer.rs`) and preprocessing (`src/preprocessor.rs`) to
generate N-gram statistics. The Typst template (`book.typ`) reads `model.json`
and typesets it into a printable booklet with guide words, proper pagination,
and dice-roll ranges.

For large trigram models, use the `-b` flag to split across multiple books.

### Project structure

- `src/` - Rust source code for N-gram processing
- `data/` - Input text corpora (\*.txt files with YAML frontmatter)
- `teaching/` - Teaching materials (modules, worksheets, runsheets)
- `scripts/` - Helper Python scripts for analysis
- `out/` - Generated PDFs and intermediate files
- `backlog/` - Task management

### Testing

```bash
cargo test
```

Tests cover capitalization rules, tokenization edge cases, and full integration
tests. Test output must be pristine with zero failures.

## Citation

If you use these teaching materials, please cite them:

```bibtex
@misc{swift2025myfirstlm,
  author = {Swift, Ben},
  title = {My First Language Model: Understand how AI language models work by building one yourself.},
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

Documentation (in `teaching/`) and any typeset "N-gram model booklets" are
licenced under a CC BY-NC-SA 4.0 license. See
[teaching/LICENSE](./teaching/LICENSE) for the full license text.

Source text licenses used as input for the language model remain as described in
their original sources.
