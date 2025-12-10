---
id: task-083
title: 'Proof-of-concept: typst.ts browser compilation with existing templates'
status: To Do
assignee: []
created_date: '2025-12-10 22:52'
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
- [ ] #1 Standalone HTML page created in website/src/tools-poc/ (or similar)
- [ ] #2 typst.ts loads successfully from CDN
- [ ] #3 book.typ template embedded and compiles without errors
- [ ] #4 Hardcoded JSON model data works with template
- [ ] #5 PDF download works in Chrome
- [ ] #6 PDF download works in Firefox
- [ ] #7 Fonts render correctly in output
- [ ] #8 SVG logo appears on title page
- [ ] #9 Document structure matches CLI-generated output
<!-- AC:END -->
