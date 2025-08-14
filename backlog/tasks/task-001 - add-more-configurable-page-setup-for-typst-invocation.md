---
id: task-001
title: add more configurable page setup for typst invocation
status: In Progress
assignee: []
created_date: "2025-08-14 01:17"
labels: []
dependencies: []
---

## Description

The current version of @book.typ allows the page size to be set via an --input
on the cli, but it's probably necessary to set the number of columns and base
font size as well (since when one of those changes, the others need to change
too).

In addition, update the @Makefile so that the "a5" outputs have 3 cols (instead
of 4 for a4). Keep the font size the same (i.e. the default of 8pt) for both a5
and a4.

## Progress notes

### 2025-08-14 11:23

Completed the implementation:

1. **Updated book.typ** to accept configurable parameters:
   - Added `font_size` parameter (defaults to "8pt")
   - Added `columns` parameter (defaults to "4")
   - Modified the text and page setup to use these parameters

2. **Updated Makefile** to pass column configuration:
   - a4 PDFs: use 4 columns
   - a5 PDFs: use 3 columns
   - Font size remains at default 8pt for both

3. **Tested** the changes:
   - Successfully built both a4 and a5 PDFs
   - a4 PDF: 369 pages with 4 columns
   - a5 PDF: 791 pages with 3 columns

The implementation is complete and working as specified.
