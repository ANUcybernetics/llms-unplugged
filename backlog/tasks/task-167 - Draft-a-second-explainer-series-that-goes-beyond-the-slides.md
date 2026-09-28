---
id: TASK-167
title: Draft a second explainer series that goes beyond the slides
status: In Progress
assignee: []
created_date: '2026-09-27 22:16'
updated_date: '2026-09-28 00:25'
labels:
  - video
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A second set of short LLMs Unplugged videos, alongside (not replacing) the TASK-154 drafts. Unlike TASK-154, the scripts are not bound to following the slides. They still refer to the slides and printed artefacts (same examples, palette, objects), but they can use explanations that slides can't carry: 3Blue1Brown-style continuous morphs between representations, many-sample simulations, real corpus data at scale. Candidates floated so far: rolling the die a thousand times until the tallies converge on the booklet's proportions; 'billions of word pairs' shown with real bigram counts rather than a patterned zoom; the tally grid morphing into counts, then probabilities, then a weight matrix; one model generating fifty texts in parallel to show that sampling is where the variety comes from.

## The design problem: which videos

The series structure is not settled; working out which videos to make is the first part of this task. What Ben has said so far (2026-09-28), as input rather than decisions:

- The website's tested/piloted/experimental labels are finer-grained than the evidence justifies. What is actually solid:
  - My First Language Model (grids), all its modules up to the 2-hour version (training, generation, pre-trained generation, agentic AI).
  - Generation with the cutouts. Training with the cutouts is mostly printing and cutting out the cutout sheets, so it may not need a video.
  - The ledger's training and generation. The ledger has also been run pre-trained first (as in the 'How AI writes stories' ledger deck), so the ledger could have training, generation and pre-trained versions.
- Longer term, ledgers and grids may be used more interchangeably, possibly even a training/generation/pre-trained/agentic MFLM workshop run on ledgers (there's no deck for that yet). That argues for how-it-works videos that aren't welded to one physical format.
- The search sheets have mostly served as a shorter public talk rather than a hands-on workshop. They work well for that and are a useful lighter-touch resource for teachers, but they're a different kind of use from the workshops.
- Every other module (including weighted randomness and sycophancy) is off-Broadway: probably no video.
- One possible shape: one video per module that just explains how it works, plus a few backstory videos. The overview (which would also be the landing-page video on the website) is one of those; a couple more could capture aspects of the material and workshops useful for classroom use without being explanations of a specific module's activity.

Ben isn't sure about this shape, so the first deliverable is a proposed series (which videos, how they group, which physical formats each covers, how the backstory videos differ from the how-it-works ones) for him to decide on.

## Constraints

Pedagogy stays with Ben: Claude proposes each video's key idea, script, beyond-the-slides beats and reads (following the ben:styled-video skill's gates), and Ben approves before anything is built. A beyond-the-slides beat has to earn its place by what it makes clearer, not by how impressive it looks. Module key ideas live in the keyIdea frontmatter in website/src/content/modules/ (mostly still empty).

