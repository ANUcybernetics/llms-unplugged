---
id: TASK-170.01
title: >-
  Replace the RLHF module with a rewards module: human panel vs rule card,
  thumbs-up finale
status: Done
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T04:26:00Z'
due_date: '2026-11-13'
labels:
  - website
  - modules
dependencies: []
parent_task_id: TASK-170
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One base model, two tables. One table's candidates are ranked by a human panel (RLHF); the other's by a rule card, a checkable criterion (RLVR, how reasoning models are trained now). The rule table should move faster and more consistently, then find a degenerate way to win (reward hacking against a checker); the human panel disagrees with itself. Finale: a thumbs-up round where the room rewards whatever it likes best, which turns the model sycophantic, with the GPT-4o April 2025 rollback as the reveal. This round takes over Sycophancy's main point.

Design points from review (Nov 2026):

- a rule like "reward the candidate that reaches . soonest" isn't hacked when short sentences win, it's satisfied. Reward hacking needs a gap between what the rule-writer wanted and what the check measures: print both on the card (intent: "a complete, sensible sentence"; check: "ends in . within eight words and contains a verb from this list"), make the check pass/fail, and simulate that the gap actually gets exploited before the page promises it
- the thumbs-up round must not tell the room to reward flattery, or the result is built in. Students vote on what they like; flattery winning has to emerge (or not), and the page says what to do when it doesn't
- the round only shows praise sycophancy; say so, and name agreement sycophancy (caving to the user's view) as the other kind
- the module as specified is 45–50 minutes, not 30. Either budget that or make the thumbs-up finale an optional extension so the core runs in 30

Problems in the current RLHF page that the new module must not inherit (found by Monte Carlo simulation, Nov 2026):

- the reward-hacking round fizzles. Flattery tallied once into The magpie appears in 12% of candidates before judging and 18% after three rounds, not "unprompted by the third". Judges can only reward flattery that gets sampled. Seeding from ".", five candidates and +3 to the winner reaches about 50% in three rounds
- the floor-of-0 update deletes transitions and can strand rows with no followers. Add a "leash" rule, the classroom analogue of the KL penalty to the reference model, and a variation without it. "No cell moves more than two from the reference copy" is closer to the KL penalty than "never remove a row's last tally", and also prevents stranding
- the reveal compares one sentence per table, which is mostly dice noise; compare the seed word's rows side by side instead
- five-minute rounds with one or two generators are too short on a grid (every update changes the dice ranges); one generator per candidate, in parallel

URL: /modules/rewards/. The old RLHF URLs redirect there once TASK-170.04 retires the RLHF page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The module runs a human-panel table and a rule-card table from the same base model, plus a thumbs-up round
- [x] #2 The page includes a leash rule and says what happens without it
- [x] #3 A test simulates the rounds as written and checks every claim the page makes about how fast the models drift
- [x] #4 Connection to current LLMs covers RLHF, DPO, RLVR and the GPT-4o sycophancy rollback, with links
- [x] #5 The module is live at /modules/rewards/, with the current RLHF page left in place for TASK-170.04 to redirect
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Timing (Nov 2026): James Prather runs this in his RLHF week (16 Nov, US central time), so the core (human panel vs rule card, with the leash) needs to be live by 13 Nov his time (14 Nov Canberra), and the thumbs-up round by 20 Nov for his Sycophancy week. If the rule card's gap doesn't produce a reliable hack in simulation by then, don't ship the core for his week: TASK-171 fixes the RLHF page for him, and this module lands after his semester. Publish it at /modules/rewards/ alongside the current RLHF page, which stays at /modules/rlhf/ until TASK-170.04 redirects it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewards is live at /modules/rewards/ (commit 5582f874). Both tables tune The magpie's nest toward the same goal, sentences about the magpie: five candidates a round, three rounds, a panel ranking best/worst at one table and a pass/fail rule card at the other. The rule card checks for the word magpie, not the sentence-length check the description proposed: simulation showed a length check is mostly satisfied by real short sentences, while the keyword check is gamed by garbled sentences (It sits in the magpie warbles.), pass rate about a third to nearly two-thirds, garbled passes one in seven to more than one in four. The leash is 'never rub out a pair's last count', not 'no cell moves more than two', because the band version still deletes pairs with counts of 1 or 2; without the leash about a quarter of the 49 pairs vanish in three rounds. Thumbs-up round uses a cup of six answers (right, wrong, clever, kind, rude, late); with voters who like praise, 18 votes take the pleasing three from half the cup to about three-quarters. test/rewards.test.ts (helpers in test/utils/rewardsSim.ts) checks every number on the page. RLHF is unlisted with replacedBy: rewards. Verified with pnpm run check and a browser look at both pages.
<!-- SECTION:FINAL_SUMMARY:END -->
