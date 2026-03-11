---
id: TASK-103
title: 'File bug: Svelte :global() CSS breaks esbuild/lightningcss in Astro islands'
status: To Do
assignee: []
created_date: '2026-03-11 00:36'
labels:
  - bug
  - upstream
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Svelte's :global() CSS selectors in component <style> blocks cause build failures when the component is hydrated as an Astro island (client:load / client:visible).

## Symptoms

- esbuild: `Expected "*/" to terminate multi-line comment` at `<stdin>:NNN:0`
- lightningcss: `Unexpected end of input` at `Component.svelte?svelte&type=style&lang.css:NN:0`

Both CSS processors fail, suggesting the CSS is truncated or mangled in transit.

## Root cause analysis

The Svelte compiler correctly transforms `:global(code)` into plain `code` in its CSS output---verified by calling `compile()` directly with both `css: 'external'` and `css: 'injected'`. The output CSS is valid. The bug is in how the CSS travels through the Astro/vite-plugin-svelte/Vite pipeline during island bundling.

## Versions affected

- astro 6.0.2, @astrojs/svelte 8.0.0, @sveltejs/vite-plugin-svelte 6.2.4, svelte 5.53.9, vite 7.3.1

## Minimal reproduction needed

Create a minimal repo with:
1. An Astro page that renders a Svelte component as an island
2. The Svelte component uses `:global(code)` in its `<style>` block (e.g. `.parent :global(code) { background: transparent; }`)
3. Run `astro build`

The build will fail. Removing the `:global()` selector or moving the style to a global CSS file fixes it.

## Where to file

Likely withastro/astro or sveltejs/vite-plugin-svelte---needs triage to determine where the CSS gets mangled.

## Workaround

Move styles that would use `:global()` to a global stylesheet (e.g. widgets.css). This is arguably better practice anyway since these styles target standard HTML elements and don't benefit from Svelte's scoping.
<!-- SECTION:DESCRIPTION:END -->
