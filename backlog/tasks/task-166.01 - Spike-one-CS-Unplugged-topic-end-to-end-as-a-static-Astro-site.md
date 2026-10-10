---
id: TASK-166.01
title: 'Spike: the CS Unplugged Binary numbers topic end to end as a static Astro site'
status: To Do
assignee: []
created_date: '2026-10-10 22:51'
updated_date: '2026-10-10 22:57'
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

The topic is Binary numbers, the one that exercises the most of the stack:

- it is the only topic that uses all four verto tags (panel, image, iframe, video)
- it has 23 of the 32 programming challenges with automated test cases, including both function-call cases (63 stdin/stdout cases besides); only Kidbots has the rest
- it has junior and senior lessons (12), the most curriculum integrations (7), CT links and learning outcomes
- its lessons use generated printables (binary-cards, binary-cards-small, binary-windows, binary-to-alphabet)
- at 251 English Markdown files it is about a third of the whole content port, so the verto conversion gets a real workout
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A new repo in the ANU Cybernetics GitHub organisation holds an Astro site on astro-theme-university with a CS Unplugged brand layer
- [ ] #2 The Binary numbers topic's lessons, curriculum integrations and programming challenges render from content collections, with their verto tags converted to MDX components
- [ ] #3 The binary-cards printable's PDF combinations are served from the bucket, not the deploy artifact or git
- [ ] #4 Every Binary numbers programming challenge with test cases, stdin/stdout and function-call, runs and is checked in the browser with Pyodide in a Web Worker, and an infinite loop reports time limit exceeded
- [ ] #5 Pagefind search covers the ported pages with content-type filtering
- [ ] #6 The old URLs of the ported pages resolve via server-side redirects
- [ ] #7 Checks and the build run in CI on every change and the site deploys automatically to Cloudflare
- [ ] #8 Findings are written up for Tim and the maintainers, including Pyodide first-load time and memory on an old school device, and a recommendation on the full port
<!-- AC:END -->
