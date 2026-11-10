---
id: TASK-170
title: >-
  Rework RLHF, Sycophancy and Synthetic Data around current post-training
  practice
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T03:43:00Z'
labels:
  - website
  - modules
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The three shaping-behaviour modules (RLHF, Sycophancy, Synthetic Data) have had the least careful work of any module, and the field has moved since they were written:

- most post-training compute now goes on RL against automatic checkers (RLVR, GRPO-family), with preference RLHF one late stage among several (Tülu 3: SFT, DPO, RLVR). The RLHF module only covers human preference ranking
- sycophancy is mostly attributed to reward signals, not training data: OpenAI's April 2025 GPT-4o rollback came from an added thumbs-up/down user-feedback reward; personalisation and memory amplify it (MIT, Feb 2026); agreement and praise sycophancy are separable. The Sycophancy module only shows the data route, and only praise
- synthetic data is standard practice (distillation into small local models, reasoning traces, verifier-filtered rollouts). Collapse comes from *replacing* real data; *accumulating* synthetic alongside real avoids it (Gerstgrasser et al. 2024). The relay only runs the replace case

Proposed shape (Nov 2026): three modules become two plus a fold, as the subtasks describe. Shaping behaviour ends up as Sampling, Beam Search, Fine-tuning and LoRA (with the sycophancy adapter), the rewards module, and Synthetic Data. Build, break, extend retires with Sycophancy (TASK-170.02), and Shaping a model becomes the half-day lesson for Years 9 and up in its place: Training and Generation recap, then Fine-tuning, the rewards module and Synthetic Data, optionally ending on Sampling's poetry slam. At the modules' new lengths it no longer fits two hours, so plan it as a half day or cut it down (rewards module without the finale, only the dose-response part of Fine-tuning).

Contingent on James Prather (ACU), who is teaching RLHF, Sycophancy and Synthetic Data from the live pages in the weeks of 16 Nov, 23 Nov and 30 Nov 2026. If he'd rather the pages stay put, do TASK-171 (small fixes) instead and start this after his semester. Ledger forms of these activities depend on TASK-143; write the grid version first and describe the ledger (counters in/out of the cup) as an option.

Every numeric claim on the reworked pages should be checked by a test that simulates it, as test/fineTuning.test.ts does for Fine-tuning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RLHF is replaced by a rewards module (subtask)
- [ ] #2 Sycophancy's data route lives in Fine-tuning and Sycophancy is retired with a redirect (subtask)
- [ ] #3 Synthetic Data runs replace and accumulate chains side by side (subtask)
- [ ] #4 Shaping a model is re-cut as the half-day lesson for Years 9 and up, and the educators page offers it where it offered Build, break, extend
- [ ] #5 Curriculum mapping and glossary match the new structure
- [ ] #6 pnpm run check passes
<!-- AC:END -->
