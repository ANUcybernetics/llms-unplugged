# Teaching materials guide

## Overview

This directory contains Typst-based standalone teaching materials: worksheets,
runsheets, and the poster. Lesson cards are now colocated with their markdown
files in `website/src/lessons/`.

## Directory structure

- `worksheets/` - blank templates (grid, trigram-template, blank-lesson)
- `draft/` - lessons in draft form (evaluation, poetry-slam)
- `runsheets/` - session runsheets (90min, 2h, 3h)
- `poster.typ` - project poster

Shared Typst resources are in `../typst/`:

- `utils.typ` - shared functions
- `fonts/` - IBM Plex Mono, Public Sans
- `images/` - hero images and SVGs

## Build process

```bash
# Build all handouts (worksheets, runsheets, poster)
make

# Build single file
typst compile --root .. worksheets/grid.typ
```

## Design constraints

These files use an A4 **landscape** format (29.7cm × 21cm), but otherwise
inherit all the styling from the main typst `anu` theme:

- 2.5cm margins
- ANU Cybernetic Studio branding
- dark theme with gold accents
- Public Sans font
- images: 11.9cm width on right side

Note: the ANU template typst package is on this same machine at
`~/Library/Application Support/typst/packages/local/anu-typst-template/0.2.0`.

## Common tasks

### Modifying layout

- Edit `../typst/utils.typ` for global changes
- Override locally for specific files

## Dependencies

- `@local/anu-typst-template:0.2.0` package
- Libertinus Serif and Public Sans fonts
- Typst compiler

## Notes

- Materials are designed for physical printing and workshop distribution
- Emphasis on hands-on activities with dice, tokens, paper
- When making changes to the template, build one of the worksheets and check the
  output PDF
