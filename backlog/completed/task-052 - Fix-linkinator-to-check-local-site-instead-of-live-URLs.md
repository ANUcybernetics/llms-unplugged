---
id: task-052
title: Fix linkinator to check local site instead of live URLs
status: Done
assignee: []
created_date: "2025-11-26 10:06"
updated_date: "2025-11-26 10:13"
labels:
  - website
  - tooling
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The `check:links` script currently checks external URLs (like
`https://www.llmsunplugged.org/og-image.png`) against the live production site
rather than the local `_site/` build output.

Attempted fix using `--url-rewrite-search` and `--url-rewrite-replace` flags to
rewrite `https://www.llmsunplugged.org` to local paths, but linkinator crashes
with `ERR_INVALID_URL` when the replacement creates paths like `/` or `//`.

The goal is for all internal links (even those with absolute URLs to our domain)
to be validated against the local static build, not the live site. This would
catch issues before deployment.

Options to investigate:

1. Different linkinator configuration or flags
2. Alternative link checker tool (e.g. `lychee`, `broken-link-checker`)
3. Pre-process HTML to replace absolute URLs before checking
4. Use a local server that linkinator can crawl
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

## Implementation

Created `scripts/check-links.js` that uses the linkinator API instead of CLI.
This allows:

1. Setting a fixed port (5555) for the internal server
2. Using proper RegExp-based URL rewrite expressions
3. Rewriting `https://www.llmsunplugged.org` URLs to `http://localhost:5555`

The CLI couldn't support this because:

- The `port` option isn't exposed in CLI flags
- `urlRewriteExpressions` from config files don't work with RegExp (only
  strings)
- URL rewrite to relative paths caused `ERR_INVALID_URL` errors

Updated `package.json` to use the new script:

```json
"check:links": "npm run build && node scripts/check-links.js"
```

<!-- SECTION:NOTES:END -->
