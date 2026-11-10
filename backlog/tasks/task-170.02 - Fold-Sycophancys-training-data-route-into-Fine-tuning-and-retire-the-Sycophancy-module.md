---
id: TASK-170.02
title: >-
  Fold Sycophancy's training-data route into Fine-tuning and retire Sycophancy
  and Build, break, extend
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
Adding flattery phrases and getting flattery back is close to circular, and the data route is the weaker real-world cause of sycophancy (the reward route moves to the rewards module). Fine-tuning and LoRA already calls the phrases "a deliberately nasty adapter", so the data route becomes a short section there, using the printable sheet built from data/originals/sycophancy.txt. Tally the phrases onto an adapter sheet, not into the base grid, so the dose is Fine-tuning's "scale it" knob and the adapter can be taken off again.

Worth carrying into the new section: a dose-response measurement (apply the adapter at 0, 1, 2 or 4 times, count flattering sentences in ten generations, plot on the board). Don't link it to the Oct 2025 Anthropic/UK AISI/Turing finding that about 250 poisoned documents can backdoor a model regardless of size as it stands: on a grid the proportion of poisoned text matters, not the count, so the link runs backwards. Either add a rare trigger-word variation (a word that never appears in the base text, whose few tallies fire every time it's rolled however big the grid) and link that, or drop the reference.

Build, break, extend retires with Sycophancy. It has been run once, isn't a constraint on the new structure, and Shaping a model takes its half-day slot (see TASK-170). Sycophancy's piloted status came from that run, and the lesson is why the module needed a cutouts form; neither carries over, so the Fine-tuning section can stay grid-only.

Known bugs in the current page, moot once it is retired: its phrase list is the pre-July-2026 LLM-trope set, not the picture-book-crossover text in data/originals/sycophancy.txt that the printable sheet uses; its example "i am absolutely right" needs am → absolutely, which no phrase contains.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fine-tuning has a sycophancy section using the printable sycophancy sheet's actual phrases, tallied as an adapter
- [ ] #2 /modules/sycophancy/ and /lessons/sycophancy/ redirect to the page that now covers it
- [ ] #3 Build, break, extend is retired: its deck, the sycophancy deck partials and any slides only it uses are removed, and /lessons/build-break-extend/ and its deck URL redirect to Shaping a model
- [ ] #4 The educators page, Materials page, glossary, other modules and decks no longer link to Sycophancy or Build, break, extend
- [ ] #5 Any claim about the dose-response round is checked by a simulation test
<!-- AC:END -->