Several of the candidate beats need a Canvas 2D layer (plain browser canvas, no p5.js: it would add a dependency for every consumer and its draw loop fights the seek model) alongside the SVG/Web Animations kit: many marks, continuous fields, generated data. That's an addition to astromotion's video engine (a canvas redrawn as a pure function of t on every seek, seeded and deterministic, pixel density 2 for 4K), released through the anu-theme-sync flow, and proven on one prototype beat before any script depends on it. The new series lives in its own directory tree and bucket prefix, so the TASK-154 compositions, scripts and renders stay as they are.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ben has chosen a series structure (which how-it-works and backstory videos, and which physical formats each covers) from a written proposal, before any script is drafted
- [ ] #2 Every video in scope has a proposed script in the ops/video/scripts format (key idea, beat sheet, VO lines, visual directions, draft reads), stored apart from the TASK-154 scripts
- [ ] #3 Each script says which slide or printed artefact it builds on and justifies each beyond-the-slides beat by the read it makes clearer
- [ ] #4 Each how-it-works video works standalone and ends by handing off to its activity; each backstory video works standalone and in a classroom
- [ ] #5 astromotion's video engine supports a deterministic, seekable Canvas 2D layer that renders at 4K, is covered by its Chrome tests, and ships in a tagged release
- [x] #6 One beyond-the-slides prototype beat has been rendered at 4K and reviewed by Ben before the series is built
- [ ] #7 No composition is built for a script whose reads Ben hasn't approved
- [ ] #8 The TASK-154 drafts (compositions, scripts, renders) are unchanged
- [ ] #9 The styled-video skill's guidance on particles and canvas matches what the prototype showed renders well
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Series proposal (2026-09-28). Ben has agreed the shape; he confirms this written version before scripts start (AC #1).

Shape: four how-it-works videos written as one continuous argument (shared data, shared morphs, each one standalone), so they chain into a long cut, plus three backstory videos. The spine is that every physical format holds the same numbers: grid tallies, ledger marks, counters in the cup, d10 faces and cutout slips are all counts of which word followed which. So each how-it-works video explains the mechanism in whatever form reads best, and only its closing hand-off is format-specific. The ending is a composition parameter (like the Overview's aspect ratio), one render per format.

How-it-works (in long-cut order):
1. training: models learn by counting which words follow which. Beats: the representation morph (tallies -> ledger marks -> counters -> die faces -> probabilities -> a weight matrix); the same pencil action at machine speed on real corpora (the magpie book, then Frankenstein), where 'billions of word pairs' gets real counts. Endings: grid, ledger.
2. generation: text is generated one word at a time by sampling from learned counts. Never assumes the viewer did the counting, so it also plays where the ledger lesson generates from finished sheets before training. Beats: the tree of every text the grid can write, one path taken by the dice; generation is training run backwards (count the pairs in 10,000 generated words and the grid comes back). Endings: grid, ledger, cutouts.
3. pre-trained generation: you can generate from a model someone else trained on a much bigger text. Beats: the grid folds into a booklet (rows become entries, empty boxes fall away); why a booklet and not a grid (Paterson: 17 million boxes, 16,460 not empty). Ending: booklet.
4. agentic AI: a tool call is sampled like any other word; generation pauses, the tool runs, and generation continues with the result spliced in. Beat: the die lands on the tool-call face. Ending: grid.

Backstory:
Series notes and scripts: ops/video/beyond/ (README.md, scripts/<slug>.md). The worked example throughout is The magpie.

5. overview (landing page): reworked around the morph and the tree rather than a tour of the materials.
6. making things up: a grid trained on two true sentences fluently generates a false one; hallucination falls out of the mechanism. Classroom-ready on its own.
7. real models (your grid vs Claude or ChatGPT): what's the same and what isn't. A powers-of-ten zoom (grid, booklet, real corpus counts, vocabulary squared) and a sparse real bigram heatmap (why real models can't be bigger tables), then the honest differences: context length, tokens, learned representations, fine-tuning.

Held in reserve: what happens when AI learns from AI (retraining on its own output until the rare pairs die out). Out of scope: search sheets, cutout training, the off-Broadway modules.

Long cut: 1-4 chained under one cold open, built from the same compositions with the per-video hand-offs removed.

Deck alignment: each how-it-works video starts and ends where a contiguous run of deck slides does, so a later ?video deck variant (existing _if: param gating) can swap that run for the embed, with the ending matching that deck's format. No deck changes under this task.

Prototype beat for the canvas layer (AC #5, #6): the tree of possible texts. It's the hardest engine case (thousands of seeded marks, redrawn deterministically on every seek, at 4K) and the beat most likely to survive into a script.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: Canvas 2D layer committed in astromotion (9fabe4c: video/canvas.js, tl.draw hook, rng, phase; 6 Chrome tests, suite 354/354), not yet released. Tree prototype at ops/video/beyond/prototype-tree/ (untracked until the release: its kit/motion points at the sibling repo) rendered to out/video/beyond/prototype-tree/ at 1080p25 and 4K50; awaiting Ben's review (AC #6). video.py doesn't handle a nested slug (beyond/<slug>); fix before building the series. Canvas craft for AC #9: canvas carries the mass of marks, type stays DOM on top; ink (opacity x width) proportional to probability avoids banding at column junctions; hairlines ~0.5 CSS px are crisp at 4K but haze at 1080p.

2026-09-28: Ben approved the tree prototype (AC #6). Layout option he raised: trim beats like the tree to a squarer frame so a portrait talking-head can sit on the right; decide per beat when the storyboards are drawn.
<!-- SECTION:NOTES:END -->
