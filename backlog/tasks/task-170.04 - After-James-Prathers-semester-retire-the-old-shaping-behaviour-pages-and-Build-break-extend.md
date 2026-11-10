---
id: TASK-170.04
title: >-
  After James Prather's semester: fold in his feedback, delete the unlisted old
  pages and add redirects
status: To Do
assignee: []
created_date: '2026-11-10T03:47:00Z'
updated_date: '2026-11-10T04:30:00Z'
labels:
  - website
  - modules
  - lessons
dependencies:
  - TASK-170.01
  - TASK-170.02
  - TASK-170.03
parent_task_id: TASK-170
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Don't start before 11 Dec 2026. James Prather teaches the shaping-behaviour weeks of 16, 23 and 30 Nov, with exams the week of 7 Dec. The new modules are live (Rewards, Fine-tuning's flattering adapter, the two-chain Synthetic Data), and the pages they replace are unlisted with a replacedBy field, linked from nowhere else on the site but still loading at the deep links we sent James:

- /modules/rlhf/ (replacedBy: rewards)
- /modules/sycophancy/ (replacedBy: fine-tuning)
- /modules/synthetic-data-relay/ (replacedBy: synthetic-data)
- /lessons/build-break-extend/ (listed: false, with a callout pointing at Shaping a model)

Start by asking James how each session went (which version he ran, what took longer than the page says, what the students got and missed) and fold that into the pages. A module his class ran moves from experimental to piloted.

Then delete the unlisted pages and redirect their URLs in website/astro.config.ts:

- /modules/rlhf/ and /lessons/rlhf/ to /modules/rewards/
- /modules/sycophancy/ and /lessons/sycophancy/ to /modules/fine-tuning/#a-nasty-adapter-flattery
- /modules/synthetic-data-relay/ to /modules/synthetic-data/
- /lessons/build-break-extend/ and its deck URL to /lessons/shaping-a-model/, removing src/decks/build-break-extend.deck.mdx, the sycophancy deck partials (src/decks/partials/*-sycophancy.mdx) and any partial, asset or theme rule only that deck uses

Also delete the heroes only the deleted pages use (hero-rlhf.avif, hero-synthetic-data-relay.avif, hero-build-break-extend.avif, and hero-sycophancy.avif if nothing else uses it). Keep the replacedBy field and its layout note for the next replacement; the dead-end test in test/moduleConsistency.test.ts already exempts it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 James's feedback is folded into the pages, and each module his class ran is marked piloted
- [ ] #2 The unlisted RLHF, Sycophancy, old Synthetic Data and Build, break, extend pages are deleted, with redirects from each old URL
- [ ] #3 Build, break, extend's deck and the sycophancy deck partials are removed
- [ ] #4 pnpm run check passes
<!-- AC:END -->
