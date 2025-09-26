#import "utils.typ": *

// Apply base styling
#show: module-setup

// Place image on left side of first page, under the golden rule and logos
#place(
  top + left,
  dx: -2.5cm,
  dy: -2.5cm,
  box(
    width: 11.9cm,
    height: 26cm,
    clip: true,
    image("images/CYBERNETICS_A_005.jpg", width: 100%, height: 100%, fit: "cover"),
  ),
)

// Create a two-column layout for the first page
#grid(
  columns: (11.9cm - 2.5cm, auto),
  column-gutter: 1cm,
  [],  // Empty left column where the image is
  [
    = Weighted Randomness
    _My First LM Module #0_

    Learn how to make random choices where some options are more likely than
    others---the fundamental operation behind all language model text generation.

    == You will need

    Choose one or more approaches based on available materials:

    - paper tokens and a bag/container
    - 20-sided dice (d20)
    - coloured marbles or beads
    - paper for frequency matrices (also called grids or tables)

    == Your goal

    To randomly choose from a fixed set of outcomes according to a given probability
    distribution.

    == Key idea

    Sometimes we need to make random choices where some outcomes are more likely
    than others. There are ways to do this which ensure certain relationships
    between the outcomes (e.g. one outcome happening twice as often as another one)
    _on average_.
  ],
)

#pagebreak()

// Second page content in two columns
#columns(2, gutter: 1em)[
== Algorithm 1: Beads in a Bag

- *materials*: coloured beads, bag
- *setup*: count out a number of beads corresponding to the desired weights for
  each outcome
- *sampling procedure*: shake the bag, then draw one bead without looking

=== Example

You buy an ice-cream every day. You want to randomly choose the flavour each
day, but you want to (overall) eat vanilla ice-cream 50% of the time, chocolate
30%, and strawberry 20%.

- add 5 white beads to the bag (corresponding to vanilla)
- add 3 brown beads to the bag (corresponding to chocolate)
- add 2 red beads to the bag (corresponding to strawberry)

Draw a bead from the bag---that's your ice-cream choice for today.

It doesn't actually matter what the colours are, as long as you remember which
ones correspond to which outcomes.

== Algorithm 2: Dice with ranges

- *materials*: d20 (or d6, d10 as alternatives)
- *setup*: assign number ranges proportional to weights
- *sampling procedure*: roll the die, then look up the corresponding outcome

=== Example

- for 67% vanilla/33% chocolate, roll a d20 and 1-14→`vanilla`,
  15-20→`chocolate`
- for 50% vanilla/30% chocolate/20% strawberry, roll a d20 and 1-10→`vanilla`,
  11-16→`chocolate`, 17-20→`strawberry`

You can use any dice (d6, d10, d20, d120, etc.), it will just change the number
ranges corresponding to each outcome.

== d20 dice roll → outcome mapping table

#figure(image("dice-mappings.svg", width: 100%))
]
