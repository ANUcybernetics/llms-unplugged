---
id: TASK-106
title: Bump GitHub Actions to latest major versions
status: Done
assignee: []
created_date: '2026-03-11 04:18'
updated_date: '2026-03-13 02:16'
labels: []
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update action versions in all workflows to silence Node.js 20 deprecation warnings. checkout v4→v6, setup-node v4→v6, upload-artifact v4→v7, upload-pages-artifact v3→v4. Affects deploy-website.yml, cli.yml, and release.yml.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 actions/checkout bumped to v6 in all workflows
- [x] #2 actions/setup-node bumped to v6
- [x] #3 actions/upload-artifact bumped to v7 in cli.yml and release.yml
- [x] #4 actions/upload-pages-artifact bumped to v4 in deploy-website.yml
- [ ] #5 CI runs pass without Node.js 20 deprecation warnings
<!-- AC:END -->
