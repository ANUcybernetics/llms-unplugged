---
id: TASK-136
title: Investigate typst.ts 0.7.0-stable regression (in-browser compiler hangs)
status: To Do
assignee: []
created_date: '2026-07-17 01:30'
labels:
  - website
  - deps
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The three @myriaddreamin/typst* packages in website/package.json are exact-pinned to 0.7.0-rc2. Bumping them to the 0.7.0 stable release hangs the /tools/ in-browser compiler at 'Loading compiler...' indefinitely — no wasm fetch is issued, no console error, no widget log entries (verified 2026-07-17 with agent-browser against a local build; production on rc2 loads and compiles fine). Something in the contrib/all-in-one-lite init path fails silently before getModule runs. Until this is understood we're stuck on a release candidate and can't take upstream fixes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Root cause of the 0.7.0 init hang is identified (or a reproducible upstream issue is filed with Myriad-Dreamin/typst.ts)
- [ ] #2 Website builds against a typst.ts release newer than 0.7.0-rc2, with /tools/ reaching 'Compiler ready' and rendering an SVG preview in a real browser
- [ ] #3 Automated coverage exists that fails when compiler init breaks (wasm init smoke test; the existing typstCompiler.test.ts only covers pure state helpers)
<!-- AC:END -->
