#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Context Columns",
  "images/CYBERNETICS_A_051.jpg",
  "05",
)[
  Enhance the bigram model with context columns that capture grammatical and
  semantic patterns.

  == You will need

  - your completed bigram model from _Basic Training_
  - pen, paper & dice as per _Basic Inference_

  == Your goal

  To add new "context" columns to an existing bigram model and generate text
  from your newly context-aware model. *Stretch goal*: add and evaluate your own
  new context columns.

  == Key idea

  The concept of attention---selectively focusing on relevant context---is a key
  innovation in Large Language Models. Adding context columns to your model
  gives it more information about which previous words matter most for
  prediction, leading to better generated text (with the trade-off being a
  slightly larger grid and more complex algorithm).
]

// Training section in two columns
#grid(
  columns: (3fr, 4fr),
  gutter: 1em,
  [
    == Algorithm (training)

    + *add context columns* to your existing bigram model: _after verb_, _after
        pronoun_ and _after preposition_
    + proceed as per _Basic Training_, but each time after updating the cell
      count for a word pair:
      - if the first word is a verb, increment the value in the second word's
        _after verb_ column
      - if the first word is a pronoun (I/you/they etc.), increment the value in
        the second word's _after pronoun_ column
      - if the first word is a preposition (in/on/at/with/to etc.), increment
        the value in the second word's _after preposition_ column

    This is a little tricky to get the hang of, but the key point is that you're
    updating two different rows each time---once for the "word follows word"
    cell, and once for the "context column" cell.
  ],
  [
    == Example (training)

    For text _"I run fast. You run to me."_ the model \
    with context columns is:

    #table(
      columns: (1.1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
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
      [#v(-3.5em)#rotate(-90deg)[#text(fill: anu-colors.teal-3)[after~verb]]],
      [#v(-3.5em)#rotate(-90deg)[#text(
          fill: anu-colors.teal-3,
        )[after~pronoun]]],
      [#v(-3.5em)#rotate(-90deg)[#text(
          fill: anu-colors.teal-3,
        )[after~preposition]]],

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
  ],
)
// Gold horizontal rule
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

// Inference section in two columns
#columns(2, gutter: 1em)[
  == Algorithm (inference)

  + *choose a starting word*
  + check its row to identify the "normal" transition counts, but _also_ check
    if the starting word is a verb/pronoun/preposition and if so add the values
    from the relevant "context" column before using a d10 to choose the next
    word
  + *repeat* from step 2 until you reach the desired length _or_ a natural
    stopping point (e.g. a full stop `.`)

  If you like, you can add your own context columns (based on patterns which
  _you_ think are important).

  #colbreak()

  == Example (inference)

  Starting word: `run` (a verb):

  + check `run` row: potential next words are `fast` (1) or `to` (1)
  + check all context columns: for `to` the *after verb* column has a count of 1
    (appears after verbs)
  + combine both counts: roll a dice to choose either `fast` (1) or `to`
    ($1+1=2$)
  + repeat from step 1 until you reach the desired length _or_ a natural
    stopping point (e.g. a full stop `.`)
]
