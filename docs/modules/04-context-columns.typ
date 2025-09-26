#import "utils.typ": *
#import "@local/anu-typst-template:0.1.0": anu-colors

// Apply base styling (colors, fonts, page setup)
#show: module-setup

// Title and subtitle
= Context Columns
_"My First LM Module #4"_

// First page content with image on right
// Place image on right side of first page
#place(
  top + right,
  dx: 2.5cm,
  dy: -2.5cm,
  box(
    width: 11.9cm,
    height: 26cm,
    clip: true,
    image("images/CYBERNETICS_A_051.jpg", width: 100%, height: 100%, fit: "cover"),
  ),
)

// Content width constraint for first page
#let content-width = 29.7cm - 11.9cm - 2.5cm - 1cm
#box(width: content-width)[
  Enhance your word bigram model with context columns that capture grammatical and
  semantic patterns.

  == You will need

  - same as basic-training module
  - your completed word co-occurence model from _Basic Training_

  == Your goal

  To add new "context" columns to an existing bigram model and generate text from
  your newly context-aware model.

  == Key idea

  The concept of attention---selectively focusing on relevant context---is the key
  innovation behind transformer models like GPT. By adding grammatical context
  columns to your model, you manually implement what transformers learn
  automatically---which previous words matter most for prediction.
]

#pagebreak()

// Second page content in two columns
#columns(2, gutter: 1em)[
== Algorithm (training)

+ *add context columns* to your existing bigram model: _after verb_, _after
    pronoun_ and _after preposition_
+ *training*: proceed as per _Basic Training_, but each time after updating the
  cell count according to the usual "_column_ word follows _row_ word"
  procedure:
  - if the _row_ word is a verb, increment the value in the _column_ word's
    _after verb_ column
  - if the _row_ word is a pronoun (I/you/they etc.), increment the value in the
    _column_ word's _after pronoun_ column
  - if the _row_ word is a preposition (in/on/at/with/to etc.), increment the
    value in the _column_ word's _after preposition_ column

== Algorithm (inference)

+ *choose a starting word* as per _Basic Inference_
+ check its row to identify the "normal" transition counts, but _also_ check if
  the starting word is a verb/pronoun/preposition and if so add the values from
  the relevant "context" column before using a d20 to choose the next word
+ *repeat* from step 2 until you reach the desired length _or_ a natural
  stopping point (e.g. a full stop `.`)

If you like, you can add your own context columns (based on patterns which _you_
think are important).

== Example (training)

Original text: _"I run fast. You run to me."_

Model with context columns:

#table(
  columns: 11,
  rows: (auto, 2.4em),
  align: (col, row) => if row == 0 { center } else { left },

  // Headers
  [],
  [`i`],
  [`you`],
  [`run`],
  [`fast`],
  [`to`],
  [`me`],
  [`.`],
  [#v(-4em)#rotate(-90deg)[#text(fill: anu-colors.teal-3)[after~verb]]],
  [#v(-4em)#rotate(-90deg)[#text(fill: anu-colors.teal-3)[after~pronoun]]],
  [#v(-4em)#rotate(-90deg)[#text(fill: anu-colors.teal-3)[after~preposition]]],

  // Rows
  [`i`], [], [], [|], [], [], [], [], [], [], [],

  [`you`], [], [], [|], [], [], [], [], [], [], [],

  [`run`],
  [],
  [],
  [],
  [|],
  [|],
  [],
  [],
  [#text(fill: anu-colors.teal-3)[||]],
  [],
  [],

  [`fast`], [], [], [], [], [], [], [|], [], [], [],

  [`to`],
  [],
  [],
  [],
  [],
  [],
  [|],
  [],
  [#text(fill: anu-colors.teal-3)[|]],
  [],
  [],

  [`me`],
  [],
  [],
  [],
  [],
  [],
  [],
  [|],
  [],
  [],
  [#text(fill: anu-colors.teal-3)[|]],

  [`.`], [], [|], [], [], [], [], [], [], [], [],
)

== Example (inference)

Starting word: `run` (a verb):

+ check `run` row: potential next words are `fast` (1) or `to` (1)
+ check all context columns: for `to` the *after verb* column has a count of 1
  (appears after verbs)
+ combine both counts: roll a dice to choose either `fast` (1) or `to` ($1+1=2$)
+ repeat from step 1 until you reach the desired length _or_ a natural stopping
  point (e.g. a full stop `.`)
]
