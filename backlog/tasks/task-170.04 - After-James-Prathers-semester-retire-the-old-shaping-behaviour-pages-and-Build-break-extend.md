---
id: TASK-170.04
title: >-
  After James Prather's semester: fold in his feedback, delete the unlisted old
  pages and add redirects
status: To Do
assignee: []
created_date: '2026-11-10T03:47:00Z'
updated_date: '2026-11-10T04:03:00Z'
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
Don't start before 11 Dec 2026. James Prather teaches the shaping-behaviour weeks of 16, 23 and 30 Nov, with exams the week of 7 Dec. While the new modules land (TASK-170.01 to 170.03), the pages they replace are set to listed: false and every link to them is removed from the rest of the site, but they stay reachable at deep links we send James: /modules/rlhf/, /modules/sycophancy/, the old Synthetic Data page at its unlisted copy, and Build, break, extend.

Start by asking James how each session went (which version he ran, what took longer than the page says, what the students got and missed) and fold that into the pages. A module his class ran moves from experimental to piloted.

Then delete the unlisted pages and redirect their URLs:

- /modules/rlhf/ and /lessons/rlhf/ to the rewards module
- /modules/sycophancy/ and /lessons/sycophancy/ to Fine-tuning's sycophancy section
- the old Synthetic Data copy to /modules/synthetic-data/
- /lessons/build-break-extend/ and its deck URL to Shaping a model, removing src/decks/build-break-extend.deck.mdx, the sycophancy deck partials (src/decks/partials/*-sycophancy.mdx) and any partial or theme rule only that deck uses
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 James's feedback is folded into the pages, and each module his class ran is marked piloted
- [ ] #2 The unlisted RLHF, Sycophancy, old Synthetic Data and Build, break, extend pages are deleted, with redirects from each old URL
- [ ] #3 Build, break, extend's deck and the sycophancy deck partials are removed
- [ ] #4 pnpm run check passes
<!-- AC:END -->
