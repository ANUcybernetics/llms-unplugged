// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "/typst/utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: lesson-setup

#lesson-hero(
  "Trigram (bucket version)",
  "/typst/images/CYBERNETICS_A_067.jpg",
)[
  Extend the bucket bigram model to consider _two_ words of context instead of
  one, leading to better text generation.

  == You will need

  - the same materials as _Bucket Training_
  - additional small containers for two-word label buckets
  - sticky notes or paper for bucket labels (you'll need to write two words on
    each label)

  == Your goal

  To build a trigram language model using buckets where each bucket is labelled
  with _two_ words instead of one. *Stretch goal*: train on more data or
  generate longer outputs.

  == Key idea

  Trigrams show how more context improves prediction quality. Instead of asking
  "what follows this word?", we ask "what follows these _two_ words?". This
  means more buckets to manage, but better predictions.
]

// Training section in two columns
#columns(2, gutter: 1em)[
  == Algorithm (training)

  + *prepare your tokens* as per _Bucket Training_ (print, cut into tokens, keep
    in order)

  + *build the model* using word _pairs_ as bucket labels:
    - take the first _two_ tokens---these form your bucket label
    - create the bucket if needed, then put the _third_ token inside it
    - shift along by one (new pair = old second word + token just placed)
    - repeat until all tokens are in buckets

  #colbreak()

  == Example (training)

  Original text: _"See Spot run. See Spot jump."_

  Prepared tokens: `see` `spot` `run` `.` `see` `spot` `jump` `.`

  After processing all tokens:

  #table(
    columns: 2,
    align: left,
    table.header([*Bucket label*], [*Tokens inside*]),
    [`see spot`], [`run` `jump`],
    [`spot run`], [`.`],
    [`run .`], [`see`],
    [`. see`], [`spot`],
    [`spot jump`], [`.`],
  )

  The "see spot" bucket has two tokens because different words followed that
  pair. Compare to bigram where "see" would just contain `spot` `spot`.
]

// Gold horizontal rule
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

// Generation section in two columns
#columns(2, gutter: 1em)[
  == Algorithm (generation)

  + *choose a starting bucket*; write down its two-word label
  + *close your eyes and pick a random token* from that bucket
  + *write down the token*, then put it back in the bucket
  + *find the bucket* whose label matches your last _two_ words (second word of
    old label + the token you just picked)
  + if no bucket exists, use any bucket starting with the _first_ word instead
  + *repeat* from step 2 until you reach a stopping point

  #colbreak()

  == Example (generation)

  Using the bucket model from training:

  + start with `see spot` bucket; write "see spot"
  + pick randomly: `run` or `jump`---say we get `run`; write it
  + find bucket "spot run"; pick `.`; write it
  + find bucket "run ."; pick `see`; write it
  + find bucket ". see"; pick `spot`; write it
  + find bucket "see spot"; this time pick `jump`; write it
  + find bucket "spot jump"; pick `.`; write it

  Generated text: _"see spot run. see spot jump."_
]
