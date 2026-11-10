---
id: TASK-170.03
title: Run the Synthetic Data relay as replace and accumulate chains side by side
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T03:43:00Z'
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
- [ ] #1 The page runs a replace chain and an accumulate chain and compares their far ends
- [ ] #2 The example table and timing claims match a test that simulates the chains
- [ ] #3 Connection to current LLMs covers accumulate vs replace and current synthetic-data practice, with links
- [ ] #4 The page counts rows on the sheet as well as distinct words in the output
<!-- AC:END -->
