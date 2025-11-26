---
id: task-058
title: switch to vitepress
status: To Do
assignee: []
created_date: "2025-11-26 21:45"
labels: []
dependencies: []
---

I'd like to investigate the difficulty (and pros/cons generally) of switching
the website (in website/) to [vitepress](https://vitepress.dev) instead of the
currently 11ty + vite + tailwind setup.

It looks like there are several similarities:

- vite
- nunjuks templating

And I'd like to keep the "test/linkcheck/lint" behaviour from the current
approach (although I'm fine if there's a different way to handle that in
vitepress).

I'd also prefer to use typescript (vs js) wherever possible, and it looks like
vitepress has first-class support for that.

Visually, I'd like the site to look _approximately_ the same, but I don't care
about a pixel-for-pixel port. My priority is doing things "the vitepress way",
and porting things over to work with the framework.

I'd also like to keep the same colour scheme, but do it via a vitepress theme.
