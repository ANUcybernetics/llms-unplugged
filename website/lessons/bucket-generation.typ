// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "/typst/utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: lesson-setup

#lesson-hero(
  "Bucket Generation",
  "/typst/images/CYBERNETICS_A_042.jpg",
)[
  Use your bucket-based bigram model to generate new text by picking tokens at
  random.

  == You will need

  - your completed bucket model from _Bucket Training_
  - pen & paper for writing down the generated "output text"

  == Your goal

  To generate new text from your bucket language model. *Stretch goal*: keep
  going, generating as much text as possible. Write a whole book!

  == Key idea

  Language models generate text by predicting one word at a time based on
  learned patterns. Each bucket contains all the tokens that could come
  next---and some tokens appear multiple times, making them more likely to be
  picked. Choosing randomly from a bucket and repeating word by word creates new
  text.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose a starting bucket*---pick any bucket and write down its label as the
    first word
  + *close your eyes and pick a random token* from inside that bucket
  + *write down the token* you picked
  + *put the token back* in the bucket (so you can use it again later)
  + *find the bucket* whose label matches the token you just picked
  + *repeat* from step 2 until you reach the desired length _or_ a natural
    stopping point (e.g. an empty bucket)

  #colbreak()

  == Example

  Using the same bucket model from the example in _Bucket Training_:

  #table(
    columns: 2,
    align: left,
    table.header([*Bucket*], [*Tokens inside*]),
    [`see`], [`spot` `spot`],
    [`spot`], [`run` `jump`],
    [`run`], [`.`],
    [`.`], [`see`],
    [`jump`], [`.`],
  )

  - choose `see` as your starting bucket; write down "see"
  - pick from "see" bucket: both tokens are `spot`, so we get `spot`; write it
    down
  - pick from "spot" bucket: randomly between `run` and `jump`
  - let's say we pick `run`; write it down
  - pick from "run" bucket: only `.` inside; write it down
  - pick from "." bucket: only `see` inside; write it down
  - pick from "see" bucket: get `spot`; write it down
  - pick from "spot" bucket: this time we pick `jump`; write it down
  - pick from "jump" bucket: only `.` inside; write it down

  After the above steps, the generated text is _"see spot run. see spot jump."_

  The randomness comes from physically picking tokens without looking. Buckets
  with more tokens of the same type are more likely to produce that token.
]
