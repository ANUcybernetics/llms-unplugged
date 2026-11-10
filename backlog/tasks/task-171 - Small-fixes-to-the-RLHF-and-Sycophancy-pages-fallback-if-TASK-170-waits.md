---
id: TASK-171
title: >-
  Fix the RLHF, Sycophancy and Synthetic Data pages before James Prather teaches
  them
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T03:46:00Z'
due_date: '2026-11-13'
labels:
  - website
  - modules
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
James Prather (Abilene Christian University, Texas) is teaching RLHF (week of 16 Nov 2026), Sycophancy (week of 23 Nov) and Synthetic Data (week of 30 Nov) from the live pages, in a 50-minute-class course for non-majors. Do this first, by 13 Nov (Canberra time) so he sees the RLHF fixes before his week starts. The current pages stay live, at their URLs, until after his semester (TASK-170.04) even if the new versions in TASK-170 land first, so these fixes are worth making either way.

The fixes are the errors listed in TASK-170.01, 170.02 and 170.03: the reward-hacking round's settings and its "unprompted by the third round" claim (simulation: 12% → 18% as written, about 50% with seed ".", five candidates and +3 to the winner), Sycophancy's phrase list drifting from data/originals/sycophancy.txt (also quoted in RLHF), Sycophancy's impossible example, and Synthetic Data's example table (15 → 9 is steeper than a typical chain), its timing (training a fresh ~40-word grid and rolling 60 words takes nearer ten minutes than five) and any claim that chains lock into a loop within five links.

Skip the Synthetic Data part if James has agreed to run the reworked page (TASK-170.03) in his week of 30 Nov, since that rewrites the page in place.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RLHF's reward-hacking round uses settings that work in simulation, and its claims match them
- [ ] #2 Sycophancy and RLHF quote the phrases the printable sycophancy sheet actually contains
- [ ] #3 Sycophancy's example output can be generated from its own example model
- [ ] #4 Synthetic Data's example table, timing and loop claims match a test that simulates the relay (unless TASK-170.03 replaces the page first)
- [ ] #5 pnpm run check passes
<!-- AC:END -->
