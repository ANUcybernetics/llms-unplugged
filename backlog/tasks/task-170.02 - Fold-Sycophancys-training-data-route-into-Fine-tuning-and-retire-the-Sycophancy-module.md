---
id: TASK-170.02
title: >-
  Fold Sycophancy's training-data route into Fine-tuning and retire the
  Sycophancy module
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
Adding flattery phrases and getting flattery back is close to circular, and the data route is the weaker real-world cause of sycophancy (the reward route moves to the rewards module). Fine-tuning and LoRA already calls the phrases "a deliberately nasty adapter", so the data route becomes a short section there, using the printable sheet built from data/originals/sycophancy.txt.

Cost: Sycophancy is the one module of the three that has been run with a group (status: piloted), and the Shaping a model lesson and the grid/cutouts sycophancy deck partials (src/decks/partials/*-sycophancy.mdx) use it. Check which decks include those partials before retiring anything.

Worth carrying into the new section: a dose-response measurement (tally the sheet 0, 1, 2 or 4 times, count flattering sentences in ten generations, plot on the board), which connects to the Oct 2025 Anthropic/UK AISI/Turing finding that about 250 poisoned documents can backdoor a model regardless of size.

Known bugs in the current page, moot if it is retired: its phrase list is the pre-July-2026 LLM-trope set, not the picture-book-crossover text in data/originals/sycophancy.txt that the printable sheet uses; its example "i am absolutely right" needs am → absolutely, which no phrase contains.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fine-tuning has a sycophancy section using the printable sycophancy sheet's actual phrases
- [ ] #2 /modules/sycophancy/ and /lessons/sycophancy/ redirect to the page that now covers it
- [ ] #3 No deck, lesson or module links to the retired page
- [ ] #4 Shaping a model is re-cut around the new structure
<!-- AC:END -->
