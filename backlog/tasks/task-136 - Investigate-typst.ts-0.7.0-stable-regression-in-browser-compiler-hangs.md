---
id: TASK-136
title: Investigate typst.ts 0.7.0-stable regression (in-browser compiler hangs)
status: Done
assignee: []
created_date: '2026-07-17 01:30'
updated_date: '2026-07-17 02:15'
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
- [x] #1 Root cause of the 0.7.0 init hang is identified (or a reproducible upstream issue is filed with Myriad-Dreamin/typst.ts)
- [x] #2 Website builds against a typst.ts release newer than 0.7.0-rc2, with /tools/ reaching 'Compiler ready' and rendering an SVG preview in a real browser
- [x] #3 Automated coverage exists that fails when compiler init breaks (wasm init smoke test; the existing typstCompiler.test.ts only covers pure state helpers)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: not a typst.ts regression. The rc2→stable package diff shows the JS init path is byte-identical (only sourcemaps and a rebuilt wasm binary differ), and 0.7.0 stable works end-to-end in both a production build (astro preview) and the dev server: /tools/ reaches 'Compiler ready' and renders an SVG booklet preview (verified with agent-browser, 2026-07-17).

The phantom hang was a testing artifact: TypstCompiler is mounted client:visible, and its SSR HTML shows the idle-state 'Loading compiler...' spinner with an empty log and disabled inputs. If the widget is never scrolled into the viewport it stays that way forever — no wasm fetch, no console output, no log entries — which matches the reported symptom exactly. (Several stale astro dev/preview servers from other projects were also squatting the 4331/4332 ports during the original verification.)

Fixes: bumped the three @myriaddreamin/typst* pins to 0.7.0 stable; added test/typstWasmInit.test.ts, which inits both the web-compiler and renderer wasm from the pinned packages (bytes fed directly, no network) and compiles a shape-only document. Verified the test fails loudly on a corrupt wasm module.
<!-- SECTION:NOTES:END -->
