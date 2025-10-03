# Teaching materials guide

## Overview

This directory contains Typst-based teaching materials for the "My First LM"
project, including modules, worksheets, and runsheets.

## Directory structure

- numbered modules (00-09): `00-weighted-randomness.typ`,
  `01-basic-training.typ`, etc.
- `worksheets/` - blank templates (grid, trigram-template, blank-module)
- `draft/` - modules in draft form (evaluation, poetry-slam)
- `runsheets/` - session runsheets (90min, 3h)
- `images/` - all images and svg files
- `utils.typ` - shared functions
- `instructions.typ`, `instructors-notes.typ` - supporting documentation

## Build process

```bash
# Build all numbered modules and combine them
make modules

# Build all typst files in teaching/ and subdirectories
make all

# Build single module
typst compile 00-weighted-randomness.typ
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

- Edit `utils.typ` for global changes
- iverride locally for specific modules

## Dependencies

- `@local/anu-typst-template:0.2.0` package
- Libertinus Serif and Public Sans fonts
- Typst compiler

## Notes

- modules are designed for physical printing and workshop distribution
  (_ideally_ on one double-sided sheet, i.e. 2 pages total for each)
- each module teaches a specific concept about language models
- emphasis on hands-on activities with dice, tokens, paper
- when making changes to the template, build one of the modules (e.g.
  `00-weighted-randomness.typ`) and read the output pdf (it'll only be 2 pages)
  to see if the changes have been applied correctly
