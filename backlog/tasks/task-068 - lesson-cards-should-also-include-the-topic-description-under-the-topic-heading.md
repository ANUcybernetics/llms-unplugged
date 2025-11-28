---
id: task-068
title: lesson cards should also include the topic description under the topic heading
status: Done
assignee: []
created_date: '2025-11-28 04:40'
updated_date: '2025-11-28 05:12'
labels: []
dependencies: []
---

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added topic descriptions to lesson cards by:

1. Extended `website/lessons/topics.ts` with `topicDescriptions` mapping, using the same descriptions already present in the topic page frontmatter
2. Updated `website/.vitepress/theme/components/LessonCards.vue` to:
   - Import the new `topicDescriptions`
   - Add `description` field to `TopicGroup` interface
   - Map descriptions when grouping lessons
   - Render a `<p class="topic-description">` under each topic heading
   - Style the description with muted text colour
<!-- SECTION:NOTES:END -->
