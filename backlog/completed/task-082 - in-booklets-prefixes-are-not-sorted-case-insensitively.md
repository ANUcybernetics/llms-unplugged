---
id: task-082
title: 'in booklets, prefixes are not sorted case-insensitively'
status: Done
assignee: []
created_date: '2025-12-10 03:37'
updated_date: '2025-12-10 03:50'
labels: []
dependencies: []
---

In the booklets (i.e. as typeset with @cli/book.typ) the entries should be
sorted, but case-insensitively. Currently the sorting is case-sensitive.

Fix this, and implement a test to check.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed case-insensitive prefix sorting in `cli/src/lib.rs`:

1. Modified `convert_to_entries()` to sort entries by prefix case-insensitively after collecting them from the BTreeMap
2. Added `test_prefix_case_insensitive_sort_order` test that verifies mixed-case prefixes (e.g., "Apple", "Zebra", "apple", "banana") are sorted alphabetically ignoring case

The fix converts each prefix to lowercase for comparison purposes while preserving the original case in the output.
<!-- SECTION:NOTES:END -->
