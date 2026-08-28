---
id: TASK-131
title: 'Design the advanced follow-on lesson (working title: Going Deeper)'
status: Done
assignee: []
created_date: '2026-07-16 00:01'
updated_date: '2026-08-28 10:41'
labels:
  - website
  - lessons
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The site restructure (July 2026) reorganises content into modules (the current lesson pages) and lessons (deck-backed workshop journeys). The battle-tested decks cover the fundamentals trajectories, but the less-delivered modules --- In-context Memory, Induction Heads, Word Embeddings (plus possibly Sampling, LoRA, RLHF, Synthetic Data) --- have no lesson or deck yet. The current /workshops/ page's 'Format 2: Going deeper' prose is the seed: a follow-on for groups that have done the fundamentals, comfortable with more abstraction. Open questions to resolve before building: which modules make the cut (and in what sequence), whether it needs a deck from day one or launches as a lesson page only, target audience/duration, and what it's actually called (naming principle from the restructure: name the experience, keep duration/apparatus out of the title).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lesson concept decided: module sequence, audience, duration, and name
- [x] #2 lesson page exists under /lessons/ (listed or unlisted as appropriate) with you-will-need, timings, and prep notes
- [x] #3 deck decision made explicitly: either a deck exists or the page states the lesson runs without one
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped 28 Aug 2026 as two page-only lessons: Under the hood (/lessons/under-the-hood/, mechanism track) and Shaping a model (/lessons/shaping-a-model/, discussion track), both status: untested, no deck --- the pages say they run from the module pages.
<!-- SECTION:NOTES:END -->
