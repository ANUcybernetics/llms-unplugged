---
id: TASK-167
title: Draft a second explainer series that goes beyond the slides
status: In Progress
assignee: []
created_date: '2026-09-27 22:16'
updated_date: '2026-09-28 01:34'
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
- [x] #5 astromotion's video engine supports a deterministic, seekable Canvas 2D layer that renders at 4K, is covered by its Chrome tests, and ships in a tagged release
- [x] #6 One beyond-the-slides prototype beat has been rendered at 4K and reviewed by Ben before the series is built
- [ ] #7 No composition is built for a script whose reads Ben hasn't approved
- [ ] #8 The TASK-154 compositions, scripts and renders change only through kit-wide style fixes Ben has asked for, and every such change is re-rendered and checked across all eight
- [x] #9 The styled-video skill's guidance on particles and canvas matches what the prototype showed renders well
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Series (Ben's decisions, 2026-09-28). Notes and scripts live in ops/video/beyond/ (README.md, scripts/<slug>.md); the worked example throughout is The magpie (data/originals/the-magpie.txt, lowercased: 133 tokens, 24 words).

Twelve videos. The how-it-works videos are single-format, so a teacher running one flavour of workshop sees only that flavour's materials. They're generated from shared kit parts and one structure per stage, so the grid and ledger versions of a stage are cheap siblings, not separate builds. Each covers a contiguous run of its deck partial's explanation slides (section title to "Your turn"), so a later ?video deck variant can swap the run for the embed.

Grid:
1. training-grid: counting word pairs into the grid; the book at machine speed; Frankenstein at scale
2. generation-grid: sharing the d10's faces across a row by its tallies; the tree of everything the model could write; the convergence beat (10,000 words counted back into a sheet)
3. pretrained-generation-grid: the booklet; the grid folds into a booklet (rows become entries, empty boxes fall away); why a booklet not a grid (Paterson: 17 million boxes, 16,460 not empty)
4. agentic-ai-grid: a tool call is a token drawn like any other word (punctuation columns lit); you are the harness

Ledger:
5. training-ledger: the same training beats on ledger sheets
6. generation-ledger: the cup; works whether the sheets arrived pre-filled or the room filled them in (no separate pre-trained ledger video); the tree and convergence beats as in the grid version
7. agentic-ai-ledger: as the grid version, on sheets and the cup; depends on the ledger deck (TASK-168)

Cutouts:
8. generation-cutouts: matching cutouts (previous-word box, next word), picked at random

Across formats:
9. same-algorithm: grid tallies, ledger marks, counters, cutouts and numbers are one model; carries the representation morph and the walk that switches forms (both moved out of training/generation). Also the spine of the long cut.

Backstory:
10. overview (landing page, 9:16 variant too): around the morph and the tree
11. making-things-up: "Down comes the dog. Swoop!"; "Here comes the fence." is the third likeliest sentence (7%) ahead of "Here comes the dog." (2.5%); of 79 short sentences 7 are in the book, carrying about half the probability
12. real-models: powers of ten on real counts (Frankenstein heatmap 0.08% lit); more context (1-, 2-, 5-word context on Frankenstein); tokens; post-training

State of the scripts: scripts/training.md and generation.md are full drafts written before the single-format split (they mix forms and carry per-format ### Ending sections); the other five slugs have beat sheets. Ben's line decisions so far: the weights line is "When people talk about a model's 'weights', this is the kind of thing they mean: numbers that came from the text it read."; the tree line is "everything this model could have written"; the generation walk ends ". it sits on the dog ."; the convergence beat stays. All reads are still (draft).

Next session:
1. Split training.md and generation.md into their single-format versions (training-grid, training-ledger, generation-grid, generation-ledger, generation-cutouts), each with one ending; move the morph and the mixed-form walk into same-algorithm.md; update the README series table.
2. Full scripts for the remaining videos, then Ben's line notes and read approvals (he edits the files and deletes "(draft)").
3. Before any build: voice.py skips _Beyond paragraphs; video.py handles nested beyond/<slug> paths.
4. Build (styled-video gates), starting from the tree prototype at ops/video/beyond/prototype-tree/ (approved, 4K).

Settled craft: Canvas 2D layer in astromotion v0.34.0 (video/canvas.js); desk is the decks' #0d0d0d ground; punctuation is a filled symbol tile (kit punctBox/punctTile/punctInPlace); beats like the tree may be laid out to trim to a squarer frame for a portrait talking-head on the right (decided per beat at the storyboard).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: Canvas 2D layer committed in astromotion (9fabe4c: video/canvas.js, tl.draw hook, rng, phase; 6 Chrome tests, suite 354/354), not yet released. Tree prototype at ops/video/beyond/prototype-tree/ (untracked until the release: its kit/motion points at the sibling repo) rendered to out/video/beyond/prototype-tree/ at 1080p25 and 4K50; awaiting Ben's review (AC #6). video.py doesn't handle a nested slug (beyond/<slug>); fix before building the series. Canvas craft for AC #9: canvas carries the mass of marks, type stays DOM on top; ink (opacity x width) proportional to probability avoids banding at column junctions; hairlines ~0.5 CSS px are crisp at 4K but haze at 1080p.

2026-09-28: Ben approved the tree prototype (AC #6). Layout option he raised: trim beats like the tree to a squarer frame so a portrait talking-head can sit on the right; decide per beat when the storyboards are drawn.

astromotion v0.34.0 released (Canvas 2D layer) and pinned in website/; the prototype now uses the kit's normal engine link and is committed (bd419857).

styled-video skill has the canvas guidance the prototype showed (claude-plugin-personal d764c09, not pushed).
<!-- SECTION:NOTES:END -->
