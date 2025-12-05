---
id: task-068
title: Add prose tabs component for year-level differentiated content
status: To Do
assignee: []
created_date: '2025-12-05 00:14'
labels:
  - website
  - component
  - enhancement
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lessons need "parallel info" for different year level groups (e.g. Years 3-6, Years 7-10, Years 11-12). VitePress code groups only work for code blocks, so we need a solution for prose/markdown content.

## Context

- Current lessons like `basic-training.md` have a single explanation for all audiences
- Want to provide differentiated content without duplicating entire lessons
- Should feel native to VitePress and match existing component patterns (LmGrid, Prerequisites, etc.)

## Options

### Option 1: Custom Vue component (recommended)

Create a `<ContentTabs>` component similar to existing custom components. Usage:

```md
<ContentTabs :labels="['Years 3-6', 'Years 7-10', 'Years 11-12']">
<template #tab-0>

Content for younger students with simpler vocabulary...

</template>
<template #tab-1>

More detailed explanation for middle years...

</template>
<template #tab-2>

Advanced content with technical terminology...

</template>
</ContentTabs>
```

Pros:
- Full control over styling and behaviour
- Matches existing component patterns
- No external dependencies

Cons:
- Named slots with markdown can be fiddly
- Need to handle markdown rendering within slots

### Option 2: Third-party plugin

Use `vitepress-plugin-tabs` or similar community plugin.

Pros:
- Already built and tested
- May have nicer authoring syntax

Cons:
- External dependency
- Less control over styling
- May not be maintained long-term

### Option 3: Container-based syntax with markdown-it plugin

Create a custom markdown-it plugin for container syntax:

```md
::: content-tabs
== Years 3-6
Simpler content here...

== Years 7-10
More detailed content...
:::
```

Pros:
- Most markdown-native authoring experience
- No Vue template syntax in markdown

Cons:
- More complex to implement
- Requires understanding markdown-it internals

## Recommendation

Start with Option 1 (custom Vue component). It's the most straightforward and consistent with existing patterns. If the slot syntax proves too awkward for authors, consider Option 3 as a follow-up.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Lesson authors can write differentiated content for multiple year levels
- [ ] #2 Tabs are visually consistent with VitePress theme
- [ ] #3 Content within tabs supports full markdown rendering
- [ ] #4 Component is reusable for non-year-level use cases
<!-- AC:END -->
