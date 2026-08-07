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

The lessons themselves live on the
[project website](https://www.llmsunplugged.org). This repository contains the
website source, printable supporting materials (worksheets and the poster in the
`handouts/` directory), and the `llms_unplugged` CLI tool (in the `cli/`
directory) used to generate the pre-trained N-gram booklets and token cutouts
that the lessons use.

The `website/` directory contains the source for the project website at
[www.llmsunplugged.org](https://www.llmsunplugged.org).

## Which path should I take?

This project offers several entry points depending on your goals:

**Want to understand the fundamentals in 20 minutes?** Work through the
[lessons](https://www.llmsunplugged.org/lessons/)---the pen-and-paper grid
approach needs nothing more than a pencil and a d10 die.

**Teaching a class or workshop?** The
[lessons](https://www.llmsunplugged.org/lessons/) are designed to be taught, and
the [workshops page](https://www.llmsunplugged.org/workshops/) describes the
formats we run.

**Want to create your own N-gram booklet?** You can
[generate booklets online](https://www.llmsunplugged.org/tools/) directly in
your browser---no installation required. If you prefer working offline or want
to customise the output, build the CLI tool from source (see below).

## Creating your own N-gram booklets

Process any text corpus into a typeset N-gram model booklet for dice-based text
generation.

You'll need:

- [Rust toolchain](https://rustup.rs/)
- [Typst](https://github.com/typst/typst/)

### Quickstart

```bash
# Build the CLI tool
cd cli && cargo build --release

# Generate a booklet (JSON + PDF) from the included sample text
./target/release/llms_unplugged pdf --target frankenstein-2-1 --input ../data/frankenstein.txt --out-dir out
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
`!` `?` `;` `:`) as separate tokens. Paired marks (quotes, brackets, em-dashes)
are dropped; apostrophes inside contractions are preserved.

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
  - `--duplex`: emit a double-sided PDF where each cutout page is paired with a
    mirrored back, so the same cutouts appear on both faces of each sheet. Print
    with "flip on short edge" binding (currently hard-coded to a4 landscape).
  - `--tool NAME[:COUNT]`: inject a tool-trigger cutout for the agentic tool use
    lesson (e.g. `--tool VOTE` or `--tool ACTION:5`). `COUNT` defaults to 3 and
    seeds that many trigger copies at the top `COUNT` most common previous-word
    contexts in the corpus, so triggers fire from positions where the corpus is
    already variable. Repeat the flag to add multiple tools. Triggers render in
    a distinct black-on-gold style so they remain visually unambiguous even when
    the corpus contains the same word.
  - `--shuffle` (with optional `--seed`): emit cutouts in random rather than
    corpus order. Cutting destroys the ordering anyway, so this only matters if
    the uncut pages might be read before they're cut.
- `sheets` - Generate per-participant search sheets: the cutouts activity with
  the cutting taken out. The corpus is shuffled and dealt round-robin into one
  page per person, so every entry is on exactly one sheet and the model exists
  only across the whole room. Participants search their own sheet for the
  context just called out and read out the next word, so a common continuation
  puts more hands in the air than a rare one. The deal groups entries by context
  and spreads each context across as many sheets as it has occurrences, which
  minimises the case that flattens the show of hands: one person holding several
  matches for the same context can still only answer once. It can't be
  eliminated --- a context occurring more often than there are participants has
  to double up somewhere --- so the effect is reduced rather than removed. The
  PDF leads with a one-page teacher brief, then one page per participant.
  - `--sheets <N>`: pin the number of participants. Omit it and the count
    follows the corpus: the sheets keep the density `--rows` asks for, and a
    longer text simply needs more of them
  - `--n <N>`: prefix length (default 2)
  - `--sort`: order each sheet by context instead of shuffling it, turning the
    sheet into a lookup table --- a good second round, once the class has felt
    how slow an unsorted search is
  - `--seed <N>`: reproducible deal
  - `--rows <N>` (default 18): rows of pairs on a sheet. Rows stretch to fill
    the page, so this is the density knob, and unless `--sheets` pins the count
    it also decides how many sheets there are.
  - `--columns`, `--font-size`, `--paper-size`: the rest of the sheet density.
    Columns default to 4 for bigrams and narrow as `n` grows. A pair too wide
    for its column takes two columns rather than wrapping into the row below, so
    how many sheets a corpus needs depends on how long its words are; the
    command settles that against the real typesetting rather than guessing at
    it.
- `sample` - Build an N-gram model in memory from a corpus and sample text from
  it. Useful as a sanity check on the model without printing a booklet.
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
- `handouts/` - Printable materials (worksheets, poster)
- `website/` - Project website source (Astro)
- `backlog/` - Task management

### Testing

```bash
# Rust CLI tests (from cli/ directory)
cd cli && cargo test

# Website tests (from website/ directory)
cd website && pnpm test
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
