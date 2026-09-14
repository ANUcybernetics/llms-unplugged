---
id: TASK-154
title: Build the eight explainer videos once the beat sheets are reviewed
status: To Do
assignee: []
created_date: '2026-09-14 04:14'
updated_date: '2026-09-14 11:11'
labels:
  - video
dependencies:
  - TASK-155
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the eight LLMs Unplugged explainer videos (Overview, four sections of the grid lesson, three of the ledger lesson). The standing guidance is ops/video/README.md (series, production phases, tone, model naming, visuals grammar, captions, format, aspect ratio) and the llms-unplugged-video skill (HyperFrames contract, what the pipeline renders well); the scripts with their Visual: directions are ops/video/scripts/<slug>.md. Decisions already made, all recorded there: presenters are Ben and Ushini (she/her); masters 16:9 at 4K 50 fps with a 9:16 variant of the Overview only; open captions baked in (the script line, whole, no speaker marking) plus a WebVTT sidecar, timed by forced alignment of the VO against the script; visuals are built fresh from the deck data and site styles rather than deck widgets, flat top-down, transforms/opacity/stroke draw-on only; the Overview is evergreen and names no lesson. The corpora change (task-155: the magpie book, the outdoors texts, the joey grid line, an Australian booklet text) lands first because every grid, sheet and booklet on screen comes from data/. Ben's script notes of 2026-09-14 are applied; further notes arrive as script edits and re-flow through the pipeline. Phase 1 is animation plus VO; phase 2 re-cuts the (TC) lines with footage (shoot brief in Ben's PKB home:640). VO takes, footage and renders live in the bucket under video/<slug>/, never git. Build everything now, against a scratch voice track where the real VO is not yet recorded, so every video exists as a reviewable draft and swapping in the real takes is a re-align and re-render.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ben's beat-sheet comments are applied to ops/video/scripts/*.md and committed before any composition is started
- [ ] #2 Each of the eight videos has a composition in ops/video/<slug>/ that passes npm run check and renders from the current script and the VO takes
- [ ] #3 Re-editing a script line and re-rendering that video needs no manual steps beyond re-recording the line
- [ ] #4 Renders and VO takes live in the bucket under video/<slug>/ and are not committed
- [ ] #5 The Overview composition also renders a 9:16 variant from an aspect parameter (restacked layout, not a crop); the other seven are 16:9 only
- [ ] #6 Every composition bakes in open captions (the script line, whole, in the site's type, in a reserved caption region) timed by forced alignment of the VO take against the script, and writes a WebVTT sidecar from the same timing
- [ ] #7 Compositions build their visuals fresh from the deck data and site styles rather than reusing deck widgets as layout; the frame does the pointing a presenter would do in the room
- [ ] #8 Final renders are 4K at 50 fps (landscape-4k, portrait-4k for the Overview variant); drafts are 1080p
- [ ] #9 A shared composition kit (stage, palette and type tokens, desk, tiles, grid, strip, cup, counters, die, caption band, aspect parameter) lives under ops/video/ and every composition uses it; a motion-test reel exercising each component is rendered for Ben before the eight videos are built
- [ ] #10 training-grid is built first from the kit and its structure is reused by the other seven; Ben reviews the rendered drafts of all eight, not a gate on the first
- [ ] #11 Every composition renders today from a scratch voice track (TTS or a rough read) with the same alignment path the real VO will use, so the real takes drop in with no composition changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Land task-155 first (corpora): data, Makefile, deck constants, decks, docs, then the scripts' text references. Everything on screen comes from data/.
2. Kit: ops/video/_kit/ (or the skill's assets/) with the stage, tokens copied from website/src/styles/common.css and decks/theme.css, the desk, word tiles, grid (rows/cols from examples.ts), dice strip and flat d10 face, ledger row, cup (top-down circle) and counters, booklet page (from CLI-rendered PDF via pdf-assets.sh), caption band, and an aspect parameter (landscape/portrait) that restacks. Only transforms, opacity and stroke draw-on. Register GSAP timelines per the skill's contract.
3. Motion-test reel: one composition that runs every kit component through its moves (tile lift and fly, row light and push-in, stroke draw-on, strip shading, face landing, counters dropping and one sliding out, log zoom-out, caption band). Render 1080p25 draft for Ben; iterate on what looks janky.
4. Voice: scripts/align.py (WhisperX or equivalent forced alignment against the script text) producing per-line timings JSON and a WebVTT; a scratch track per video (TTS from the script, two voices) so timing exists now. Real takes replace the scratch files under the same names.
5. training-grid composition from the script's Visual: lines, reading the timing JSON; npm run check clean; draft render; stills at beats.
6. The other seven, same pattern; the Overview with the aspect parameter and both renders.
7. Captions: the band reads the timing JSON; VTT written beside each render.
8. Final: 4K50 (landscape-4k, portrait-4k for the Overview) once real VO lands; upload renders and takes to the bucket under video/<slug>/.
<!-- SECTION:PLAN:END -->
