---
id: task-007
title: Fix guide words not appearing on all pages in n-gram booklets
status: Done
assignee: []
created_date: '2025-09-22 23:47'
updated_date: '2025-09-22 23:57'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Guide words are not appearing on some pages (e.g. page 5 of frankenstein-bigram-a4.pdf) even though the implementation has been added to book.typ. The guide words feature was partially implemented but needs debugging to work reliably on all pages.
<!-- SECTION:DESCRIPTION:END -->

## Problem

After implementing guide words in `book.typ`, they are not appearing consistently:
- Page 5 of `frankenstein-bigram-a4.pdf` shows no header at all (confirmed in Preview app)
- This page contains "A" entries but no guide words appear
- Some other pages may also be affected

## Steps to reproduce

1. Build the frankenstein bigram model:
   ```bash
   make out/frankenstein-bigram-a4.pdf
   ```

2. Open the PDF in Preview:
   ```bash
   open -a Preview out/frankenstein-bigram-a4.pdf
   ```

3. Navigate to page 5 - observe that there is no guide word header

4. For verification with pdftotext:
   ```bash
   # Extract page 5
   pdftotext -f 5 -l 5 out/frankenstein-bigram-a4.pdf - | head -3
   # Should show guide words in header but currently doesn't
   ```

## Current implementation

The current approach in `book.typ` uses Typst's metadata system:

1. Each prefix entry creates metadata: `[#metadata(prefix) <prefix-entry>]`
2. The page header queries metadata entries on the current page
3. Shows first and last prefix, or single prefix if all are the same

## Suspected issues

1. The metadata query in the header might not be finding entries correctly in multi-column layouts
2. There may be a timing issue with when metadata is created vs when headers are evaluated
3. The `context` block evaluation order might be problematic

## Solution

The issue was that page 5 (and potentially other pages) contained only the continuation of follower words from a prefix that started on a previous page. Since there were no new prefix entries on these pages, the metadata query returned empty results.

Fixed by modifying the header logic to:
1. First check if there are new prefix entries on the current page
2. If yes, display the first and last (or single) prefix as guide words
3. If no new prefixes, display the last prefix from before this page

This ensures guide words appear on all pages, including those that only contain follower words from a prefix that started on a previous page.

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Guide words appear on ALL pages after frontmatter (pages 3+)
- [x] #2 Guide words correctly show first and last prefix when multiple prefixes on page
- [x] #3 Guide words show single prefix when all entries are the same prefix
- [x] #4 Solution works for all paper sizes and column configurations
- [x] #5 Headers are extractable with `pdftotext` for testing purposes
<!-- AC:END -->
