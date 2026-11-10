---
id: TASK-170.03
title: Run the Synthetic Data relay as replace and accumulate chains side by side
status: Done
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T04:26:00Z'
due_date: '2026-11-27'
labels:
  - website
  - modules
dependencies: []
parent_task_id: TASK-170
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The relay only shows the replace case (each link trains a fresh model on the previous link's output), which the literature treats as the worst case. Accumulating avoids collapse, and has a cheap classroom form: pass the same sheet down the chain and tally each group's output into it.

Simulated mean distinct words per link, 60 tokens per pass, starting from The Cat in the Hat (Nov 2026):

- replace: 42, 29, 23, 19, 16
- accumulate (sheet starts from link A's text): 42, 29, 28, 27, 26
- accumulate onto the real model: 42, 41, 42, 41, 41

Choose the accumulate variant deliberately. Accumulating onto the real model is the faithful analogue of Gerstgrasser et al. (the real data stays in the pool) and is the one that stays flat, but it needs the head of the chain to be a grid trained on the real text, not a booklet. Starting the sheet from link A's output is cheaper but still drifts.

Measure the sheet as well as the output: count the rows (words the model can still produce) at each link alongside distinct words in the generated text, since the rows are what collapse and the output count is noisy.

Accumulating saves ruling up a new sheet, but each link's tallies land on a bigger grid, so don't claim it's quicker per link without timing it. The current page's timing is optimistic either way: training a fresh ~40-word grid plus rolling 60 words is closer to ten minutes than five. Other current-page issues: its example table ends 15 → 9, steeper than a typical chain, and chains rarely lock into a loop within five links at 60 words per pass. Joker mode becomes a variation, not part of the core run.

Stretch: a filtered chain that only passes on sentences meeting a check, which is how much synthetic data is made now (rejection sampling against a verifier) and links back to the rule card in the rewards module.

Connection section: synthetic data is now standard practice (distillation of reasoning traces into small open models, verifier-filtered rollouts); collapse comes from replacing real data (Shumailov et al. 2024), and accumulating avoids it (Gerstgrasser et al. 2024).

Set the module's order so it sorts after Fine-tuning and the rewards module in Shaping behaviour (it is currently order 9, ahead of both).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The page runs a replace chain and an accumulate chain and compares their far ends
- [x] #2 The example table and timing claims match a test that simulates the chains
- [x] #3 Connection to current LLMs covers accumulate vs replace and current synthetic-data practice, with links
- [x] #4 The page counts rows on the sheet as well as distinct words in the output
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Timing (Nov 2026): James Prather teaches this in the week of 30 Nov; aim to land it by 27 Nov (his time). The new version takes /modules/synthetic-data/; keep the current page at an unlisted copy so James can still run it from a deep link until TASK-170.04 deletes it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Synthetic Data now runs a replace chain and an accumulate chain side by side (commit 871b5264). Both start from The magpie's nest rather than The Cat in the Hat, at forty words a link, so the lesson uses one story throughout and a link fits in about ten minutes. The accumulate chain is the faithful Gerstgrasser version: one sheet starting from the story's own tallies, each link adding its output. Typical counts (words the model knows / words it used): replace 32/18, 17/14, 14/12, 12/10; accumulate 32 throughout, 18 then 17. test/syntheticData.test.ts runs both chains 4,000 times and checks the table and claims; the ten-minute link timing is an estimate, not simulated. Filter and Joker chains are variations. The old relay page is unlisted at /modules/synthetic-data-relay/ with replacedBy: synthetic-data.
<!-- SECTION:FINAL_SUMMARY:END -->
