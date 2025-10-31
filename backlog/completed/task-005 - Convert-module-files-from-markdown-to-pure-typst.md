---
id: task-005
title: Convert module files from markdown to pure typst
status: Done
assignee: []
created_date: "2025-09-22 11:01"
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Convert all markdown files in docs/modules/ to pure typst format while
maintaining the anu template styling and ensuring the build process continues to
work

<!-- SECTION:DESCRIPTION:END -->

## Purpose & user problem

The current hybrid markdown/typst approach is becoming unwieldy with complex
formatting requirements (automatic tally marks, consistent table formatting,
full-width tables). Pure typst files will provide better control and cleaner
code.

## Success criteria

- All markdown files in docs/modules/ converted to pure typst (11 files total:
  00-weighted-randomness, 01-basic-training, 02-basic-generation, 03-trigram,
  04-context-columns, 05-embeddings, 06-sampling-strategies, 07-evaluation,
  glossary, poetry-slam, instructors-notes)
- Modules use the anu template for consistent styling
- Tables automatically apply tally marks to numeric values
- Tables have consistent formatting (equal-width columns, fixed-height rows,
  full width)
- `make combined` continues to work correctly
- Module files can share common utilities via an include

## Scope & constraints

### In scope

- Convert all .md files in docs/modules/ to .typ format
- Create a shared utility library for common functions (tally, table formatting)
- Update Makefile to handle .typ source files
- Maintain all existing content and structure
- Preserve anu template styling

### Out of scope

- Converting other documentation files (only focusing on modules)
- Changing the PDF output format or style
- Modifying the anu template itself

## Technical considerations

1. **File structure**:

   - Keep module files in `docs/modules/`
   - Use `llm-utils.typ` for shared utilities (already exists)
   - Each module file should import both anu template and utilities

2. **Table formatting**:

   - Use a custom `lm-table` function for consistent formatting
   - Automatically apply `tally()` to numeric cells
   - Ensure full-width tables with equal column widths

3. **Build process**:

   - Update Makefile to handle .typ source files directly
   - May need to adjust the combine step for typst files
   - Ensure backwards compatibility or clean migration

4. **Template usage**:
   - Each module should properly import and use the anu template
   - Maintain consistent headers with title, socy_logo, and prereqs

## Implementation steps

1. Create enhanced `llm-utils.typ` with table formatting functions
2. Convert `01-basic-training.md` to `01-basic-training.typ` as prototype
3. Test build process with single converted file
4. Convert all remaining .md files in docs/modules/ to .typ format:
   - 00-weighted-randomness.md
   - 02-basic-generation.md
   - 03-trigram.md
   - 04-context-columns.md
   - 05-embeddings.md
   - 06-sampling-strategies.md
   - 07-evaluation.md
   - glossary.md
   - poetry-slam.md
   - instructors-notes.md
5. Update Makefile to handle .typ source files
6. Test `make combined` to ensure it produces correct output
7. Remove the old .md module files

## Notes

- Current hybrid approach uses pandoc to convert md to typst, then includes raw
  typst blocks
- Pure typst will eliminate the pandoc conversion step for modules
- Need to ensure prereqs metadata is preserved for module dependencies
- Consider whether to keep markdown for simpler docs and only convert modules
  with complex formatting
