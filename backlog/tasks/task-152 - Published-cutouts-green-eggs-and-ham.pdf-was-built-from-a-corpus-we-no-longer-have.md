---
id: TASK-152
title: >-
  Published cutouts/green-eggs-and-ham.pdf was built from a corpus we no longer
  have
status: To Do
assignee: []
created_date: '2026-09-03 12:48'
updated_date: '2026-09-03 12:48'
labels:
  - cli
  - pdfs
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A rebuild of the published cutout PDFs from HEAD (make cutouts, SOURCE_DATE_EPOCH pinned) reproduces where-is-the-green-sheep and were-going-on-a-bear-hunt byte for byte, but not green-eggs-and-ham: the file the bucket serves has 993 tokens and 1.8 bits/token, a local rebuild has 983 and 1.77. data/*.txt is gitignored, so the working copy has drifted from whatever text built the published set --- and nothing records which was right. Until that is settled, any 'refresh the published PDFs' pass silently republishes this one with a different corpus. Settle which text is canonical (the book, presumably), rebuild, and upload if it moves; the same question applies to booklets/green-eggs-and-ham.pdf and sheets/green-eggs-and-ham.pdf, which are built from the same file (the sheets set does still reproduce, so the drift may postdate its upload).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 the canonical green-eggs-and-ham.txt is identified and data/ holds it
- [ ] #2 cutouts/green-eggs-and-ham.pdf in the bucket is reproducible from a make cutouts rebuild, or has been re-uploaded so that it is
- [ ] #3 the booklet and sheets sets built from the same corpus are checked the same way
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause overlaps TASK-142 (store the corpora in a private repo with a reproducible cleaning recipe): with the texts versioned somewhere, 'which green-eggs-and-ham built this PDF' would be answerable rather than guessable. Found while checking whether TASK-151 needed a prod PDF refresh --- it did not; the drift predates it.
<!-- SECTION:NOTES:END -->
