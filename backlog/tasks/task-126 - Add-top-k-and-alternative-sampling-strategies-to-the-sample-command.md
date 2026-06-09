---
id: TASK-126
title: Add top-k and alternative sampling strategies to the sample command
status: To Do
assignee: []
created_date: '2026-06-09 23:34'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrated from the old root TODO.md. The sample subcommand currently does plain weighted sampling from the full distribution; add a top-k parameter and consider other sampling strategies (see https://rentry.co/samplers for a survey).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 sample supports a top-k flag that restricts sampling to the k most likely next tokens
- [ ] #2 documented in cli/CLAUDE.md and README
<!-- AC:END -->
