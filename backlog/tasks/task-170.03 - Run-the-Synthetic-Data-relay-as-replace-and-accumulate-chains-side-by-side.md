---
id: TASK-170.03
title: Run the Synthetic Data relay as replace and accumulate chains side by side
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
The relay only shows the replace case (each link trains a fresh model on the previous link's output), which the literature treats as the worst case. Accumulating avoids collapse, and has a cheap classroom form: pass the same sheet down the chain and tally each group's output into it.

Simulated mean distinct words per link, 60 tokens per pass, starting from The Cat in the Hat (Nov 2026):

- replace: 42, 29, 23, 19, 16
- accumulate (sheet starts from link A's text): 42, 29, 28, 27, 26
- accumulate onto the real model: 42, 41, 42, 41, 41

Accumulating is also quicker per link because nobody rules up a new sheet, which fixes the current page's optimistic timing (training a fresh ~40-word grid plus rolling 60 words is closer to ten minutes than five). Other current-page issues: its example table ends 15 → 9, steeper than a typical chain, and chains rarely lock into a loop within five links at 60 words per pass.

Stretch: a filtered chain that only passes on sentences meeting a check, which is how much synthetic data is made now (rejection sampling against a verifier) and links back to the rule card in the rewards module.

Connection section: synthetic data is now standard practice (distillation of reasoning traces into small open models, verifier-filtered rollouts); collapse comes from replacing real data (Shumailov et al. 2024), and accumulating avoids it (Gerstgrasser et al. 2024).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The page runs a replace chain and an accumulate chain and compares their far ends
- [ ] #2 The example table and timing claims match a test that simulates the chains
- [ ] #3 Connection to current LLMs covers accumulate vs replace and current synthetic-data practice, with links
<!-- AC:END -->
