---
id: task-038
title: add 'news' post feed (with RSS) using the standard 11ty setup
status: Done
assignee: []
created_date: '2025-11-20 00:12'
updated_date: '2025-11-20 00:24'
labels: []
dependencies: []
---

Use the standard 11ty conventions, but I'd like the urls to start with news/
rather than e.g. blog/

I also want:

- a paginated feed
- per-news-item tags (events, resources, articles)
- a list of the 3 most recent items (with events tag) on the main index page

Make sure it all works with the vite setup in a natural way.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented news feed with:
- News collection in src/news/ with posts using news/ URL prefix
- Post layout (post.njk) with date, tags, and back link
- Paginated news index at /news/ (10 items per page)
- RSS feed at /feed.xml (Atom format)
- Recent events section on homepage (3 most recent with 'events' tag)
- Navigation updated with News link
- Sample posts created for testing

Technical notes:
- RSS plugin: @11ty/eleventy-plugin-rss
- Tags: events, resources, articles
- feed.xml copied via build script due to Vite publicDir timing issue
- All tests pass
<!-- SECTION:NOTES:END -->
