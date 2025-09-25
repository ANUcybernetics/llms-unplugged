---
id: task-013
title: Fix test_cli_raw_flag assertion failure
status: Done
assignee: []
created_date: "2025-09-24 22:49"
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The test_cli_raw_flag integration test is failing with assertion: left: None,
right: Some(2).

Problem: The test expects raw output to contain actual counts (Some(2)) but is
getting None instead. This suggests the --raw flag behavior may have changed or
the test expectations are incorrect.

Context: The CLI argument parsing changed scale_d from Option<u32> to u32 with
default value 10, which affects how raw mode works.

Expected behavior:

- When --raw flag is used, output should contain actual, unscaled counts
- The "the" prefix should appear exactly 2 times in test data ("The cat sat. The
  cat ran. The dog sat.")
- Raw output should have actual count as Some(2), not None

Steps to fix:

1. Run the failing test to see exact error output
2. Check how --raw flag is processed in main.rs and lib.rs
3. Verify the save_to_json function properly handles raw mode
4. Update test expectations or fix raw mode implementation
5. Ensure raw counts are properly stored/retrieved when raw flag is used
<!-- SECTION:DESCRIPTION:END -->
