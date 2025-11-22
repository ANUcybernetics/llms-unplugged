---
id: task-043
title: 'Simplify CLI tokenization, frontmatter parsing, and book splitting'
status: To Do
assignee: []
created_date: '2025-11-22 04:05'
labels:
  - cli
  - refactoring
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unify the CLI text-processing path and make splitting predictable.
- Replace the current three-layer tokenizer/preprocessor/canonical map with one deterministic normalization step (regex-ish tokenizer, consistent casing with a tiny allowlist, centralized punctuation handling) plus focused tests.
- Stream frontmatter + content in a single pass (no 100-line limit, no second open), with clear errors when YAML is missing/invalid.
- Swap the follower/letter heuristics for a documented book-splitting rule (e.g. by prefix count or follower totals); keep splitting in Rust, not Typst.
- Refactor main.rs orchestration into small functions and add unit/integration coverage for the control flow.
- Preserve current flags and outputs for existing fixtures; add a regression test to prove compatibility.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New tokenizer/normalizer is single-surface, deterministic, and covered by tests (no mutable canonical map heuristics).
- [ ] #2 Frontmatter is parsed in one streaming pass without 100-line truncation or reopening; missing/invalid YAML errors remain descriptive.
- [ ] #3 Book splitting uses a simple documented rule (prefix/follower-based), keeps entries intact, and is tested for balance/no duplicates.
- [ ] #4 CLI behavior and outputs remain compatible for existing fixtures (regression test added); cargo test passes.
<!-- AC:END -->
