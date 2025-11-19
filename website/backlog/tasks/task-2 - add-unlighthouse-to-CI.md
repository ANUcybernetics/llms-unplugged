---
id: task-2
title: add unlighthouse to CI
status: Done
assignee: []
created_date: '2025-11-18 03:45'
updated_date: '2025-11-18 04:08'
labels: []
dependencies: []
---

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Switched from LHCI to unlighthouse for better dev-time feedback.

Setup complete:
- Installed unlighthouse as dev dependency
- Created unlighthouse.config.ts with score budgets (performance: 90, accessibility: 95, best-practices: 90, seo: 90)
- Added npm scripts: `lighthouse` (dev mode) and `lighthouse:ci` (CI mode)
- Removed old LHCI dependencies and configuration

To add to CI pipeline, run: `npm run lighthouse:ci`
<!-- SECTION:NOTES:END -->
