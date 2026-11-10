---
id: TASK-170.02
title: Fold Sycophancy's training-data route into Fine-tuning as an adapter section
status: Done
assignee: []
created_date: '2026-11-09T23:50:00Z'
updated_date: '2026-11-10T04:26:00Z'
due_date: '2026-11-20'
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

Timing: ready by 21 Nov (Canberra time) so James Prather can use it with the rewards module's thumbs-up round in his Sycophancy week (23 Nov; US Thanksgiving week, so possibly a short one). His class ran Fine-tuning and LoRA the week of 9 Nov, so this section is a return to a sheet they know. The section is additive: the Sycophancy page stays live and unchanged until TASK-170.04 retires it, and the section can stay grid-only (Build, break, extend, the one cutouts lesson that used Sycophancy, retires in 170.04 too).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fine-tuning has a sycophancy section using the printable sycophancy sheet's actual phrases, tallied as an adapter
- [x] #2 Any claim about the dose-response round is checked by a simulation test
- [x] #3 The Sycophancy page is unlisted but still loads at /modules/sycophancy/ until TASK-170.04
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fine-tuning and LoRA has 'A nasty adapter: flattery' (commit 39cf17f3): three lines from the printable sycophancy sheet tallied onto an adapter sheet, hooking into the magpie's model after ., ! and is. Dose-response at strengths 0, 1, 2 and 4 gives about 0, 1.5, 2.5 and 4 flattering sentences in ten; test/fineTuning.test.ts checks the quotes against data/originals/sycophancy.txt, the eight new words, the hooks and the counts. The 250-poisoned-documents link was dropped rather than adding a trigger-word variation. Sycophancy is unlisted with replacedBy: fine-tuning; its inbound links (glossary, Materials page, Agentic AI) now point at Fine-tuning or Rewards. Build, break, extend is unlisted and points at Shaping a model.
<!-- SECTION:FINAL_SUMMARY:END -->
