---
id: task-040
title: Remove scale_d parameter and hardcode to d10
status: Done
assignee: []
created_date: '2025-11-20 22:50'
updated_date: '2025-11-20 23:00'
labels:
  - refactoring
  - cli
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove all references to scale_d throughout the codebase and hardcode to d10 (value 10). Since d10 is the best approach for scaling (easy to add more dice for larger ranges), we no longer need the complexity of supporting arbitrary dice sizes.

## Files to modify:

### cli/src/main.rs
- Remove `scale_d` field from Args struct
- Remove `--scale-d` CLI flag
- Remove the "Applied count scaling with d=" print statement
- Always pass `None` to `save_to_json` (which will use default 10^k-1 scaling)

### cli/src/lib.rs
- Remove `scale_d: Option<u32>` parameter from `save_to_json` function
- Simplify scaling logic to always use 10^k-1 scaling (remove the match statement)
- Remove `scale_d: Option<u32>` field from `Metadata` struct
- Remove line that sets `meta_with_scale.scale_d`
- Update all test cases that use `scale_d` parameter:
  - Remove tests specifically for scale_d = 120, 60, 1, 2, 3
  - Keep tests that verify default 10^k-1 scaling behavior
  - Simplify test assertions to expect d10 behavior only

### cli/book.typ
- Remove `dice_d` variable (line 52)
- Remove `dice_d` parameter from `format-dice-indicator` function
- Remove `dice_d: 10` parameter from `format-entry` function
- Hardcode `10` in `format-dice-indicator` comparison: `if total_count != 10`
- Remove all `dice_d: 10` arguments from function calls in examples

### cli/AGENTS.md
- Remove references to `--scale-d` flag in CLI options section
- Remove "Scale counts for a D-sided die" documentation
- Update configuration section to remove scale-d references
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No references to scale_d or dice_d remain in any .rs, .typ, or .md files
- [x] #2 All tests pass with pristine output
- [x] #3 cargo build --release succeeds
- [x] #4 Generated PDFs still work correctly with d10 diamond indicators
- [x] #5 CLI no longer accepts --scale-d flag
- [x] #6 Documentation reflects d10-only approach
<!-- AC:END -->
