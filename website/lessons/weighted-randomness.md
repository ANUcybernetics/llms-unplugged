---
title: Weighted Randomness
description:
  Learn how to make random choices where some options are more likely than
  others—a core generative AI operation.
order: 3
topic: fundamentals
keyIdea:
  Use weighted sampling to make random choices that reflect a target probability
  distribution.
dependsOn: []
---

# Weighted Randomness

::: info Lesson Info This lesson is part of the
[Fundamentals](/topics/fundamentals) topic, with instructions for students
(including examples) and [instructor notes](#instructor-notes). If you'd like a
printable version of the student handout,
[download it here](/assets/pdfs/weighted-randomness.pdf). :::

Learn how to make random choices where some options are more likely than
others—an operation at the core of all generative AI.

![Hero image: Weighted Randomness](/assets/images/hero-weighted-randomness.jpg)

## You will need

- 10-sided dice (d10)
- coloured marbles or beads in a bag

## Your goal

Randomly choose from a fixed set of outcomes according to a given probability
distribution.

## Key idea

Sometimes we need to make random choices where some outcomes are more likely
than others. There are simple ways to do this while keeping the average outcome
proportions close to the probabilities you choose.

## Algorithm 1: beads in a bag

- materials: coloured beads, bag
- setup: count out a number of beads corresponding to the desired weights for
  each outcome
- sampling procedure: shake the bag, then draw one bead without looking

### Example

You want to choose an ice cream flavour: `vanilla` 50% of the time, `chocolate`
30%, and `strawberry` 20%.

- add 5 white beads to the bag (vanilla)
- add 3 brown beads to the bag (chocolate)
- add 2 red beads to the bag (strawberry)

Draw a bead from the bag—that's your ice-cream choice for today.

## Algorithm 2: dice with ranges

- materials: d10 (or d6, d20 as alternatives)
- setup: assign number ranges proportional to weights
- sampling procedure: roll the die, then look up the corresponding outcome

### Example

- for 60% vanilla / 40% chocolate, roll a d10: 1-6 means vanilla, 7-10 means
  chocolate
- for 50% vanilla / 30% chocolate / 20% strawberry, roll a d10: 1-5 means
  vanilla, 6-8 means chocolate, 9-10 means strawberry

You can use different dice (d6, d10, d20, d120, etc.); it just changes the
number ranges corresponding to each outcome.

## d10 roll-to-outcome mapping

A quick reference for common splits:

- 80/20: 1-8 for the 80% outcome, 9-10 for the 20%
- 70/30: 1-7 for the 70% outcome, 8-10 for the 30%
- 60/40: 1-6 for the 60% outcome, 7-10 for the 40%
- 50/30/20: 1-5 for 50%, 6-8 for 30%, 9-10 for 20%

Adjust the ranges to match whatever probabilities you need.

## Instructor notes

Note: this is a "pre-lesson"; it's usually ok to start from lesson 01 and just
have this lesson card handy to refer to if students want more detailed
instruction about weighted random sampling.

### Discussion questions

- which method feels most "random" to you, and why?
- which is fastest for getting repeated random selections?
- how would you handle weights like 17, 23, 41?
- what happens when one option has 95% probability?
- can you invent your own weighted random selection method?

### Connection to current LLMs

This lesson introduces weighted random sampling before students encounter
language models. While not specific to LLMs, this operation is fundamental to
how they work:

- **generation mechanism**: every time an LLM produces a word, it's performing
  weighted random sampling from a probability distribution
- **probability distributions**: neural networks output probabilities for
  thousands of possible next tokens; these probabilities become the "weights"
  for sampling
- **physical intuition**: dice and tokens make the mathematics tangible—when
  students later learn about "sampling from a distribution," they'll have
  hands-on experience with what that means

The key insight: weighted randomness is a general computational technique with
applications far beyond language models (simulations, games, procedural
generation). In the context of language models, this same operation happens
billions of times during text generation. These physical methods (dice, tokens)
implement the exact same mathematical operation that occurs inside LLMs when
they choose the next word.
