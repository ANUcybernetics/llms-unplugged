---
id: task-044
title: Simplify llms.txt generation and link checking for website
status: To Do
assignee: []
created_date: '2025-11-22 04:05'
labels:
  - website
  - tooling
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the llms.txt pipeline and link checks simpler and less implicit.
- Generate llms.txt from Eleventy collections/site data instead of custom FS walk/copies; rely on passthrough for markdown/feed/static assets instead of bespoke .llms-generated hooks.
- Ensure markdown sources (index/about/contact) still land in the build output alongside feed/CNAME/favicon as before.
- Decouple Linkinator from `npm run dev`; add an explicit script (e.g. npm run check:links) for opt-in use/CI.
- Keep current llms.txt content (titles from frontmatter, correct URLs, list format) and existing tests green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 llms.txt is produced via Eleventy data/collections (no manual pre/post build FS copies) and retains existing content expectations.
- [ ] #2 Markdown sources, feed, CNAME, favicon still appear in build output via passthrough or equivalent; tests continue to pass after npm run build && npm test.
- [ ] #3 Linkinator no longer runs automatically on npm run dev; a dedicated script exists to run link checks when needed.
<!-- AC:END -->
