---
id: TASK-167
title: Draft a second explainer series that goes beyond the slides
status: To Do
assignee: []
created_date: '2026-09-27 22:16'
labels:
  - video
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A second set of short LLMs Unplugged explainer videos, alongside (not replacing) the TASK-154 drafts: one overview, then one per module, each to watch standalone or play in class before the activity. Unlike TASK-154, the scripts are not bound to following the slides. They still refer to the slides and printed artefacts (same examples, palette, objects), but they can use explanations that slides can't carry: 3Blue1Brown-style continuous morphs between representations, many-sample simulations, real corpus data at scale. Candidates floated so far: rolling the die a thousand times until the tallies converge on the booklet's proportions; 'billions of word pairs' shown with real bigram counts rather than a patterned zoom; the tally grid morphing into counts, then probabilities, then a weight matrix; one model generating fifty texts in parallel to show that sampling is where the variety comes from.

Pedagogy stays with Ben: Claude proposes each video's key idea, script, beyond-the-slides beats and reads (following the ben:styled-video skill's gates), and Ben approves before anything is built. A beyond-the-slides beat has to earn its place by what it makes clearer, not by how impressive it looks. Module key ideas live in the keyIdea frontmatter in website/src/content/modules/ (mostly still empty). There are 13 modules (4 tested, 3 piloted, 6 experimental); the suggested first pass is the overview plus the 7 tested and piloted modules, but Ben decides the scope.

Several of these beats need a canvas (p5.js) layer alongside the SVG/Web Animations kit: many marks, continuous fields, generated data. That's an addition to astromotion's video engine (a canvas redrawn as a pure function of t on every seek, seeded and deterministic, pixel density 2 for 4K), released through the anu-theme-sync flow, and proven on one prototype beat before any script depends on it. The new series lives in its own directory tree and bucket prefix, so the TASK-154 compositions, scripts and renders stay as they are.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ben has confirmed which modules the series covers before any script is drafted
- [ ] #2 Every video in scope has a proposed script in the ops/video/scripts format (key idea, beat sheet, VO lines, visual directions, draft reads), stored apart from the TASK-154 scripts
- [ ] #3 Each script says which slide or printed artefact it builds on and justifies each beyond-the-slides beat by the read it makes clearer
- [ ] #4 Each video works standalone and ends by handing off to its module's activity
- [ ] #5 astromotion's video engine supports a deterministic, seekable canvas (p5.js) layer that renders at 4K, is covered by its Chrome tests, and ships in a tagged release
- [ ] #6 One beyond-the-slides prototype beat has been rendered at 4K and reviewed by Ben before the series is built
- [ ] #7 No composition is built for a script whose reads Ben hasn't approved
- [ ] #8 The TASK-154 drafts (compositions, scripts, renders) are unchanged
- [ ] #9 The styled-video skill's guidance on particles and canvas matches what the prototype showed renders well
<!-- AC:END -->
