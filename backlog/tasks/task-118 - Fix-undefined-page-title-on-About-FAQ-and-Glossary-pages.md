---
id: TASK-118
title: 'Fix ''undefined'' page title on About, FAQ, and Glossary pages'
status: To Do
assignee: []
created_date: '2026-03-12 03:43'
labels:
  - website
  - bug
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The browser tab title shows 'undefined | LLMs Unplugged' on the About, FAQ, and Glossary pages instead of the page name (e.g. 'About | LLMs Unplugged'). Other pages (homepage, lessons, news) have correct titles. The Page layout template is likely not receiving or rendering the title prop correctly for these standalone pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 About page title shows 'About | LLMs Unplugged'
- [ ] #2 FAQ page title shows 'FAQ | LLMs Unplugged'
- [ ] #3 Glossary page title shows 'Glossary | LLMs Unplugged'
- [ ] #4 Existing page titles (homepage, lessons, news) remain correct
<!-- AC:END -->
