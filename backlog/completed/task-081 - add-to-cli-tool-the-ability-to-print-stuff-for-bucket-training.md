---
id: task-081
title: add to cli tool the ability to print stuff for bucket training
status: Done
assignee: []
created_date: '2025-12-09 22:27'
updated_date: '2025-12-10 04:06'
labels:
  - cli
  - typst
  - bucket-training
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The instructions in website/lessons/bucket-training.md require printing out the text and cutting it (physically) up to be placed in the buckets. Add a feature to the CLI tool to generate printable token cutouts.

**Input**: Text file with YAML frontmatter (same format as booklet generation)

**Output**: A Typst-generated PDF with tokens arranged in a grid for cutting

**Key requirements**:
- Each token displayed in large font (Libertinus Serif) with a light grid border for cutting guides
- Tokens that would be filtered by the normaliser (roman numerals, numbers, punctuation other than `.` and `,`) should be greyed out to indicate they should be discarded
- Each token has a subtle index number so tokens can be re-ordered if jumbled
<!-- SECTION:DESCRIPTION:END -->

The instructions in @website/lessons/bucket-training.md require printing out the
text and cutting it (physically) up to be placed in the buckets. I want to add a
feature to the CLI tool to do that.

Here's how it could work:

- take input as a text file (same format as for other booklet-generation tasks)
- create a cli/tokenized-cutouts.typ file which just has the words, in large
  font (Libertinus as well, just like in book.typ) with no word-splitting and
  each word with a light "grid" around it (so that cutting along these grid
  lines leaves each word - i.e. token - on its own piece of paper)
- any things which are stripped by the tokenizer (e.g. punctuation outside of
  `.` and `,`) can still be printed, but should be greyed out or somehow
  visually indicated that those tokens are to be thrown away
- in case the cut-out tokens get jumbled up before they can be correctly put
  into buckets, include a subtle index number indicator on each token

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLI accepts `cutouts` subcommand with input file
- [x] #2 Generates JSON with all tokens and keep/discard status
- [x] #3 Generates Typst template that renders token grid
- [x] #4 Kept tokens displayed in black with solid border
- [x] #5 Discarded tokens displayed greyed out
- [x] #6 Each token has subtle index number
- [x] #7 PDF can be generated via typst compile
- [x] #8 Works with existing data files (e.g. green-eggs-and-ham.txt)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation plan

### 1. Extend tokenisation in `text.rs`

Add a new struct and method to return "raw" tokens with keep/discard status:

```rust
pub struct RawToken {
    pub text: String,
    pub index: usize,
    pub keep: bool,  // false = greyed out (would be filtered)
}
```

Create `Normalizer::tokenize_raw()` that captures all tokens before filtering, marking each with whether it would pass the normal filter.

### 2. Add `Cutouts` subcommand to CLI

New subcommand in `main.rs`:

```
llms_unplugged cutouts -i input.txt [--output out/cutouts] [--paper-size a4]
```

Arguments:
- `-i/--input`: Input text file (required)
- `-o/--output`: Output directory (default: `out/cutouts`)
- `--paper-size`: Paper size for PDF (default: `a4`)
- `-p/--punctuation`: Punctuation to preserve (default: `,.`)

### 3. Create JSON output format

Generate `cutouts.json`:

```json
{
  "metadata": {
    "title": "Frankenstein",
    "author": "Mary Shelley",
    "total_tokens": 150,
    "kept_tokens": 142
  },
  "tokens": [
    {"index": 1, "text": "you", "keep": true},
    {"index": 2, "text": "will", "keep": true},
    {"index": 3, "text": "XVII", "keep": false},
    ...
  ]
}
```

### 4. Create `cli/tokenized-cutouts.typ` template

Design considerations:
- Use Libertinus Serif at ~18pt or larger
- Grid layout with light grey borders (0.5pt)
- Variable-width cells (based on text), fixed height
- Index number: small (6pt), positioned in top-right corner, light grey
- Discarded tokens: text at 40% opacity, dashed border
- Punctuation (`.`, `,`): use boxed style like in book.typ

Layout approach:
- Use Typst's natural flow layout with inline boxes
- Each token is a box with border and padding
- Boxes wrap naturally across lines

### 5. Integration and testing

- Add to Makefile if appropriate
- Test with short texts (green-eggs-and-ham, dr-seuss) and longer texts
- Verify cutting guides are practical (not too small)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation completed with:
- `RawToken` struct in `text.rs` with `tokenize_line_raw()` method
- `cutouts` subcommand in CLI
- `tokenized-cutouts.typ` Typst template with 36pt font
- JSON output with metadata and tokens array
- PDF generation via typst

Note: The roman numeral filter is somewhat aggressive (filters words like "vivid", "did") but this is pre-existing behaviour in the normalizer, not introduced by this feature.
<!-- SECTION:NOTES:END -->
