---
id: TASK-148
title: 'Corpora: five short original texts for ledger training'
status: Done
assignee: []
created_date: '2026-09-03 07:30'
updated_date: '2026-09-03 07:38'
labels:
  - data
  - ledger
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ledger workshop's second phase has each group train a blank ledger on a text of its own, then the class pools its models in a shared-bucket finale. Nursery rhymes the students already know spoil the 'it sounds like the training text' moment, and texts with no shared vocabulary make the finale trivial: a prefix held by one group is no draw at all. Five original 60-80 token texts about one school day, sharing a vocabulary core, give each group its own model and the finale something to weigh.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 five texts in data/, committed (un-ignored), each 60-80 tokens with frontmatter title/author
- [x] #2 each text repeats several bigrams so tallies above one exist, and the five share common prefixes (the, a, and, full stop, we, i)
- [x] #3 every text keeps every prefix to at most 8 followers at 4 columns, and a ledger set for each builds without warnings
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
data/school-day-{bell,dog,rain,volcano,bus}.txt, 63-70 tokens each, widest prefix 4-5, largest tally 3-5; every sentence-opener also appears lowercase so only I keeps a capital. Pooled, 'the' has 15 followers, which is the finale's point.
<!-- SECTION:NOTES:END -->
