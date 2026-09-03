---
id: TASK-150
title: 'CLI: ledger --palettes for rooms with fewer counter colours'
status: Done
assignee: []
created_date: '2026-09-03 07:45'
updated_date: '2026-09-03 07:47'
labels:
  - cli
  - ledger
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ledger's strips cycle three palettes down the page's rows, so every third row prints in orange, brown, grey and teal whatever its prefix's width. Soft balls come in about eight colours, so a classroom set needs the sheets, the counters page and the brief to cycle only the first two palettes, and the widest-prefix warning to fire at the third row rather than the fourth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ledger --palettes N (1-3, default 3) makes the sheets cycle N palettes, the counters page print N, and the brief key and counter counts describe N × columns colours
- [x] #2 the tall-prefix warning fires when a prefix needs more rows than palettes
- [x] #3 ops/ledger-sweep.py takes --palettes and reports colours accordingly
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
palettes travels as a Typst input; ledger-common.typ exposes palette-count and palettes-in-use, which ledger.typ, ledger-counters.typ and the brief key read; the Rust tall-prefix warning fires at rows > palettes.
<!-- SECTION:NOTES:END -->
