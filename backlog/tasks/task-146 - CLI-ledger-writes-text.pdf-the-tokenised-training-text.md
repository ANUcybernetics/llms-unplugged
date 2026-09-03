---
id: TASK-146
title: 'CLI: ledger writes text.pdf, the tokenised training text'
status: Done
assignee: []
created_date: '2026-09-03 07:30'
updated_date: '2026-09-03 07:35'
labels:
  - cli
  - ledger
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A group training a ledger by hand reads the text aloud a pair at a time, and a plain printout leaves the reader doing the tokenisation (lowercasing, splitting punctuation) in their head. The ledger command should typeset the text exactly as the tokeniser saw it, from the same run as the sheets, so the printout and the rows can never disagree.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ledger writes text.pdf beside ledger.pdf and counters.pdf whenever it has a corpus (never for --blank)
- [x] #2 every token sits in its own box with a small index beneath it, punctuation in the symbol tile the sheets use, discarded tokens dimmed and unnumbered
- [x] #3 the facilitator brief's training section points at text.pdf
- [x] #4 integration test covers the new output; README and cli/CLAUDE.md describe it
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ledger.json gains a text field (per-document TextToken lists from text_documents in src/ledger.rs); ledger-text.typ typesets it to text.pdf; token-text moved to ledger-common.typ so both templates share the symbol tile; the brief's training and bring paragraphs point at the page.
<!-- SECTION:NOTES:END -->
