---
id: task-061
title: add interactive widgets section to lessons where relevant
status: To Do
assignee: []
created_date: "2025-11-27 02:54"
labels: []
dependencies: []
---

This is supposed to be unplugged, but it's sometimes handy (esp. as a teacher)
to get your head around it with an interactive widget. So we'll add a few
well-chosen widgets in strategic lessons. The vibe I'm going for is a bit like
3Blue1Brown (simple, clear animations) but I want each widget to be an
interactive vue component.

I also want an option for each widget to be made "fullscreen" (e.g. for
displaying on screen in a classroom).

Here are the initial set of interactive vue components (widgets) I want.

## Training

- widget starts with a text box for user input
- on submit, there's an animation which shows the text being broken into bigrams
- for each bigram
  - show how the first & second word of the bigram denote the lmGrid row & cols
  - then update the tally in that cell

I think it'd be best to have some play/step/reset controls for this, so that
users can see it happen at their own pace. In fact, I think we should have this
option for all the widgets.

## Generation

Have an existing model (perhaps a pre-calculated one), then:

- choose prompt word (perhaps by clicking on the row)
- that word gets "written out" to the "output text" section of the widget, then
- highlight the non-zero columns, and show how they map to different dice rolls
  (similar to how the @cli/scripts/generate_dice_mappings.py script works)
- then show a "dice roll" (just an rng is fine, but show how it then indicates
  which word to write down next)
- animate the writing of that next word, then re-start the animation to select
  the next word (although use the same step/play/reset controls)
