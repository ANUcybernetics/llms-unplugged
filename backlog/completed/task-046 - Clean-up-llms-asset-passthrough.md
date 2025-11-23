---
id: task-046
title: Clean up llms asset passthrough
status: Done
assignee: []
created_date: '2025-11-22 05:51'
updated_date: '2025-11-22 06:41'
labels:
  - website
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove remaining duplication between Eleventy passthrough and Vite static copy. Prefer Eleventy passthrough for markdown/feed/CNAME/favicon and drop extra Vite copy/HTML transform/assetFileNames overrides if not needed. Re-evaluate whether emptyOutDir can revert to default without wiping Eleventy output. Keep llms.txt/markdown outputs intact and tests green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Use Eleventy passthrough for markdown/feed/CNAME/favicon instead of viteStaticCopy targets.
- [x] #2 Remove favicon hashing workarounds (transform + assetFileNames override) unless still required after passthrough changes.
- [x] #3 Confirm build/test still pass with simplified configuration (including emptyOutDir setting).
<!-- AC:END -->
