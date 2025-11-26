---
id: task-052
title: Fix linkinator to check local site instead of live URLs
status: To Do
assignee: []
created_date: '2025-11-26 10:06'
labels:
  - website
  - tooling
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `check:links` script currently checks external URLs (like `https://www.llmsunplugged.org/og-image.png`) against the live production site rather than the local `_site/` build output.

Attempted fix using `--url-rewrite-search` and `--url-rewrite-replace` flags to rewrite `https://www.llmsunplugged.org` to local paths, but linkinator crashes with `ERR_INVALID_URL` when the replacement creates paths like `/` or `//`.

The goal is for all internal links (even those with absolute URLs to our domain) to be validated against the local static build, not the live site. This would catch issues before deployment.

Options to investigate:
1. Different linkinator configuration or flags
2. Alternative link checker tool (e.g. `lychee`, `broken-link-checker`)
3. Pre-process HTML to replace absolute URLs before checking
4. Use a local server that linkinator can crawl
<!-- SECTION:DESCRIPTION:END -->
