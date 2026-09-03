---
id: TASK-151
title: >-
  CLI: pass the ledger palette in as data, and make every palette-requiring path
  read it
status: To Do
assignee: []
created_date: '2026-09-03 09:28'
labels:
  - cli
  - ledger
  - website
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ledger's colours are a hard-coded table in cli/ledger-common.typ, mirrored by hand in website/src/lib/ledger.ts and the --ledger-<name> tokens in website/src/styles/common.css, with --palettes (TASK-150) only choosing how many rows of that table to cycle. A room is defined by the balls it actually has, so the palette should come in from outside: a --palette flag taking a JSON array of name-to-hex entries (inline or a file path), with today's twelve as the default. The strip tint, the colour bar, the printed name on the strip, the brief's key and counts, the counters page, the 'colours repeat' warning, ops/ledger-sweep.py's colours column and the website widgets should all derive from that one list, so swapping black for orange after a shopping trip is one JSON edit rather than a hunt through three repos' worth of files. The list is flat: with --columns 4, twelve entries are three palettes, eight are two, so --palettes becomes redundant and goes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ledger --palette accepts a JSON array of {name, hex} (inline string or @file), defaults to the current twelve, and rejects fewer entries than --columns or duplicate names
- [ ] #2 ledger.typ, ledger-counters.typ and the brief take the palette from the JSON (ledger.json carries it), and no colour value or name remains hard-coded in a .typ file
- [ ] #3 the tall-prefix warning and ops/ledger-sweep.py compute rows and colours from the palette length, and --palettes is removed
- [ ] #4 the website reads the palette from data rather than a copy: widgets take the palette as a prop or from the set's ledger.json, and test/ledgerPaletteSync.test.ts checks the default list against the CLI's default rather than a typst table
- [ ] #5 README, cli/CLAUDE.md and the ledger deck's comment describe the flag
<!-- AC:END -->
