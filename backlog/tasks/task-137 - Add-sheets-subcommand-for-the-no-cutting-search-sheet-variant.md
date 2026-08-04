---
id: TASK-137
title: Add sheets subcommand for the no-cutting search-sheet variant
status: Done
assignee: []
created_date: '2026-08-04 04:13'
updated_date: '2026-08-04 04:30'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate per-participant shuffled search sheets: partition the corpus round-robin across N participants so nobody has to cut anything. Each participant scans their own sheet for the current context and calls out the next word; the room collectively is the model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 cutouts tokens can be shuffled deterministically with a seed
- [ ] #2 sheets subcommand deals the corpus round-robin across N sheets, spreading duplicate (context,next) pairs onto different sheets
- [ ] #3 typst template renders one page per participant sheet, no cut lines, with a teacher instructions page
- [ ] #4 palette/rendering shared between cutouts and sheets templates rather than duplicated
- [ ] #5 cutouts gains a --shuffle flag
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped. cutout-common.typ holds the shared palette/renderers (cutouts output verified byte-identical); tokenized-sheets.typ renders a one-page teacher brief plus one page per participant; deal_into_sheets() partitions the corpus round-robin with duplicates spread across sheets. cutouts also gained --shuffle/--seed. Not done: no browser/tools-page workflow for sheets (would need the deal in wasm), and no Makefile targets for pre-prepared sheet PDFs.
<!-- SECTION:NOTES:END -->
