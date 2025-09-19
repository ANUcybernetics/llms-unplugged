---
title: "Weighted Randomness"
socy_logo: true
prereqs: []
---

## Description

Learn how to make random choices where some options are more likely than
others---the fundamental operation behind all language model text generation.
This pre-module teaches multiple physical and mathematical approaches to
weighted randomness, preparing you for all subsequent activities.

## Materials

Choose one or more approaches based on available materials:

- paper tokens and a bag/container
- 20-sided dice (d20)
- 6-sided dice (d6) as an alternative
- spinner wheel template and paperclip
- coloured marbles or beads
- paper for frequency matrices (also called grids or tables)

## Core concepts

In many real-world situations, we need to make random choices where some
outcomes are more likely than others. There are several ways to achieve this.

## Activity steps

### Method 1: Tokens in a Bag

- **materials**: paper, bag
- **setup**:
  - write `vanilla` on 5 paper squares
  - write `chocolate` on 3 paper squares
  - write `strawberry` on 2 paper squares
  - mix in bag, draw one
- **pros**: intuitive, exact probabilities
- **cons**: setup time, need many tokens for complex distributions
- **potential tweaks**: use colored marbles or beads (just need a way of
  remembering which colour corresponds to which flavour)

### Example

For example, you might want to (overall) eat vanilla ice-cream 50% of the time,
chocolate 30%, and strawberry 20%, and need a way to randomly select (or
_sample_) an ice-cream flavour according to these weights.

- put 5 `vanilla` tokens, 3 `chocolate` tokens and 2 `strawberry` tokens in bag
- draw randomly
- look at the to50% chance of `vanilla`, 30% chance of `chocolate`, 20% chance
  of `strawberry`

### Method 2: Dice with ranges

- **materials**: d20 (or d6, d10 as alternatives)
- **setup**: assign number ranges proportional to weights
- **pros**: quick, no setup, scalable with different dice
- **cons**: limited by die size, may need rounding
- **potential tweaks**:
  - use d20 for most cases (up to 20 units)
  - use d6 for simpler cases (up to 6 units)
  - use two d10s as percentile dice (00-99) for even finer control

### Example

With d20 for ice-cream preferences vanilla(10), chocolate(6), strawberry(4):

- mapping: 1-10 → `vanilla`, 11-16 → `chocolate`, 17-20 → `strawberry`

| Flavour      | Count | Die Range | Probability |
| ------------ | ----- | --------- | ----------- |
| `vanilla`    | 10    | 1-10      | 10/20       |
| `chocolate`  | 6     | 11-16     | 6/20        |
| `strawberry` | 4     | 17-20     | 4/20        |

Alternatively with d6 for simpler preferences vanilla(3), chocolate(2),
strawberry(1):

- mapping: 1-3 → `vanilla`, 4-5 → `chocolate`, 6 → `strawberry`

### Method 3: Spinner wheel

- **materials**: circle template, paperclip, pencil
- **setup**:
  - divide circle into wedges proportional to weights
  - spin paperclip around pencil at centre
- **pros**: visual, reusable, intuitive
- **cons**: construction time, less precise
- **potential tweaks**: use a protractor for more accurate angle measurements,
  or print pre-made templates

### Example

- `vanilla`: 180° (50%)
- `chocolate`: 108° (30%)
- `strawberry`: 72° (20%)

## Activity variations

### Marble Racing

- create ramps with different width lanes
- width proportional to probability
- drop marble, see which lane it enters

### Stopwatch Method

- pull out a stopwatch (e.g. on your phone)
- start it running, then close your eyes and hit stop
- the right-most (fastest-changing) digit is your random number (0--9)
- if you need a two digit number from 0--99, use the two right-most digits

## Discussion questions

- which method feels most "random" to you, and why?
- which is fastest for getting repeated random selections?
- how would you handle weights like 17, 23, 41?
- what happens when one option has 95% probability?
- can you invent your own weighted random selection method?

## Example

Given this ice-cream shop's sales data, try each method:

- `mint`: 1 sale
- `vanilla`: 3 sales
- `chocolate`: 2 sales

1. calculate exact probabilities (1/6, 3/6, 2/6)
2. try tokens-in-bag method
3. map to d6 ranges (perfect fit!)
4. create a spinner wheel
5. sample 10 times with each method
6. compare results - do they match expected probabilities?

## Appendix: d20 partition tables

| 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1   | .   | .   | .   | .   | .   | .   | .   | .   | 10  | 11  | .   | .   | .   | .   | .   | .   | .   | .   | 20  |
| 1   | .   | .   | .   | .   | .   | 7   | 8   | .   | .   | .   | .   | .   | 14  | 15  | .   | .   | .   | .   | 20  |
| 1   | .   | .   | .   | 5   | 6   | .   | .   | .   | 10  | 11  | .   | .   | .   | 15  | 16  | .   | .   | .   | 20  |
| 1   | .   | .   | 4   | 5   | .   | .   | 8   | 9   | .   | .   | 12  | 13  | .   | .   | 16  | 17  | .   | .   | 20  |
| 1   | .   | 3   | 4   | .   | 6   | 7   | .   | 9   | 10  | .   | 12  | 13  | .   | 15  | 16  | .   | 18  | 19  | 20  |
