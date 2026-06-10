---
id: TASK-128
title: Move file-driven lib.rs tests into tests/ and dedupe coverage
status: To Do
assignee: []
created_date: '2026-06-10 00:00'
labels:
  - cli
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From the June 2026 audit: cli/src/lib.rs is ~60% embedded test code, mostly integration-style (temp files + process_file) duplicating ground covered by tests/tokenization_test.rs (e.g. capitalisation is tested in three places). Moving the file-driven tests into tests/ would roughly halve lib.rs and match the integration-test preference.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lib.rs unit tests cover only pure in-memory logic
- [ ] #2 no duplicated test scenarios between lib.rs and tests/
<!-- AC:END -->
