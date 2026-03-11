---
id: TASK-112
title: rearrange widget layouts
status: To Do
assignee: []
created_date: "2026-03-11 06:15"
labels: []
dependencies: []
---

The training and generation svelte widgets (both grid and bucket variants), and
probably all of these "in lesson widgets" suffer from poor use of space on wide
screens. This is particularly a problem because (with the fullscreen-ability of
them) they're designed to be shown on large 16:9 TVs and smartboards.

As an example, the (grid) training widget:

- has training text and tokens each on their own "line/row" in the widget
  (perhaps for large screens these could each be on the same line, and if the
  text is long they could just be taller?)

- has "grid cells" that are much wider than they are tall - perhaps limit this
  aspect ratio (truncating long tokens, as per some of the bucket widgets)?

- there's lots of (currently gold) borders, which isn't visually necessary I
  don't think - and it makes the whole thing visually a bit messy

- the current bigram (again) gets its own row; I think that in this case it
  could be next to the controls (could be fixed-width-ish, with the controls
  taking up the rest of the width)

Obviously I still want the widgets to work _ok_ when in the normal text flow on
a lesson page, but when they go fullscreen on wide screens (which they often
will) I want to make the most of the space.

Any changes should be made to all applicable widgets, and well tested.
