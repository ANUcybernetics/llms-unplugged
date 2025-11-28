---
id: task-069
title: refactor RSS generation to use buildEnd hook
status: To Do
assignee: []
created_date: '2025-11-28 04:55'
updated_date: '2025-11-28 05:06'
labels:
  - website
  - refactor
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current RSS setup uses `vitepress-plugin-rss` as a Vite plugin, which generates the feed after VitePress's dead link check runs. This requires adding `/feed.rss` to `ignoreDeadLinks` as a workaround.

The plugin documentation doesn't address this timing issue at all.

A more idiomatic approach is to generate the RSS feed in VitePress's `buildEnd` hook using the `feed` npm package directly. This ensures the file exists before dead link checking and removes the need for the ignore workaround.

References:
- https://laros.io/generating-an-rss-feed-with-vitepress
- https://ericgardner.info/notes/blogging-with-vitepress-january-2024
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Decision: Not proceeding

Investigated using VitePress's `buildEnd` hook with the `feed` package. The problem is that `buildEnd` only runs during production builds, so the RSS feed wouldn't exist in dev mode.

The current `vitepress-plugin-rss` approach works in both dev and build. The `ignoreDeadLinks` workaround is annoying but harmless, and preferable to breaking dev mode.

Leaving this task open in case a better solution emerges (e.g., a VitePress hook that runs earlier, or the plugin fixing the timing issue).
<!-- SECTION:NOTES:END -->
