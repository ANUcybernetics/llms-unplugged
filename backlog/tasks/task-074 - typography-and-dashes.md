---
id: task-074
title: typography and dashes
status: Done
assignee: []
created_date: '2025-11-28 06:01'
updated_date: '2025-11-28 06:15'
labels: []
dependencies: []
---

I want the `--` and `---` in my md files to turn into en and em dashes
respectively. Is there a markdown-it (or similar) plugin which does this and
plays nicely with vitepress?

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Enabled the built-in markdown-it `typographer` option in VitePress config. No additional plugins needed.

Added `typographer: true` to the `markdown` config in `.vitepress/config.mts`.

This converts:
- `--` → en dash (–)
- `---` → em dash (—)
<!-- SECTION:NOTES:END -->
