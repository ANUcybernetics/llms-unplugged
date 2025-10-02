#import "utils.typ": *

// Apply base styling
#show: module-setup

#module-hero(
  "Weighted Randomness",
  "images/CYBERNETICS_A_010.jpg",
  "00",
)[
  Learn how to make random choices where some options are more likely than
  others---an operation at the core of all generative AI.

  == You will need

  - 20-sided dice (d20)
  - coloured marbles or beads in a bag
  - paper for frequency matrices (also called grids or tables)

  == Your goal

  To randomly choose from a fixed set of outcomes according to a given
  probability distribution.

  == Key idea

  Sometimes we need to make random choices where some outcomes are more likely
  than others. There are ways to do this which ensure certain relationships _on
    average_ between the outcomes (e.g. one outcome happening twice as often as
  another one).
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm 1: beads in a bag

  - *materials*: coloured beads, bag
  - *setup*: count out a number of beads corresponding to the desired weights
    for each outcome
  - *sampling procedure*: shake the bag, then draw one bead without looking

  === Example

  You want to choose an ice cream flavour: `vanilla` 50% of the time,
  `chocolate` 30%, and `strawberry` 20%.

  - add 5 white beads to the bag (corresponding to `vanilla`)
  - add 3 brown beads to the bag (corresponding to `chocolate`)
  - add 2 red beads to the bag (corresponding to `strawberry`)

  Draw a bead from the bag---that's your ice-cream choice for today.

  == Algorithm 2: dice with ranges

  - *materials*: d20 (or d6, d10 as alternatives)
  - *setup*: assign number ranges proportional to weights (see table, right)
  - *sampling procedure*: roll the die, then look up the corresponding outcome

  === Example

  - for 67% vanilla/33% chocolate, roll a d20: 1-14 means `vanilla`, 15-20 means
    `chocolate`
  - for 50% vanilla/30% chocolate/20% strawberry, roll a d20: 1-10 means
    `vanilla`, 11-16 means `chocolate`, 17-20 means `strawberry`

  You can use different dice (d6, d10, d20, d120, etc.), it will just change the
  number ranges corresponding to each outcome.

  == d20 dice roll → outcome mapping table

  #v(2cm)
  #figure(rotate(-90deg, image("dice-mappings-d20.svg", width: 16cm)))
]
