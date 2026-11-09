---
id: TASK-170.01
title: >-
  Replace the RLHF module with a rewards module: human panel vs rule card,
  thumbs-up finale
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
labels:
  - website
  - modules
dependencies: []
parent_task_id: TASK-170
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One base model, two tables. One table's candidates are ranked by a human panel (RLHF); the other's by a rule card, a checkable criterion such as "reward the candidate that reaches . soonest" (RLVR, how reasoning models are trained now). The rule table should move faster and more consistently, then find a degenerate way to win (reward hacking against a checker); the human panel disagrees with itself. Finale: a thumbs-up round where the room rewards whatever feels good, which turns the model sycophantic, with the GPT-4o April 2025 rollback as the reveal. This round takes over Sycophancy's main point.

Problems in the current RLHF page that the new module must not inherit (found by Monte Carlo simulation, Nov 2026):

- the reward-hacking round fizzles. Flattery tallied once into The magpie appears in 12% of candidates before judging and 18% after three rounds, not "unprompted by the third". Judges can only reward flattery that gets sampled. Seeding from ".", five candidates and +3 to the winner reaches about 50% in three rounds
- the floor-of-0 update deletes transitions and can strand rows with no followers. Add a "leash" rule (never remove a row's last counter/tally), the classroom analogue of the KL penalty to the reference model, and a variation without it
- the reveal compares one sentence per table, which is mostly dice noise; compare the seed word's rows side by side instead
- five-minute rounds with one or two generators are too short on a grid (every update changes the dice ranges); one generator per candidate, in parallel

Keep the URL: decide whether the module keeps the /modules/rlhf/ slug or gets a new one with a redirect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The module runs a human-panel table and a rule-card table from the same base model, plus a thumbs-up round
- [ ] #2 The page includes a leash rule and says what happens without it
- [ ] #3 A test simulates the rounds as written and checks every claim the page makes about how fast the models drift
- [ ] #4 Connection to current LLMs covers RLHF, DPO, RLVR and the GPT-4o sycophancy rollback, with links
- [ ] #5 Old RLHF URLs resolve to the new module
<!-- AC:END -->
