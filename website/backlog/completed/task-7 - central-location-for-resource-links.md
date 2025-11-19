---
id: task-7
title: central location for resource links
status: Done
assignee: []
created_date: '2025-11-18 20:49'
updated_date: '2025-11-18 21:14'
labels: []
dependencies: []
---

There are a few places in this site which include the links to the pdf resources
(currently hosted on GH). Instead of having to duplicate the actual links, I'd
like to use 11ty's "site data" (or whatever it's called) to set the links, which
are then just included in any md files using the templating system.

Top-level key should be "links", with "github" (for the main GH site), "modules"
and "instructor_notes" keys in the level below.
