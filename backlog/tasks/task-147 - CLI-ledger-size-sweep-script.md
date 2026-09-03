---
id: TASK-147
title: 'CLI: ledger size sweep script'
status: Done
assignee: []
created_date: '2026-09-03 07:30'
updated_date: '2026-09-03 07:36'
labels:
  - cli
  - ledger
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Balls come in about eight colours, so a ledger set for a classroom must keep every prefix to two rows (8 followers at 4 columns) and the largest tally count sets how many balls of one colour a group needs. Choosing --max-tokens for a text by trial runs is slow; a script should report the numbers across a range of budgets so the size can be chosen at a glance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ops/ledger-sweep.py runs the ledger command --json-only across a range of --max-tokens for a corpus and prints one row per budget: tokens, prefixes, widest prefix, largest count, largest row total
- [x] #2 the script is a uv inline script matching ops/bucket-sync.py conventions
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ops/ledger-sweep.py: runs ledger --json-only per budget, prints budget/tokens/prefixes/widest/rows/colours/max_count/max_row, stops at the first budget the text is shorter than.
<!-- SECTION:NOTES:END -->
