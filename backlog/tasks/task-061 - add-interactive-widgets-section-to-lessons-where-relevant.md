---
id: task-061
title: add interactive widgets section to lessons where relevant
status: Done
assignee: []
created_date: '2025-11-27 02:54'
updated_date: '2025-12-09 00:57'
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 TrainingWidget animates building a bigram model from user input text
- [x] #2 GenerationWidget animates generating text with dice roll visualisation
- [x] #3 Both widgets have play/step/reset controls
- [x] #4 Both widgets support fullscreen mode via Browser Fullscreen API
- [x] #5 Dead-end rows are greyed out in GenerationWidget
- [x] #6 Circular corpus (last word -> first word) prevents dead ends
- [x] #7 All tests pass
- [x] #8 Widgets are integrated into Basic Training and Basic Generation lessons
- [x] #9 Reduced motion preference is respected
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation phases

### Phase 1: shared infrastructure
1. Create `usePlayback` composable for step-through animation control
2. Create `PlaybackControls.vue` component (play/pause/step/reset buttons)
3. Create `FullscreenWrapper.vue` component using Browser Fullscreen API

### Phase 2: training widget
1. Extract `tally()` function to shared utility
2. Create `TrainingWidget.vue` with animated bigram training

### Phase 3: generation widget
1. Port dice mapping logic from Python to TypeScript
2. Create `GenerationWidget.vue` with animated text generation

### Phase 4: styling
1. Add widget CSS to custom.css (tokens, highlights, animations)
2. Add reduced motion support

### Phase 5: testing
1. Write tests for usePlayback composable
2. Write tests for diceMapping utility
3. Write tests for TrainingWidget
4. Write tests for GenerationWidget

### Phase 6: lesson integration
1. Add TrainingWidget to Basic Training lesson
2. Add GenerationWidget to Basic Generation lesson
<!-- SECTION:PLAN:END -->
