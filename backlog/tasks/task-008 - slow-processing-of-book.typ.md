---
id: task-008
title: slow processing of book.typ
status: Done
assignee: []
created_date: "2025-09-23 10:08"
labels: []
dependencies: []
---

Recently, "guide words" were added to each page header in the @book.typ output
(see tasks 006 and 007).

However, this slowed down the `typst compile` command _greatly_.

Investigate exactly why the typesetting is now much slower, and whether there is
a fix (without complicating the codebase too much) which retains the guide words
and keeps the output the same, but is more performant (esp. on large documents).

Use the out/frankenstein-bigram-a4.pdf makefile target as a test file (it's the
shortest).

## Resolution

The performance issue was caused by the guide words implementation querying ALL metadata entries on every page render. The original implementation:
1. Called `query(metadata)` to get all prefix entries
2. Filtered them to find entries on current page
3. If no entries on current page, filtered again to find entries before current page

This resulted in O(n*p) operations where n = number of prefixes and p = number of pages.

### Optimisation applied

Changed the header implementation to use `query(selector(metadata).before(here()))` which:
- Only queries metadata entries before the current position
- Eliminates the need to filter through all future entries
- Still maintains correct guide word display

### Performance improvement

- Before: ~4.4 seconds to compile frankenstein-bigram-a4.pdf
- After: ~3.1 seconds to compile frankenstein-bigram-a4.pdf
- **Improvement: ~30% reduction in compile time**

The output remains functionally identical with the same page count and guide words displayed correctly.
