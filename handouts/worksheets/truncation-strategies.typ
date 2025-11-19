// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "@local/anu-typst-template:0.2.0": *

#show: anu.with(
  title: none,
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("studio",),
    hide: "anu-logo",
  ),
  page-settings: (
    flipped: true,
  ),
)

#set text(size: 32pt)

Here are the sampling strategies---print 2up (or even 4up).

#pagebreak()

= Greedy sampling

+ find current word's row
+ select the word with the highest count
+ if there's a tie, roll dice to choose equally among the most likely options

#pagebreak()

= Haiku sampling

+ track syllables in current line (5-7-5 pattern)
+ roll dice to select next word as normal
+ if selected word exceeds line's syllable limit, re-roll
+ start new line when syllable count reached

#pagebreak()

= Non-sequitur sampling

+ find current word's row
+ pick the column with the lowest (non-zero) count
+ if there's a tie, roll dice to choose equally among the least likely options

#pagebreak()

= No-repeat sampling

+ track all words used in current sentence
+ roll dice to select next word as normal
+ if word already used, re-roll
+ if no valid options remain, insert `.` and continue

#pagebreak()

= Alliteration sampling

+ note first letter/sound of previous word
+ if any next-word options start with same letter/sound, sample only from those
  alliterative options
+ otherwise use standard sampling
