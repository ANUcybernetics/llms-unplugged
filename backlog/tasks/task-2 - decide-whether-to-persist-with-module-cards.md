---
id: task-2
title: decide whether to persist with module cards
status: To Do
assignee: []
created_date: "2025-11-21 11:33"
labels: []
dependencies: []
---

Currently, the main module content is in the XX-module-name.typ files in
handouts/

Going forward, I want that teaching content to be a new collection of md files
for the 11ty website (each one can still have a download link to the
typst-produced pdf, but the web version would be the canonical one). The content
won't change, but given some of the tricks in those typst files to get them to
layout nicely on 2 pages I don't think it's feasible to have the same content
automatically work for both.

So, here's the plan:

- together, those modules (the main LLMs Unplugged content) become a
  "collection" in the website (or whatever 11ty calls that sort of thing)
- each one has it's own subfolder, which might include printables, other
  resources for that module, etc
- each one's index page (subfolder/index.md) has metadata, tags, "key idea in
  short" description, "depends on" YAML frontmatter
- there's an index page on the website (modules/) which lists them all

I'm fine if each module index.md starts as an "auto-conversion" of the typst
code, and then I can tweak from there (in particular, ignore any layout-specific
stuff, e.g. two-columns). You can still use the hero image, though.

How does this sound as a plan? Is there a simpler/better way to do it?
