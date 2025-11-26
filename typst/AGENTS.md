# Shared Typst resources

This directory contains shared resources used by Typst files across the project.

## Contents

- `utils.typ` - shared functions and styling for lesson cards
- `fonts/` - IBM Plex Mono and Public Sans font files
- `images/` - hero images (CYBERNETICS\_\*.jpg) and SVG diagrams

## Usage

Typst files import from this directory using absolute paths from the project
root:

```typst
#import "/typst/utils.typ": *
```

When compiling, use `--root` to set the project root:

```bash
typst compile --root /path/to/llms-unplugged file.typ
```

## Consumers

- `website/src/lessons/*.typ` - lesson cards
- `handouts/worksheets/blank-lesson.typ` - blank lesson template
- `handouts/draft/*.typ` - draft lessons
