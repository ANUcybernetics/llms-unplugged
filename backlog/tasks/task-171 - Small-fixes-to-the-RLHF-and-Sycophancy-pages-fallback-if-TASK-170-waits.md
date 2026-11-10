---
id: TASK-171
title: >-
  Fallback: fix the current RLHF, Sycophancy or Synthetic Data page if its
  replacement misses James Prather's week
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T04:30:00Z'
labels:
  - website
  - modules
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
James Prather (Abilene Christian University, Texas) is teaching RLHF (week of 16 Nov 2026), Sycophancy (week of 23 Nov) and Synthetic Data (week of 30 Nov). The default is that he runs the new versions from TASK-170.01 to 170.03; the current pages are no better tested (only Sycophancy has been run with a class), so there's no reason to prefer them. Fix a current page only if its replacement won't be ready by the Friday before his week (13, 20 and 27 Nov, his time), and leave the other two alone.

The known errors in each page:

- RLHF: the reward-hacking round's settings and its "unprompted by the third round" claim (simulation: 12% → 18% as written, about 50% with seed ".", five candidates and +3 to the winner); it also quotes Sycophancy's out-of-date phrases
- Sycophancy: its phrase list drifts from data/originals/sycophancy.txt, which the printable sheet uses, and its example "i am absolutely right" can't be generated (no phrase contains am → absolutely)
- Synthetic Data: its example table (15 → 9 is steeper than a typical chain), its timing (training a fresh ~40-word grid and rolling 60 words takes nearer ten minutes than five) and any claim that chains lock into a loop within five links
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each current page James runs in place of a missed replacement has its known errors fixed, with any numeric claim checked by a simulation test
- [ ] #2 pnpm run check passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nov 2026: all three replacements went live before James's first week (Rewards, Fine-tuning's flattering adapter, two-chain Synthetic Data), so nothing here is needed unless James chooses to run one of the old pages from its deep link. If he does, fix that page using the error list above.
<!-- SECTION:NOTES:END -->
