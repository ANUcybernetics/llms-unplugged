---
id: TASK-101
title: Add i18n to astro-theme-university and translate the website
status: To Do
assignee: []
created_date: '2026-02-06 04:11'
updated_date: '2026-09-22 22:39'
labels:
  - website
  - i18n
  - on-ice
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add optional i18n to the astro-theme-university base package the documented Astro way, then turn it on for this site and translate it, starting with French.

Theme (upstream): read the site's own `i18n` config (no theme-level locale option); ship a recipe-style `ui` string table with `useTranslations` falling back to English per key, overridable per site; set `lang`/`dir` from `Astro.currentLocale`; emit hreflang alternates and a LanguagePicker from the `astro:i18n` helpers. Importing `astro:i18n` throws when a site has no `i18n` config, so shared components must reach it through a theme virtual module with English-only stand-ins. Sites without `i18n` config must render exactly as now. The CS Unplugged port depends on this theme work.

Site: locale folders in content collections, Astro `fallback` for untranslated pages, and the Svelte tools' strings through the same table.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Astro i18n routing configured with default locale (en-AU) and at least one additional locale
- [ ] #2 Translated content directory structure created with translated markdown for pages and lessons
- [ ] #3 UI strings in Astro and Svelte components internationalised (no hardcoded English)
- [ ] #4 Language switcher allows users to switch between available locales
- [ ] #5 Site builds and renders correctly in all configured locales
- [ ] #6 astro-theme-university release supports optional i18n: English-only sites build unchanged, and a two-locale example site gets correct lang, per-key English fallback, hreflang alternates, a language picker and a per-locale Pagefind index
- [ ] #7 astro-theme-anu's own interface strings go through the theme's string table
<!-- AC:END -->
