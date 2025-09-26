# Teaching modules guide

## Overview

This directory contains Typst-based teaching modules for the "My First LM"
project. Each module is a landscape-format PDF card designed for physical
handouts in workshops.

## Module structure

### File naming

- numbered modules: `00-weighted-randomness.typ`, `01-basic-training.typ`, etc.
  (each one has an `XX-module-name.typ` name where `XX` is the module number)
- supporting files: `utils.typ` (shared functions)
- images in `images/` subdirectory

## Build process

```bash
# Build single module
typst compile 00-weighted-randomness.typ

# Build all modules (but only when in this docs/modules/ subdirectory)
make modules
```

## Design constraints

These files use an A4 **landscape** format (29.7cm × 21cm), but otherwise
inherit all the styling from the main typst `anu-template` theme:

- 2.5cm margins
- ANU Cybernetic Studio branding
- Dark theme with gold accents
- Public Sans font
- Images: 11.9cm width on right side

Note: the ANU template typst package is on this same machine at
`~/Library/Application Support/typst/packages/local/anu-typst-template/0.1.0`.

## Common tasks

### Modifying layout

- Edit `utils.typ` for global changes
- Override locally for specific modules

## Dependencies

- `@local/anu-typst-template:0.1.0` package
- Libertinus Serif and Public Sans fonts
- Typst compiler

## Notes

- Modules are designed for physical printing and workshop distribution
  (_ideally_ on one double-sided sheet, i.e. 2 pages total for each)
- Each module teaches a specific concept about language models
- Emphasis on hands-on activities with dice, tokens, paper
