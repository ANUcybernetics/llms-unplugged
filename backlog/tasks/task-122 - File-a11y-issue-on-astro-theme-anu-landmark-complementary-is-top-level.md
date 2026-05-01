---
id: TASK-122
title: File a11y issue on astro-theme-anu (landmark-complementary-is-top-level)
status: To Do
assignee: []
created_date: '2026-05-01 00:01'
labels:
  - theme
  - a11y
  - upstream
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The theme's SidebarLayout places <aside class="at-sidebar"> inside <main id="main">, which trips the axe rule landmark-complementary-is-top-level. This blocks llms-unplugged from leaving checkA11y enabled in astro.config.mjs — currently disabled with a documented comment. Filing the issue lets the theme team restructure SidebarLayout to render the sidebar as a sibling of <main>, after which we can re-enable checkA11y here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Issue filed against gitlab.anu.edu.au:u2548636/astro-theme-anu (or the project's preferred tracker)
- [ ] #2 Issue links to A11Y-ISSUE.md draft in the theme worktree
- [ ] #3 Once theme fix lands, re-enable checkA11y in website/astro.config.mjs and remove the suppression comment
<!-- AC:END -->
