---
id: task-039
title: Fix vite-plugin-static-copy build failure
status: Done
assignee: []
created_date: '2025-11-20 04:45'
updated_date: '2025-11-20 04:51'
labels:
  - website
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The website build fails with a vite-plugin-static-copy error during the Vite build phase. The error occurs in the writeBundle hook and causes an ENOTEMPTY error when trying to rename directories.

The static copy plugin is configured to copy from `src/assets/pdfs/*` but this directory doesn't exist. Creating an empty directory doesn't resolve the issue.

Error output:
```
[11ty/eleventy-plugin-vite] Vite error:
{
  "code": "PLUGIN_ERROR",
  "plugin": "vite-plugin-static-copy:build",
  "hook": "writeBundle"
}
```

This is a pre-existing issue not caused by the TOC changes.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed vite-plugin-static-copy plugin entirely - it was redundant since Eleventy's addPassthroughCopy already handles src/assets/

Removed the unused dependency from package.json

Removed the empty src/assets/pdfs directory (CI will create it when downloading artifacts)

Build and tests pass successfully
<!-- SECTION:NOTES:END -->
