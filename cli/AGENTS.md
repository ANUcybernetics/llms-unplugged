# CLI tool guide

## Overview

Rust CLI tool for processing text corpora into N-gram models and generating
typeset PDF booklets for dice-based text generation.

## Core workflow

```
text file → Rust CLI → model.json → Typst → PDF booklet
```

## Key files

- `src/main.rs` - CLI entry point: clap args and the per-subcommand pipelines
- `src/corpus.rs` - `Corpus`/`Frontmatter`: the one loader for corpus files
- `src/text.rs` - `Normalizer`: tokenisation and casing, decided across the
  whole corpus by `Normalizer::for_corpus` and immutable after that
- `src/model.rs` - `Model { n, contexts }`; entries, stats and samples are
  derived from it by method, never stored alongside it
- `src/cutouts.rs` - `Cutout`/`CutoutKind` (discarded, word-with-context, tool)
  and the cutouts/sheets pipelines; `CutoutSet` and `SheetSet` are the JSON
  shapes the templates read
- `src/ledger.rs` - `LedgerEntry` (a prefix and its followers with counts, in
  first-appearance order), the alphabetical row-balanced deal across a group's
  sheets and the pagination that never splits an entry; `LedgerSet` is the
  `ledger.json` shape. `PaletteEntry` and the palette checks live here too, with
  the default list embedded from `ledger-palette.json`
- `src/output.rs` - `Metadata` and `BookletJson`, the `model.json` shape
- `src/error.rs` - the lib's `Error` enum; `main` keys the frontmatter help on
  `Error::is_frontmatter`
- `src/typst.rs` - the typst/qpdf/pdfinfo shell-outs, behind one `compile` that
  every PDF goes through (compile, repack, report size). The `.typ` templates
  and brand assets below are `include_bytes!`'d into the binary and materialised
  to a temp dir at run time, so a release binary works away from the source
  tree. Cargo rebuilds on a template edit
- `src/wasm.rs` - the website's entry points, thin wrappers over the same types
- `book.typ` - Main booklet template (reads from model.json)
- `tokenized-cutouts.typ` - Cutouts template (cut-up tokens for the table)
- `tokenized-sheets.typ` - Search-sheet template (one page per participant, no
  cutting). Opens with a facilitator brief, written for somebody who has seen
  the activity run rather than as a standalone explanation, and sized to one
  page (prose, then the worked example) for every corpus we build. Its two
  columns are a hand-split `grid`, not a `columns()` flow: the brief is short
  enough that a flow either fills column one with the whole page or, given a
  measured height, breaks a section across the gutter. Keep whole sections in
  one cell. The brief varies with the corpus: the multi-document paragraph is
  gated on `metadata.documents`, which is why `CutoutsMetadata` carries a
  document count that a `--title` override cannot hide
