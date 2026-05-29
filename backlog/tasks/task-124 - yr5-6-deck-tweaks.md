---
id: TASK-124
title: yr5/6 deck tweaks
status: Done
assignee: []
created_date: '2026-05-29 01:37'
updated_date: '2026-05-29 04:49'
labels: []
dependencies: []
---

- hands up rather than "shout them out"
- don't put the prompt on a slide (remove that slide)
- remove the fill in the blanks slides altogether---we'll do that on a
  whiteboard
- remove 'one pair of words at a time' language
- in the start with a text slide, don't use that sam i am section. use a similar
  length paragraph from further on in the book that's a bit more 'normal' in its
  sentence construction (then the next slide doesn't have to mention hyphens at
  all)
- embolden tokens in that next slide as well
- say 'pair of words' instead of adjacent pair
- remove the text at the bottom of teh slide that starts "30 cutouts—repeated
  pairs..."
- don't mention bigram at all in these slides; just language model is fine
- no need to say 'face up', the cutouts will be double-sided
- for training, combine the your goal, you will need and activity slides into
  one (there's lots of redundancy in there)
- add a timer slide (before the shareback slide, but we don't need the shareback
  or language of language models slides in this section - delete them)
- remove the "Worked example: pick a starting word" slide altogether
- "“i am sam . i do…”—a hint of the original, not a copy" should get a new slide
  of its own
- for the activity, don't say 1-2 sentences; say generate as much text as you
  can (and don't mention reading to the room on that slide)
- remove language of language models slide (don't want any of those in this
  deck) but insert a new slide with discussion questions:
  - did your stories always make sense? why/why not?
  - can any of your models write a story about a crocodile?
- then the later 'about your stories' slide should say:
  - what would help our paper language models to write better stories?
  - when you get a language model to get a story for you, is it thinking about
    how to write the best possible story?
  - if you started with the same starting word, would you generate the same
    story again?

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reworked the year 5/6 cutouts deck per the notes: hands-up word collection (prompt slide removed), warm-up fill-ins moved to the whiteboard, a plainer overview passage from later in the book (no hyphens) with "pair of words" labelling, a combined training slide, dropped bigram/face-up wording plus the language-of-language-models and shareback slides, and added generation + wrap-up discussion questions.

Also added a reusable Timer.astro (countdown with start/pause, +1/-1, reset) on the training, generation and class-story activity slides. Implemented as an .astro component with a bundled script rather than a hydrated Svelte island, because Astro client:* directives don't resolve inside astromotion's remark-processed decks.

Note: the overview/training/generation partials are shared with the 3-hour cutouts deck, so it also inherits the new passage and the two activity timers. Build, typecheck and all 140 tests pass; timer behaviour was browser-verified.
<!-- SECTION:FINAL_SUMMARY:END -->
