// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.
#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Basic Generation",
  "images/CYBERNETICS_A_020.jpg",
  "02",
)[
  Use a pre-trained model to generate new text through weighted random sampling.

  == You will need

  - your completed bigram model (i.e. your filled-out grid) from _Basic
    Training_
  - d10 (or similar) for weighted sampling
  - pen & paper for writing down the generated "output text"

  == Your goal

  To generate new text from your bigram language model. *Stretch goal*: keep
  going, generating as much text as possible. Write a whole book!

  == Key idea

  Language models generate text by predicting one word at a time based on
  learned patterns. Your trained model provides the "next word" options and
  their relative probabilities; dice rolls provide the randomness to choose one
  of those options (and this process can be repeated indefinitely).
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose a starting word*---pick any word from the first column of your grid
  + *look at that word's row* to identify all possible next words and their
    counts
  + *roll dice weighted by the counts* (see the _Weighted Randomness_ module)
  + *write down the chosen word* and use that as your next starting word
  + *repeat* from step 2 until you reach the desired length _or_ a natural
    stopping point (e.g. a full stop `.`)

  #colbreak()

  == Example

  Using the same bigram model from the example in _Basic Training_:

  #lm-grid-auto((
    "see",
    "spot",
    "run",
    ".",
    "see",
    "spot",
    "jump",
    ".",
    "run",
    ",",
    "spot",
    ",",
    "run",
    ".",
    "jump",
    ",",
    "spot",
    ",",
    "jump",
    ".",
  ))


  - choose (for example) `see` as your starting word
  - `see` (row) → `spot` (column); it's the only option, so write down `spot` as
    next word
  - `spot` → `run` (25%), `jump` (25%) or `,` (50%); roll dice to choose
  - let's say dice picks `run`; write it down
  - `run` → `.` (67%) or `,` (33%); roll dice to choose
  - let's say dice picks `.`; write it down
  - `.` → `see` (33%), `run` (33%) or `jump` (33%); roll dice to choose
  - let's say dice picks `see`; write it down
  - `see` → `spot`; it's the only option, so write down `spot`... and so on

  After the above steps, the generated text is _"see spot run. see spot"_
]
