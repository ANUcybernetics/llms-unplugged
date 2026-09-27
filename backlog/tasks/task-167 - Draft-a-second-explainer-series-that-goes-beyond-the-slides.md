---
id: TASK-167
title: Draft a second explainer series that goes beyond the slides
status: To Do
assignee: []
created_date: '2026-09-27 22:16'
updated_date: '2026-09-27 22:28'
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

Several of the candidate beats need a canvas (p5.js) layer alongside the SVG/Web Animations kit: many marks, continuous fields, generated data. That's an addition to astromotion's video engine (a canvas redrawn as a pure function of t on every seek, seeded and deterministic, pixel density 2 for 4K), released through the anu-theme-sync flow, and proven on one prototype beat before any script depends on it. The new series lives in its own directory tree and bucket prefix, so the TASK-154 compositions, scripts and renders stay as they are.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every video in scope has a proposed script in the ops/video/scripts format (key idea, beat sheet, VO lines, visual directions, draft reads), stored apart from the TASK-154 scripts
- [ ] #2 Each script says which slide or printed artefact it builds on and justifies each beyond-the-slides beat by the read it makes clearer
- [ ] #3 astromotion's video engine supports a deterministic, seekable canvas (p5.js) layer that renders at 4K, is covered by its Chrome tests, and ships in a tagged release
- [ ] #4 One beyond-the-slides prototype beat has been rendered at 4K and reviewed by Ben before the series is built
- [ ] #5 No composition is built for a script whose reads Ben hasn't approved
- [ ] #6 The TASK-154 drafts (compositions, scripts, renders) are unchanged
- [ ] #7 The styled-video skill's guidance on particles and canvas matches what the prototype showed renders well
- [ ] #8 Ben has chosen a series structure (which how-it-works and backstory videos, and which physical formats each covers) from a written proposal, before any script is drafted
- [ ] #9 Each how-it-works video works standalone and ends by handing off to its activity; each backstory video works standalone and in a classroom
<!-- AC:END -->
