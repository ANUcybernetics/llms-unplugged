# My First LM

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

## Which path should I take?

This project offers three entry points depending on your goals:

**Want to understand the fundamentals in 20 minutes?** Use the pen and paper
approach with the grid template and step-by-step instructions. No software
required.

**Want to generate booklets for dice-based text generation?** Use the automated
pipeline: feed in any text file, get a typeset PDF booklet scaled to your
favourite dice.

**Teaching a class or workshop?** Explore the teaching modules for structured
lesson plans and materials.

## Pen and paper approach

Build a bigram language model by hand using a grid template and guided
instructions.

### What you need

- Typst ([install here](https://github.com/typst/typst/))
- A printer
- Pen and paper
- 20 minutes

### Quick start

Generate the grid and instructions:

```bash
typst compile teaching/worksheets/lm-grid.typ lm-grid.pdf
typst compile teaching/instructions.typ instructions.pdf
```

Print both PDFs and follow the instructions to create your own word
co-occurrence matrix. Once complete, you can use it to generate new text by
following the patterns you've discovered.

## Automated booklet generation

Process any text corpus into a typeset N-gram model booklet for dice-based text
generation.

### What you need

- Rust toolchain ([install here](https://rustup.rs/))
- Typst ([install here](https://github.com/typst/typst/))

### Quick start

Build the tool and generate a booklet:

```bash
# Build the Rust CLI
cargo build --release

# Generate N-gram statistics from your text file
./target/release/my_first_lm data/your-text.txt --scale-d 20 -n 2

# Typeset the booklet
typst compile book.typ book.pdf
```

The resulting PDF contains your N-gram model formatted for dice-roll-based text
generation. For d20 dice, counts are scaled to [1, 20]. For prefixes with many
followers, multiple dice rolls may be needed (indicated by ♢ markers).

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

### Batch processing

The `Makefile` handles multiple texts and formats:

```bash
make all  # Build all configured texts and sizes
```

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

## Teaching modules

Structured lesson plans and materials for workshops or courses.

### What's included

The `teaching/` directory contains:

- numbered modules (00-09): landscape PDF cards for workshop handouts
- `worksheets/`: blank templates for manual exercises
- `draft/`: modules in draft form
- `runsheets/`: session plans (90min, 3h)

### Quick start

```bash
# Build all modules
cd teaching && make modules

# Build single module
typst compile 00-weighted-randomness.typ output.pdf
```

Modules are designed to work alongside either the pen-and-paper approach or the
automated tools, depending on your pedagogical goals.

## How it works

An N-gram language model predicts the next word by looking at the previous N-1
words. A bigram (N=2) model only needs the current word to predict the next one.
The model counts how often each word follows another in the training text, then
uses those counts as probabilities.

For example, if "the" is followed by "cat" 5 times and "dog" 15 times in your
training text, the model predicts "dog" is three times more likely after "the".
By scaling these counts to dice ranges, you can physically generate text by
rolling dice to sample from these probability distributions.

This is fundamentally the same mechanism used by large language models like GPT,
just at a much smaller scale and with shorter context windows.

## Development

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

### Code conventions

Match existing Rust style and patterns. Never commit without running tests. Use
the `backlog` CLI tool for task management.

## Author

Ben Swift

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
