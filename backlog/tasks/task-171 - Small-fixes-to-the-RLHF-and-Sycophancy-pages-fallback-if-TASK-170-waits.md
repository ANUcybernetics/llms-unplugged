---
id: TASK-171
title: Small fixes to the RLHF and Sycophancy pages (fallback if TASK-170 waits)
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
labels:
  - website
  - modules
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
James Prather (ACU) is teaching RLHF (week of 16 Nov 2026) and Sycophancy (week of 23 Nov) from the live pages. If he'd rather the pages not be restructured mid-semester, make only these fixes now and leave TASK-170 for after his semester. If TASK-170 goes ahead now, archive this task.

The fixes are the errors listed in TASK-170.01 and TASK-170.02: the reward-hacking round's settings and its "unprompted by the third round" claim (simulation: 12% → 18% as written, about 50% with seed ".", five candidates and +3 to the winner), Sycophancy's phrase list drifting from data/originals/sycophancy.txt (also quoted in RLHF), and Sycophancy's impossible example.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RLHF's reward-hacking round uses settings that work in simulation, and its claims match them
- [ ] #2 Sycophancy and RLHF quote the phrases the printable sycophancy sheet actually contains
- [ ] #3 Sycophancy's example output can be generated from its own example model
- [ ] #4 pnpm run check passes
<!-- AC:END -->
