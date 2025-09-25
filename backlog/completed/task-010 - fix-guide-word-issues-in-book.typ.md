---
id: task-010
title: fix guide word issues in book.typ
status: Done
assignee: []
created_date: '2025-09-23 10:40'
labels: []
dependencies: [task-008]
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two issues with the current guide word implementation need to be fixed following the performance optimisation in task-008.
<!-- SECTION:DESCRIPTION:END -->

## Issues

### 1. Off-by-one error in guide word display
The guide word shown in the header is often the **last** entry from the previous page, rather than the **first** entry on the current page. This is incorrect behaviour for guide words.

**Example**: If page 9 ends with "amazement" and page 10 starts with "and", the guide word on page 10 should show "and" (or "and — [last entry on page 10]"), not "amazement".

### 2. Missing range display for guide words
The current implementation only shows the first prefix on a page, not the range "first — last" when there are multiple prefixes on the page. The original working implementation had this feature, but it was lost during optimisation.

**Expected behaviour**:
- Single prefix on page: display just that prefix
- Multiple prefixes on page: display "first — last"
- Continuation page (no new prefixes): display the last prefix from the previous page

## Root cause analysis

The current implementation scans backwards through `all-entries.rev()` and collects entries for the current page. However, the `query(selector(metadata).before(here(), inclusive: false))` returns entries that appear **before** the header position, which might not include all entries that will appear on the current page (since the header is rendered at the top of the page).

## Implementation plan

### Option 1: Use inclusive query with careful filtering
1. Change query to `query(selector(metadata).before(here(), inclusive: true))` to potentially capture entries on the current page
2. Filter more carefully to separate:
   - Entries definitely on previous pages
   - Entries potentially on current page
3. Handle edge cases where entries appear between header and first line of content

### Option 2: Two-query approach
1. First query: Get all entries before the current page (for fallback)
2. Second query: Use a page-specific selector to get entries on current page
3. Combine results to determine correct guide words

### Option 3: Revert to original with targeted optimisation
1. Go back to the original `query(metadata)` approach that worked correctly
2. Add caching or memoisation to avoid repeated filtering
3. Consider limiting the query scope using page number bounds

### Recommended approach
Start with Option 3 as it's most likely to preserve correct behaviour, then explore Option 1 if performance is still an issue. The key insight is that correctness must take precedence over performance optimisation.

## Solution implemented

Fixed both guide word issues by reverting to a simpler approach that queries all metadata entries and filters by page number:

1. **Fixed off-by-one error**: The guide words now correctly show the first entry on the current page instead of the last entry from the previous page
2. **Implemented range display**: When multiple prefixes appear on a page, the header now displays "first — last" format

The implementation uses `query(metadata)` to get all entries, then filters them by page number to correctly identify:
- Entries on the current page
- The last prefix from previous pages (for continuation pages)

This approach prioritises correctness over the minor performance optimization that caused the original issues.
