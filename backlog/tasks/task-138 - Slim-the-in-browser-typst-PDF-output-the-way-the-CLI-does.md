---
id: TASK-138
title: Slim the in-browser typst PDF output the way the CLI does
status: To Do
assignee: []
created_date: '2026-08-05 09:41'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The CLI now repacks every PDF it writes with `qpdf --object-streams=generate`, which packs typst's uncompressed accessibility tag tree into compressed object streams and cuts each cutouts/sheets file by 60-75% (commit e93bdcdf). The website's in-browser typst path (typst.ts on /tools/) has no qpdf, so a PDF a visitor compiles in the browser is still several times larger than the equivalent committed download --- e.g. ~1MB rather than ~285K for a 24-sheet set. Not urgent: the pre-prepared downloads are the common route to a PDF and those are already slim. Investigate whether the same repacking can be done client-side, e.g. a wasm build of qpdf, a JS PDF library that can rewrite objects into object streams, or a typst.ts export option that emits them directly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Establish how much a browser-compiled PDF can shrink, measured on a real cutouts and a real sheets compile
- [ ] #2 Compare the candidate approaches (wasm qpdf, JS PDF rewriter, typst.ts export option) on added bundle weight and compile-time cost
- [ ] #3 Either the browser-compiled PDF lands within ~10% of the size of the equivalent CLI-produced file, or the task records why it isn't worth the bundle weight
- [ ] #4 Accessibility tags survive whatever is chosen, matching the CLI's behaviour
<!-- AC:END -->