- `ledger.typ` - Ledger template: one row per prefix, follower cells split into
  a word area and a tally strip, strips coloured by column with the set's
  palette cycling down the rows `columns` at a time. The palette comes from
  `ledger.json` (the CLI's `--palette`), and a counter is matched against a dot
  and a name printed on the strip. Tallies are drawn as five-bar gates whose
  unit shrinks to fit the largest count in the entry, so one prefix's strips
  share a scale and the ink on them is proportional to the counts.
  `word_fr`/`strip_fr` set the strip's shape: 1.47 to 1 makes it a golden
  rectangle at the default twelve rows a page, which a very different `--rows`
  moves off golden since rows share the page height. `--prefill` is a Typst
  input rather than part of the JSON, so one set prints at any level. Opens with
  a one-page facilitator brief unless the set is `--blank`, and is the only
  template with a `brief_scope: generic` --- a brief that names no corpus, for a
  pack of sets
- `ledger-common.typ` - Reading the palette out of `ledger.json`, the strip and
  counter drawing, and the counter-sheet geometry, shared by the two ledger
  templates so the strip on a sheet, the printed counter and the brief's
  per-sheet yield come from one definition. No colour or colour name is written
  down here: a pale colour (white, and anything near it) gets a dashed outline
  instead of a tint and a solid rule, which is decided by lightness. Copied into
  the website with the three ledger templates
  (`website/scripts/copy-cli-templates.ts`) for the browser generator, which
  builds its `ledger.json` through `process_text_for_ledger` in `src/wasm.rs`
- `ledger-counters.typ` - The counters to cut up and draw from the cup, written
  to `counters.pdf` beside every `ledger.pdf`. Two identical pages laid out as a
  palindrome both ways, so it prints double-sided under either binding with
  every square the same colour on both faces --- no qpdf rotation step, unlike
  the cutouts
- `ledger-text.typ` - The training text as the tokeniser read it, written to
  `text.pdf` beside `ledger.pdf` whenever the set has a corpus: every token in a
  box with a running number beneath, punctuation in the sheets' symbol tile,
  dropped tokens dimmed and unnumbered. Reads the `text` field of `ledger.json`
  (one token list per document; see `text_documents` in `src/ledger.rs`)
- `lockup-light*.svg` - The brand lockup, generated by
  `website/scripts/generate-logo-svgs.ts` into `website/public/` and copied here
  so the templates reach it by relative path. The numbered variants are the five
  title tokens the 4x4 grid can spell --- the frames the favicon animates
  through --- and the sheet header cycles them, so a set spells the title out
  across every five sheets. `lockup-light.svg` is variant 1 again, and is what
  everything placing the mark once uses. Re-copy all of them after regenerating
- `cutout-common.typ` - Palette, colour hash, token renderers and the brand
  lockup, shared by both cutout-family templates. One 8-colour palette, every
  swatch pinned to a colour word's xkcd-survey centroid and chosen on
  **printed** ΔE, so its names are the generator's own and it needs no
  hand-naming. Every entry clears 3.5:1 against white, which is what lets a
  swatch work both as coloured text on paper and as a white-on-colour box.
  `renderers()` builds the token renderers against it. Re-tune the hash with
  `find_palette_salt.ts --palette-len <n>` if the palette ever changes length,
  and always re-check with `check_palette_print.py` --- perceptual distance in
  sRGB says nothing about what survives CMYK. Also copied into the website so
  the browser compiler resolves it (`website/scripts/copy-cli-templates.ts`),
  along with `lockup-light.svg`
- `Makefile` - Batch processing for multiple texts/formats

## Website sync

After any Rust change that affects the `wasm` feature, run `mise run wasm-build`
from the repo root. `website/test/wasmPkg.test.ts` asserts the committed bundle
(`website/src/wasm-pkg`) still matches the Rust behaviour, so a stale bundle
fails the website suite.

The tokeniser's behaviour is pinned by a shared fixture
(`tests/fixtures/tokenization_cases.json`), asserted by both `cargo test` and
the website's vitest suite (the TS port in `website/src/lib/tokens.ts` must
agree). After a deliberate tokeniser change:
`cargo test regenerate_tokenization_fixture -- --ignored`, then update the TS
port and rebuild the wasm.

## Notes beyond `--help`

`--help` documents every flag; these are the parts it does not say.

- `--max-tokens` is applied in `Normalizer::tokenize`, the one whole-corpus
  tokenisation both pipelines read, so it cannot drift between them; casing is
  still decided over the whole file
- `--brief` reaches the templates as their `part` input
  (`all`/`handout`/`brief`), so cutouts, sheets and ledger answer the flag with
  one code path
- `--palette`: the list travels in `ledger.json`, so the sheets, the counters
  page, the brief's key and counts and the deck widgets all read one list. The
  default is `ledger-palette.json`, which `src/ledger.rs` embeds and the
  website's `LEDGER_PALETTE` mirrors. A room whose counters come in four or
  eight colours passes `@ledger-palette-four.json` or
  `@ledger-palette-eight.json`, the first four or eight of the default; the
  school workshop's deck, lesson and pack all print with the four
- sheets: pairs too wide for their column take two columns, so nothing wraps
  into the row below. A corpus's sheet count therefore depends on its word
  lengths: the command compiles, counts pages, and deals again with more sheets
  if any spilled (`--sheets` pins the count, so that path warns instead)

## Typst details

- Libertinus Serif for the tokens, Public Sans (the website's face) for
  everything that is the project talking: instructions, footers, the word mark.
  Public Sans is a system font here and is bundled for the in-browser compiler
- Every PDF is repacked in place with
  `qpdf --object-streams=generate --deterministic-id`, which packs typst's
  uncompressed accessibility tag tree (thousands of `StructElem` dictionaries
  per cutouts/sheets set) into compressed object streams --- roughly a 70% size
  cut with the tags kept. qpdf is optional: without it the command warns and
  leaves the larger file
