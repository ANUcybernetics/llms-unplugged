---
id: TASK-167
title: Draft a second explainer series that goes beyond the slides
status: In Progress
assignee: []
created_date: '2026-09-27 22:16'
updated_date: '2026-09-28 01:48'
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
- [x] #2 Every video in scope has a proposed script in the ops/video/scripts format (key idea, beat sheet, VO lines, visual directions, draft reads), stored apart from the TASK-154 scripts
- [x] #3 Each script says which slide or printed artefact it builds on and justifies each beyond-the-slides beat by the read it makes clearer
- [ ] #4 Each how-it-works video works standalone and ends by handing off to its activity; each backstory video works standalone and in a classroom
- [x] #5 astromotion's video engine supports a deterministic, seekable Canvas 2D layer that renders at 4K, is covered by its Chrome tests, and ships in a tagged release
- [x] #6 One beyond-the-slides prototype beat has been rendered at 4K and reviewed by Ben before the series is built
- [ ] #7 No composition is built for a script whose reads Ben hasn't approved
- [ ] #8 The TASK-154 compositions, scripts and renders change only through kit-wide style fixes Ben has asked for, and every such change is re-rendered and checked across all eight
- [x] #9 The styled-video skill's guidance on particles and canvas matches what the prototype showed renders well
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Series (Ben's decisions, 2026-09-28): twelve videos, listed with draft key ideas in ops/video/beyond/README.md. Scripts are ops/video/beyond/scripts/<slug>.md; the worked example throughout is The magpie (data/originals/the-magpie.txt). How-it-works videos are single-format and built from shared kit parts, one structure per stage, so grid and ledger siblings are cheap. same-algorithm carries the morph and the mixed-form walk.

State: all twelve scripts are drafted in full (key idea, beat sheet, lines, visuals, _Beyond_ lines, draft reads); every read is still (draft). Ben's line decisions are in them: the weights line, the tree line ('And here's everything this model could have written instead.'), the walk '. it sits on the dog .', the convergence beat. Open questions are the scripts' _Reads note:_ lines (notably: the grid's die rounding on 17 and 19 tallies, and the ledger sheet keeping 'Here', 'Down', 'Swoop' capitalised). agentic-ai-ledger's Builds on waits on the TASK-168 deck.

Tooling done: voice.py skips _Beyond paragraphs; voice.py, align.py and video.py take nested slugs (beyond/<slug>), rendering to out/video/beyond/<slug>/ and the bucket's video/beyond/<slug>/.

Next:
1. Ben's line notes and read approvals (he edits the scripts and deletes '(draft)').
2. Build each approved script (styled-video gates), starting from the tree prototype at ops/video/beyond/prototype-tree/; 1080p25 drafts, then 4K50 masters of every video (Ben has OK'd rendering them all).

Settled craft: Canvas 2D layer in astromotion v0.34.0 (video/canvas.js); desk is the decks' #0d0d0d ground; punctuation is a filled symbol tile (kit punctBox/punctTile/punctInPlace); beats like the tree may be laid out to trim to a squarer frame for a portrait talking-head (decided per beat at the storyboard).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: training/generation split into single-format scripts; full scripts for all twelve (8a9cfce2). Numbers re-checked against the CLI: Paterson 3,967 words, 16,231 of ~16 million boxes non-empty; Frankenstein 7,023 words, 41,018 of 49 million (0.08%); magpie short sentences 79, 7 in the book, about four draws in ten land on one. Nested-slug tooling in ad6e36bc.
<!-- SECTION:NOTES:END -->
