---
id: TASK-105
title: add remark smartypants so that --- gets turned into an em dash
status: Done
assignee: []
created_date: '2026-03-11 04:15'
updated_date: '2026-03-11 04:23'
labels: []
dependencies: []
---

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added dashes: 'oldschool' option to remarkSmartypants in astro.config.mjs. By default the plugin disables dash conversion; oldschool mode converts --- to em dash and -- to en dash.
<!-- SECTION:NOTES:END -->
