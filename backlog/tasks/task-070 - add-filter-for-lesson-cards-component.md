---
id: task-070
title: add filter for lesson cards component
status: Done
assignee: []
created_date: '2025-11-28 05:11'
updated_date: '2025-11-28 05:15'
labels: []
dependencies: []
---

I'd like there to be a way (if there isn't already) to use the LessonCards vue
component but limit it to certain topics or certain lessons only.

By default it should still list all lessons.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added optional `topics` and `lessons` props to `LessonCards.vue`:

- `topics?: string[]` — filter to show only specific topics (e.g., `["fundamentals", "scaling-up"]`)
- `lessons?: string[]` — filter to show only specific lessons by slug (e.g., `["weighted-randomness", "basic-training"]`)

Both props are optional; when omitted, all lessons are shown (existing behaviour).

Usage examples:
```vue
<!-- Show only fundamentals topic -->
<LessonCards :topics="['fundamentals']" />

<!-- Show specific lessons -->
<LessonCards :lessons="['weighted-randomness', 'basic-generation']" />

<!-- Combine filters -->
<LessonCards :topics="['fundamentals']" :lessons="['weighted-randomness']" />
```
<!-- SECTION:NOTES:END -->
