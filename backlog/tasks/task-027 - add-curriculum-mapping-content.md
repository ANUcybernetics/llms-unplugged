---
id: task-027
title: add curriculum mapping content
status: Done
assignee: []
created_date: '2025-11-19 21:21'
updated_date: '2026-08-28 10:41'
labels:
  - website
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Publish the Australian Curriculum mapping on the website so it lives in one place.

The source of truth is `docs/curriculum-mapping.md` (draft, May 2026): all 14 lessons mapped to AC v9.0 codes from ACARA's machine-readable workbook, with coverage summaries by strand and three suggested programs. Publish from that file rather than restating it, so there is no second copy to keep in sync.

The March 2026 news post 'Mapping LLMs Unplugged to the Australian Curriculum' is a dated, point-in-time example and stays exactly as written --- a few of its Year 5/6 codes differ from the later draft, and that is fine for a dated post.

Still open: getting the draft reviewed (something ACARA can help with).
Reference: https://www.digital-technologies.institute/curriculumsearch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The curriculum mapping is reachable as a page on the website, linked from the educators/teachers area
- [x] #2 The published page renders from docs/curriculum-mapping.md rather than a hand-copied duplicate
- [x] #3 The page states the mapping's review status, or the draft has been externally reviewed before publishing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Published at /educators/curriculum/, rendered from docs/curriculum-mapping.md via a docs content collection; the page states the draft/unreviewed status.
<!-- SECTION:NOTES:END -->

Something that ACARA can help with.

Also, this: https://www.digital-technologies.institute/curriculumsearch
