---
id: task-034
title: cut new GitHub release after project rename
status: Done
assignee: []
created_date: '2025-11-19 22:04'
updated_date: '2025-11-19 22:48'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed release v1.4.1 on 2025-11-20. Initial v1.4.0 release failed due to test failures in CI - the get_git_revision() function was checking for .git directory in current working directory, which doesn't exist in CI test environments. Fixed by using `git rev-parse --is-inside-work-tree` to properly detect git repository context.
<!-- SECTION:NOTES:END -->
