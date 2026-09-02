# Teaching materials guide

## Overview

This directory contains Typst-based standalone printable materials: worksheets
and the poster. The lessons themselves live on the website
(`website/src/content/lessons/`).

## Directory structure

- `worksheets/` - blank templates (grid, trigram-template,
  truncation-strategies, blank-page)
- `handout-common.typ` - the worksheets' page furniture (mark, gold rule, URL),
  built on the brand definitions in `cli/cutout-common.typ` so a worksheet and a
  set of CLI sheets read as one family. `grid.typ` sets its own, being a
  full-bleed A3 grid with no margins to hang a header on
- `poster.typ` - project poster
- `try-it-yourself-spread.typ` - designer reference for a glossy-booklet 2-page
  spread: generate-with-a-d6 worked example (model = the opening stanzas of The
  Cat in the Hat, hardcoded in the file; the Seuss corpus stays untracked)

## Build process

```bash
# Build all handouts (worksheets, poster)
make

# Build single file
typst compile worksheets/grid.typ

# sycophancy-text.typ reads its corpus from data/sycophancy.txt, so compiling
# it directly needs the repo root as the project root (the Makefile does this)
typst compile --root .. worksheets/sycophancy-text.typ
```

PDFs are written to `out/` (gitignored).

The grid worksheet and the sycophancy training-text sheet are published under
`worksheets/` on pdf.llmsunplugged.org (linked from the lessons and the ACDICT
news post): `make publish` stages them to `../out/pdfs/worksheets/`; upload with
`ops/bucket-sync.py upload out/pdfs` from the repo root, then refresh and commit
the manifest (see that script's header).

## Design constraints

Most of these are A4 **landscape** (29.7cm × 21cm); the grid is A3 landscape and
the try-it-yourself spread A3 landscape at two pages to a sheet.

The worksheets take their styling from `handout-common.typ`. Only `poster.typ`
still uses the `anu` template.

## Dependencies

- Typst compiler
- fonts installed system-wide (Public Sans, Libertinus Serif)
- `@local/anu-typst-template:0.3.0` for `poster.typ` only (must be installed
  locally, not vendored in this repo; from 0.3.0 it's a brand layer over
  `@local/university-typst-template`, which must be installed too)

## Notes

- Materials are designed for physical printing and workshop distribution
- Emphasis on hands-on activities with dice, tokens, paper
- When making changes, build the affected file and check the output PDF
