---
id: task-069
title: refactor RSS generation to use buildEnd hook
status: To Do
assignee: []
created_date: '2025-11-28 04:55'
labels:
  - website
  - refactor
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current RSS setup uses `vitepress-plugin-rss` as a Vite plugin, which generates the feed after VitePress's dead link check runs. This requires adding `/feed.rss` to `ignoreDeadLinks` as a workaround.

A more idiomatic approach is to generate the RSS feed in VitePress's `buildEnd` hook using the `feed` npm package directly. This ensures the file exists before dead link checking and removes the need for the ignore workaround.

References:
- https://laros.io/generating-an-rss-feed-with-vitepress
- https://ericgardner.info/notes/blogging-with-vitepress-january-2024
<!-- SECTION:DESCRIPTION:END -->
