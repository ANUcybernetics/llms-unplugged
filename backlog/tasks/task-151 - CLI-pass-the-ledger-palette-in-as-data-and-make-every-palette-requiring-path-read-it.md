---
id: TASK-151
title: >-
  CLI: pass the ledger palette in as data, and make every palette-requiring path
  read it
status: Done
assignee: []
created_date: '2026-09-03 09:28'
updated_date: '2026-09-03 10:18'
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
- [x] #1 ledger --palette accepts a JSON array of {name, hex} (inline string or @file), defaults to the current twelve, and rejects fewer entries than --columns or duplicate names
- [x] #2 ledger.typ, ledger-counters.typ and the brief take the palette from the JSON (ledger.json carries it), and no colour value or name remains hard-coded in a .typ file
- [x] #3 the tall-prefix warning and ops/ledger-sweep.py compute rows and colours from the palette length, and --palettes is removed
- [x] #4 the website reads the palette from data rather than a copy: widgets take the palette as a prop or from the set's ledger.json, and test/ledgerPaletteSync.test.ts checks the default list against the CLI's default rather than a typst table
- [x] #5 README, cli/CLAUDE.md and the ledger deck's comment describe the flag
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Landed in 63dd6c8b.

--palette takes a JSON array of {name, hex}, inline or @file, defaulting to cli/ledger-palette.json (embedded with include_str!, twelve colours as hex --- the oklch values converted through typst's own to-hex, so the printed colours are unchanged). check_palette rejects fewer colours than --columns, a repeated name and a value neither typst nor a browser can read; colours past the last whole row are dropped with a warning. The list travels in ledger.json, which ledger-counters.typ now reads too (it takes json_path instead of the old palettes input).

Nothing in a .typ file names a colour any more, so white and black lose their special cases: strip-fill is the colour's hue at oklch(94%, c * 0.15, h), and pale(entry) (oklab lightness > 90%) gets a dashed outline instead of a tint and a bar. ledger.css does the same with relative colour syntax, so the --ledger-<name> tokens are gone from common.css. counter-cell is now a function of --columns, so a six-column palette still fits the counters page.

Website widgets take a palette prop (LEDGER_PALETTE, the CLI default, is the fallback); the deck slices its first eight into PALETTE. test/ledgerPaletteSync.test.ts compares that list against cli/ledger-palette.json rather than parsing a typst table. cli/ledger-palette-eight.json ships the school workshop's room, which the deck comment, the lesson's 'you will need' and the sweep script's usage all point at.

Checked: cargo test/clippy/fmt, pnpm run check (typecheck, lint, format, 235 tests, decks:check), and the deck's ledger slides screenshotted in a browser.
<!-- SECTION:NOTES:END -->
