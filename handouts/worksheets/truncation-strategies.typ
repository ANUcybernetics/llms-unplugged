// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// One sampling strategy a page, big enough to read from a table: the rules a
// pair swaps in for "roll and take the first option ≥ your roll".
#import "../handout-common.typ": handout

#show: handout.with(title: [Sampling strategies], flipped: true)

#set text(size: 30pt)
#show heading: set block(below: 0.6em)

= Greedy sampling

+ pick the first option in the list (the most likely one)

#pagebreak()

= Haiku sampling

+ track syllables in current line (5-7-5 pattern)
+ roll dice to select next word as normal
+ if selected word exceeds line's syllable limit, re-roll
+ start new line when syllable count reached

#pagebreak()

= Non-sequitur sampling

+ pick the last option in the list (the least likely one)

#pagebreak()

= No-repeat sampling

+ track all words used in current sentence
+ roll dice to select next word as normal
+ if word already used, re-roll
+ if no valid options remain, insert `.` and continue

#pagebreak()

= Alliteration sampling

+ note the first letter of the previous word
+ if any options start with the same letter, roll only among those
+ otherwise, roll as normal

#pagebreak()

= Top-k sampling

+ choose a number $k$ (e.g. 2 or 3)
+ only roll among the first $k$ options in the list

#pagebreak()

= Alphabet chain sampling

+ the next word must start with the last letter of the previous word
+ if no option qualifies, roll as normal

#pagebreak()

= Short/long sampling

+ pick a length threshold (e.g. 4 letters)
+ *short:* allow only words at or below that length
+ *long:* allow only words above that length
+ if nothing qualifies, re-roll
