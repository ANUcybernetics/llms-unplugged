---
id: TASK-143
title: 'Website: add the ledger variant to the training and generation modules'
status: To Do
assignee: []
created_date: '2026-09-01 23:54'
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
- [ ] #1 Training and Generation modules offer ledger as a third variant in the VariantToggle, with you-will-need, algorithm, example and instructor-notes prose for it
- [ ] #2 The Materials/tools page links pre-generated ledger PDFs (and the counters sheet) for at least one short corpus, with Makefile targets that rebuild them
- [ ] #3 The sampling module notes how temperature and top-k work with the bag (add one counter of each colour in use; only the fattest strips go in)
<!-- AC:END -->
