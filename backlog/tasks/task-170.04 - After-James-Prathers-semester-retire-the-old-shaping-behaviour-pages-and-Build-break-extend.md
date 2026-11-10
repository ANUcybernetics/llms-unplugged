---
id: TASK-170.04
title: >-
  After James Prather's semester: retire the old shaping-behaviour pages and
  Build, break, extend
status: To Do
assignee: []
created_date: '2026-11-10T03:47:00Z'
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
Don't start before 11 Dec 2026. James Prather teaches RLHF, Sycophancy and Synthetic Data from the live pages in the weeks of 16, 23 and 30 Nov, with exams the week of 7 Dec; until then the pages he knows stay at their URLs, alongside any new versions from TASK-170.01 to 170.03.

Start by asking James how each session went (which version he ran, what took longer than the page says, what the students got and missed) and fold that into the pages. A module his class ran moves from experimental to piloted.

Then retire what the rework replaces:

- RLHF: remove the page and redirect /modules/rlhf/ and /lessons/rlhf/ to the rewards module
- Sycophancy: remove the page and redirect /modules/sycophancy/ and /lessons/sycophancy/ to Fine-tuning's sycophancy section
- Build, break, extend: it was run once and isn't a model for future workshops. Remove the lesson, its deck (src/decks/build-break-extend.deck.mdx), the sycophancy deck partials (src/decks/partials/*-sycophancy.mdx) and any partial or theme rule only it uses; redirect /lessons/build-break-extend/ and its deck URL to Shaping a model. This also removes the duplicate order: 3 it shares with the ledger lesson

Shaping a model becomes the half-day lesson for Years 9 and up in its place: Training and Generation recap, then Fine-tuning (with the sycophancy adapter), the rewards module and Synthetic Data, optionally ending on Sampling's poetry slam. Re-cut its page around that, and offer it on the educators page where the table offered Build, break, extend.

Files known to reference the retired pages (Nov 2026): website/astro.config.ts, docs/curriculum-mapping.md, src/pages/tools.astro, src/pages/educators/index.astro, src/data/glossary.yaml, src/data/pdf-manifest.json, src/content/lessons/shaping-a-model.mdx, src/content/modules/{rlhf,agentic-ai,fine-tuning}.mdx, src/decks/partials/{scaling-up,cutouts-combining-models}.mdx, src/decks/theme.css. The news post 2026-07-02-acdict-lt-forum.md mentions Build, break, extend as history; leave it, but make sure its links still resolve.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 James's feedback is folded into the pages, and each module his class ran is marked piloted
- [ ] #2 RLHF and Sycophancy pages are removed and their old /modules/ and /lessons/ URLs redirect to the pages that now cover them
- [ ] #3 Build, break, extend, its deck and the sycophancy deck partials are removed, and its lesson and deck URLs redirect to Shaping a model
- [ ] #4 Shaping a model is re-cut as the half-day lesson for Years 9 and up, and the educators page offers it where it offered Build, break, extend
- [ ] #5 No page, deck, glossary entry, Materials link or PDF manifest entry points at a retired page
- [ ] #6 Curriculum mapping (module cards, AI themes table) and glossary match the new structure
- [ ] #7 pnpm run check passes
<!-- AC:END -->
