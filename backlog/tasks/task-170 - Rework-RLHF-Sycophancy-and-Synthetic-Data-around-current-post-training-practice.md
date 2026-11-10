---
id: TASK-170
title: >-
  Rework RLHF, Sycophancy and Synthetic Data around current post-training
  practice
status: To Do
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T04:03:00Z'
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

Proposed shape (Nov 2026): three modules become two plus a fold, as the subtasks describe. Shaping behaviour ends up as Sampling, Beam Search, Fine-tuning and LoRA (with the sycophancy adapter), the rewards module, and Synthetic Data, and Shaping a model becomes the half-day lesson for Years 9 and up in place of Build, break, extend.

Timing: James Prather (Abilene Christian University, Texas) teaches RLHF, Sycophancy and Synthetic Data in the weeks of 16, 23 and 30 Nov 2026, and his class should get the new versions. Only Sycophancy has been run with a class, so the current pages are no safer than their replacements. The work runs in two stages:

- before each of his weeks, put the new version up alongside the old page: the rewards module core by 13 Nov (his time) and its thumbs-up round by 20 Nov (170.01), Fine-tuning's sycophancy section by 20 Nov (170.02), and Synthetic Data by 27 Nov (170.03). If one slips, TASK-171 fixes the current page for that week instead
- after his semester (from 11 Dec), TASK-170.04 folds in his feedback and retires the old pages, Sycophancy and Build, break, extend

Ledger forms of these activities depend on TASK-143; write the grid version first and describe the ledger (counters in/out of the cup) as an option.

Every numeric claim on the reworked pages should be checked by a test that simulates it, as test/fineTuning.test.ts does for Fine-tuning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RLHF is replaced by a rewards module (subtask)
- [ ] #2 Sycophancy's data route lives in Fine-tuning (subtask)
- [ ] #3 Synthetic Data runs replace and accumulate chains side by side (subtask)
- [ ] #4 RLHF, Sycophancy, the old Synthetic Data page and Build, break, extend are unlisted, with no links to them from the rest of the site, but still load at their deep links
- [ ] #5 Shaping a model is re-cut as the half-day lesson for Years 9 and up, and the educators page offers it where it offered Build, break, extend
- [ ] #6 Curriculum mapping (module cards, AI themes table) and glossary match the new structure
- [ ] #7 After James's semester the unlisted pages are deleted and redirected (TASK-170.04)
- [ ] #8 pnpm run check passes
<!-- AC:END -->
