---
id: TASK-149
title: 'Deck: How AI writes stories with ledgers (ages 10-16)'
status: Done
assignee: []
created_date: '2026-09-03 07:30'
updated_date: '2026-09-03 08:04'
labels:
  - website
  - deck
  - ledger
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A ledger variant of the how-ai-writes-stories deck, for students aged 10-16 in groups of 4-5 with soft coloured balls as counters. The beats invert the cutouts deck: generation first from a pre-tallied ledger, then training a blank ledger on a new short text, then generating again and a whole-class finale where a shared bucket chooses the group (one ball of the group's colour per tally) and the group's bag chooses the word. Lives beside the existing deck and reuses its what-is-AI, warm-up, definitions and wrap-up partials.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 new deck how-ai-writes-stories-ledger with partials for reading the sheet, generation, training, and the all-in bucket finale, with timings in the deck comment
- [x] #2 widgets render a ledger row (colour by column, palettes cycling, tally marks), the bag load and draw, the sliding pair over the text during training, and the bucket, matching the printed sheet's colours
- [x] #3 generated backgrounds in the house style for the new heroes and splits
- [x] #4 a lesson entry lists the deck (flavour ledger, status untested) with materials and before-you-deliver notes
- [x] #5 pnpm run check passes, including decks:check
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deck how-ai-writes-stories-ledger with partials ledger-read/generation/training/bucket; widgets LedgerRow, LedgerBag, LedgerPage, LedgerTraining, LedgerBucket, LedgerSheets over src/lib/ledger.ts (palette sync test against cli/ledger-common.typ); ledger.css + --ledger-* tokens; six generated backgrounds; lesson entry with flavour ledger (schema + LessonLayout widened). Rows in the deck are the real 150-token, 5-sheet, 2-palette Green Eggs set; bucket groups are the school-day texts' rows for 'the'.
<!-- SECTION:NOTES:END -->
