#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

// Title and subtitle
= Basic Inference
_"My First LM Module #2"_

// First page content with image on left
// Place image on left side of first page (behind golden rule and logo)
#place(
  top + left,
  dx: -2.5cm,
  dy: -2.5cm,
  box(
    width: 11.9cm,
    height: 26cm,
    clip: true,
    image("images/CYBERNETICS_A_020.jpg", width: 100%, height: 100%, fit: "cover"),
  ),
)

// Content now starts after the image on the left
#h(11.9cm - 2.5cm + 1cm) // Horizontal space to clear the image
#box(width: 29.7cm - 11.9cm - 2.5cm - 1cm)[
  Use a pre-trained model to generate new text through weighted random sampling.

  == You will need

  - your completed model (i.e. the word co-occurence grid) from _Basic Training_
  - d20 (or similar) for weighted sampling
  - paper for writing down the generated "output text"

  == Your goal

  To generate new text (as much as you like!) from your bigram language model.

  == Key idea

    Language models generate text by predicting one word at a time based on learnt
    patterns. Your trained model provides the "next word" options and their
    probabilities; dice rolls provide the randomness to choose one of those
    options.
  ],
)

#pagebreak()

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose a starting word*---pick any word from the first column of your grid
  + *look at that word's row* to identify all possible next words and their
    counts
  + *roll dice weighted by the counts* (see the _Weighted Random Sampling_
    module)
  + *write down the chosen word* and use that as your next starting word
  + *repeat* from step 2 until you reach the desired length _or_ a natural
    stopping point (e.g. a full stop `.`)

  #colbreak()

  == Example

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
  - `spot` → `run` or `jump`; both have 2 occurrences, so each has a 50%
    chance---roll dice to choose
  - let's say dice picks `jump`; write it down
  - `jump` → `.`; it's the only option, so write down `.`
  - `.` → `see` (50%), `run` (25%), or `jump` (25%); three possible choices for
    next word
  - let's say dice picks `see`; write it down
  - `see` → `spot`; it's the only option, so write down `spot`... and so on

  After the above steps, the full output text is _"see spot jump. see spot"_
]
