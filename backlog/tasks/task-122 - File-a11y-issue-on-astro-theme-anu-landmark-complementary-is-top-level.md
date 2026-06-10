---
id: TASK-122
title: File a11y issue on astro-theme-anu (landmark-complementary-is-top-level)
status: Done
assignee:
  - '@claude'
created_date: '2026-05-01 00:01'
updated_date: '2026-06-10 04:38'
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
- [x] #1 Issue filed against gitlab.anu.edu.au:u2548636/astro-theme-anu (or the project's preferred tracker)
- [x] #2 Issue links to A11Y-ISSUE.md draft in the theme worktree
- [x] #3 Once theme fix lands, re-enable checkA11y in website/astro.config.mjs and remove the suppression comment
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
All done. Issue filed as https://gitlab.anu.edu.au/u2548636/astro-theme-anu/-/issues/1; fixed upstream in astro-theme-anu@v0.4.4 (Sidebar wrapper is a div, not aside — the labelled nav inside is the landmark, so no restructure of SidebarLayout was needed). checkA11y re-enabled in website/astro.config.ts after bumping the pin; the rebuild surfaced two leftover consumer-side violations (duplicate nested <main> on the homepage, h2->h4 heading skip in the sampling lesson), both fixed. Build now reports: Checked 46 pages — no accessibility violations.
<!-- SECTION:NOTES:END -->
