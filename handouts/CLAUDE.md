# Teaching materials guide

## Overview

This directory contains Typst-based standalone printable materials: worksheets,
runsheets, and the poster. The lessons themselves live on the website
(`website/src/content/lessons/`).

## Directory structure

- `worksheets/` - blank templates (grid, trigram-template,
  truncation-strategies, blank-page)
- `runsheets/` - session runsheets (90min, 2h, 3h)
- `poster.typ` - project poster

## Build process

```bash
# Build all handouts (worksheets, runsheets, poster)
make

# Build single file
typst compile worksheets/grid.typ
```

PDFs are written to `out/` (gitignored).

## Design constraints

These files use an A4 **landscape** format (29.7cm × 21cm) and inherit their
styling from the `anu` Typst template: ANU Cybernetic Studio branding, dark
theme with gold accents.

## Dependencies

- `@local/anu-typst-template:0.2.0` package (must be installed locally, not
  vendored in this repo)
- Typst compiler
- fonts installed system-wide (Public Sans, Monaspace Argon)

## Notes

- Materials are designed for physical printing and workshop distribution
- Emphasis on hands-on activities with dice, tokens, paper
- When making changes, build the affected file and check the output PDF
