---
id: TASK-119
title: Fix FAQ nav item incorrectly highlighted on lesson pages
status: Done
assignee: []
created_date: '2026-03-12 03:43'
updated_date: '2026-03-13 02:00'
labels:
  - website
  - bug
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On lesson pages (e.g. /lessons/sampling, /lessons/generation), the 'FAQ' nav item in the top navigation bar has a visible border/box around it as if it were the active page. 'Lessons' is correctly highlighted with gold text, but FAQ also appears styled as active. This does not occur on the homepage or other non-lesson pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 FAQ nav item has no active/highlighted styling when viewing lesson pages
- [x] #2 Lessons nav item remains correctly highlighted on lesson pages
- [x] #3 FAQ nav item is only highlighted when on the /faq page
<!-- AC:END -->
