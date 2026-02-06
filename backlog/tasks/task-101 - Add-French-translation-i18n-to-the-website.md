---
id: TASK-101
title: Add French translation (i18n) to the website
status: To Do
assignee: []
created_date: '2026-02-06 04:11'
updated_date: '2026-02-06 04:12'
labels:
  - website
  - i18n
  - on-ice
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add French language support to the VitePress website using its built-in directory-based i18n system. The site currently has no i18n setup. VitePress locales config maps locale-specific nav/sidebar/theme strings and auto-adds a language switcher. Content translation (~42 markdown files) is the bulk of the work; ~20 Vue components also have hardcoded English UI strings that need internationalising.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 locales config added to .vitepress/config.mts with root (en-AU) and fr locales, including French nav and sidebar labels
- [ ] #2 parallel fr/ content directory created with translated markdown for ~11 top-level pages and ~31 lesson files
- [ ] #3 UI strings in custom Vue components internationalised (via vue-i18n or lightweight useData().lang lookup)
- [ ] #4 hardcoded locale references (date formatting, RSS config) are locale-aware
- [ ] #5 language switcher appears in navbar and correctly switches between English and French
- [ ] #6 site builds and renders correctly in both locales
<!-- AC:END -->
