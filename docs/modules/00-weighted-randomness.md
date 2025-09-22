---
title: "Weighted Randomness"
socy_logo: true
prereqs: []
---

Learn how to make random choices where some options are more likely than
others---the fundamental operation behind all language model text generation.

## You will need

Choose one or more approaches based on available materials:

- paper tokens and a bag/container
- 20-sided dice (d20) & 6-sided dice (d6)
- coloured marbles or beads
- paper for frequency matrices (also called grids or tables)

## Key idea

Sometimes we need to make random choices where some outcomes are more likely
than others. There are ways to do this which ensure certain relationships
between the outcomes (e.g. one outcome happening twice as often as another one)
_on average_.

## Algorithm 1: Beads in a Bag

- **materials**: coloured beads, bag
- **setup**: count out a number of beads corresponding to the desired weights
  for each outcome
- **sampling procedure**: shake the bag, then draw one bead without looking

### Example

You buy an ice-cream every day. You want to randomly choose the flavour each
day, but you want to (overall) eat vanilla ice-cream 50% of the time, chocolate
30%, and strawberry 20%.

- add 5 white beads to the bag (corresponding to vanilla)
- add 3 brown beads to the bag (corresponding to chocolate)
- add 2 red beads to the bag (corresponding to strawberry)

Then draw a bead from the bag---that's your ice-cream choice for today.

Note: it doesn't actually matter what the colours are, as long as they are
distinct.

## Algorithm 2: Dice with ranges

- **materials**: d20 (or d6, d10 as alternatives)
- **setup**: assign number ranges proportional to weights
- **sampling procedure**: roll the die, then look up the corresponding outcome

### Example

For the same desired outcomes as the previous example, divide the full range of
a d20 (1--20) like so:

- 1-10 → `vanilla`, 11-16 → `chocolate`, 17-20 → `strawberry`

```{=typst}
#figure(
  image("dice-mappings.svg", width: 100%),
  caption: [d20 partition tables showing how to divide a d20 into equal groups for different numbers of outcomes (2--9)]
)
```
