---
id: TASK-166.01
title: 'Spike: one CS Unplugged topic end to end as a static Astro site'
status: To Do
assignee: []
created_date: '2026-10-10 22:51'
labels:
  - cs-unplugged
  - fellowship
  - website
dependencies: []
parent_task_id: TASK-166
type: spike
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Thin vertical slice of the TASK-166 port, to show Tim Bell and the maintainers how it goes before committing to the full port. Decisions and background are in TASK-166. English only, with locale-ready URLs and content layout (no dependency on TASK-101).

Pick a topic that has a programming challenge with automated test cases and at least one printable resource, so the slice exercises every part of the stack.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A new repo in the ANU Cybernetics GitHub organisation holds an Astro site on astro-theme-university with a CS Unplugged brand layer
- [ ] #2 One topic's unit plans and lessons render from content collections, with their verto tags converted to MDX components
- [ ] #3 One printable resource's PDF combinations are served from the bucket, not the deploy artifact or git
- [ ] #4 One programming challenge with test cases runs and is checked in the browser with Pyodide in a Web Worker, and an infinite loop reports time limit exceeded
- [ ] #5 Pagefind search covers the ported pages with content-type filtering
- [ ] #6 The old URLs of the ported pages resolve via server-side redirects
- [ ] #7 Checks and the build run in CI on every change and the site deploys automatically to Cloudflare
- [ ] #8 Findings are written up for Tim and the maintainers, including Pyodide first-load time and memory on an old school device, and a recommendation on the full port
<!-- AC:END -->
