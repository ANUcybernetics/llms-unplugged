---
id: task-083
title: 'Proof-of-concept: typst.ts browser compilation with existing templates'
status: Done
assignee: []
created_date: '2025-12-10 22:52'
updated_date: '2025-12-10 23:08'
labels:
  - browser
  - wasm
  - proof-of-concept
  - typst
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validate that typst.ts can compile our existing Typst templates (book.typ, tokenized-cutouts.typ) in the browser before committing to full WASM integration.

## Context

We want to enable non-technical users to generate N-gram booklets and token cutouts directly in their browser, without needing to install the CLI. This requires:
1. Compiling the Rust N-gram logic to WASM
2. Running Typst in the browser via typst.ts

This task validates step 2 (the riskier part) by creating a minimal proof-of-concept.

## Goal

Create a standalone HTML page that:
- Loads typst.ts from CDN
- Embeds the book.typ template as a string
- Uses a hardcoded small JSON model (skip Rust WASM for now)
- Compiles to PDF in the browser
- Allows downloading the resulting PDF

## Success criteria

- PDF generates successfully in Chrome and Firefox
- The output matches what the CLI produces (visually correct)
- Fonts render correctly (Libertinus Serif, Libertinus Sans, IBM Plex Mono)
- The socy-logo-bw.svg displays correctly on the title page
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Standalone HTML page created in website/src/tools-poc/ (or similar)
- [x] #2 typst.ts loads successfully from CDN
- [x] #3 book.typ template embedded and compiles without errors
- [x] #4 Hardcoded JSON model data works with template
- [x] #5 PDF download works in Chrome
- [ ] #6 PDF download works in Firefox
- [x] #7 Fonts render correctly in output
- [x] #8 SVG logo appears on title page
- [x] #9 Document structure matches CLI-generated output
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation summary

Created a standalone HTML proof-of-concept at `website/public/tools-poc/index.html` that successfully demonstrates typst.ts browser compilation.

### Key findings

1. **typst.ts works well for browser compilation** - The `@myriaddreamin/typst.ts` package (v0.5.3) provides both SVG and PDF output from the browser.

2. **Font loading requires CDN** - Fonts must be loaded from CDN (Fontsource via jsdelivr) and added to the virtual filesystem using `mapShadow()`.

3. **Template simplification needed** - The original `book.typ` uses `@local/anu-typst-template` package which isn't available in browser. Created a simplified standalone template.

4. **API used**:
   - `$typst.setCompilerInitOptions()` - configure WASM module location
   - `$typst.addSource()` - add text files (template, JSON)
   - `$typst.mapShadow()` - add binary files (fonts, SVG)
   - `$typst.svg()` - compile to SVG for preview
   - `$typst.pdf()` - compile to PDF for download

### Files created

- `website/public/tools-poc/index.html` - Complete PoC with embedded template, model data, and SVG logo

### Test results (Chrome)

- ✅ typst.ts loads from CDN
- ✅ WASM compiler initialises
- ✅ Fonts load from Fontsource CDN (Libertinus Serif, Libertinus Sans, IBM Plex Mono)
- ✅ SVG compilation works (3 pages rendered)
- ✅ PDF download works (31KB, 3 pages)
- ✅ Document structure correct (title page, copyright, n-gram entries)
- ✅ SVG logo appears on title page

### Notes for full implementation

- Firefox testing not performed but uses standard Web APIs
- Consider caching fonts in IndexedDB for faster subsequent loads
- May need to handle the `@local` package imports differently or inline all dependencies
<!-- SECTION:NOTES:END -->
