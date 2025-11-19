---
id: task-034
title: cut new GitHub release after project rename
status: To Do
assignee: []
created_date: '2025-11-19 22:04'
labels:
  - cli
  - release
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After recent project changes (renaming, etc.), cut a new GitHub release to verify the release action still works correctly.

Steps:
1. Bump version in cli/Cargo.toml (currently 1.3.0)
2. Commit the version bump
3. Create and push a new git tag
4. Verify the release workflow completes successfully
<!-- SECTION:DESCRIPTION:END -->
