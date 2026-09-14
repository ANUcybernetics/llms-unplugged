---
id: TASK-154
title: Build the eight explainer videos once the beat sheets are reviewed
status: To Do
assignee: []
created_date: '2026-09-14 04:14'
updated_date: '2026-09-14 09:21'
labels:
  - video
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The series plan, beat sheets and scripts for the eight LLMs Unplugged explainer videos (Overview, the four sections of the 2h My First Language Model, the three sections of the ledger How AI writes stories) are in ops/video/README.md and ops/video/scripts/<slug>.md. Ben is reviewing the beat sheets; the beat-sheets PDF is on daysy. Nothing is rendered until his comments are in. Phase 1 is animation plus Ben/Eddie voice-over via the llms-unplugged-video skill (HyperFrames compositions in ops/video/<slug>/); phase 2 re-cuts the (TC) lines with piece-to-camera footage later, so scripts and compositions must stay in step and a line tweak must be re-cuttable. VO takes, footage and renders go in the bucket under video/<slug>/, never git. The Matt Jelly production context is in Ben's PKB note (home:640) and todo home:390.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ben's beat-sheet comments are applied to ops/video/scripts/*.md and committed before any composition is started
- [ ] #2 One composition (training-grid) is built first as the template, rendered, and checked by Ben before the other seven
- [ ] #3 Each of the eight videos has a composition in ops/video/<slug>/ that passes npm run check and renders from the current script and the VO takes
- [ ] #4 Re-editing a script line and re-rendering that video needs no manual steps beyond re-recording the line
- [ ] #5 Renders and VO takes live in the bucket under video/<slug>/ and are not committed
- [ ] #6 The Overview composition also renders a 9:16 variant from an aspect parameter (restacked layout, not a crop); the other seven are 16:9 only
- [ ] #7 Every composition bakes in open captions (the script line, whole, in the site's type, in a reserved caption region) timed by forced alignment of the VO take against the script, and writes a WebVTT sidecar from the same timing
- [ ] #8 Compositions build their visuals fresh from the deck data and site styles rather than reusing deck widgets as layout; the frame does the pointing a presenter would do in the room
- [ ] #9 Final renders are 4K at 50 fps (landscape-4k, portrait-4k for the Overview variant); drafts are 1080p
<!-- AC:END -->
