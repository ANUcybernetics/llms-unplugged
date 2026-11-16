---
id: TASK-143
title: 'Website: add the ledger variant to the training and generation modules'
status: Done
assignee: []
created_date: 2026-09-01 23:54
updated_date: '2026-11-16T22:31:00Z'
labels:
  - website
  - ledger
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The CLI's ledger subcommand (cli/ledger.typ, cli/src/ledger.rs) is a third activity variant beside grid and cutouts: one row per prefix, coloured tally strips, training by tallying and generation by drawing counters from a bag. The website modules only know grid and cutouts, so nobody browsing the site can find or run it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Training and Generation modules offer ledger as a third variant in the VariantToggle, with you-will-need, algorithm, example and instructor-notes prose for it
- [x] #2 The Materials/tools page links pre-generated ledger PDFs (and the counters sheet) for at least one short corpus, with Makefile targets that rebuild them
- [x] #3 The sampling module notes how temperature and top-k work with the bag (add one counter of each colour in use; only the fattest strips go in)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: 86fcdb1e adds ledger as a third VariantToggle option (grid, ledger, cutouts) on Training and Generation, with you-will-need, goal, key idea, algorithm, a See Spot worked example (new LmLedger component over LedgerSheet/LedgerCup), discussion, troubleshooting and a comparison section. AC2: already met before this session: tools.astro's Ledgers section links packs/how-ai-writes-stories.zip (five pre-tallied picture books, blank sheets, training texts, counters page, instructions), rebuilt by make pack-how-ai-writes-stories. AC3: 6a44a5d3 adds a Ledger shortcuts callout to Sampling (cup, not bag): cold/hot/boiling and top-k as ways of filling the cup. Also c0d03c28 (modules index lists ledger, cutouts demoted), fef1c6cb (tools ordering), fefe9d70 (FAQ).
<!-- SECTION:NOTES:END -->
