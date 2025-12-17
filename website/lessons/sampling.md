---
title: Sampling
description:
  Experiment with temperature and truncation strategies to shape how your model
  picks the next word.
order: 4
topic: controlling-output
keyIdea:
  Different sampling strategies change the character of generated text even when
  the model stays the same.
dependsOn:
  - Grid Generation
---

# Sampling

::: info Lesson Info

This lesson is part of the [Controlling Output](/topics/controlling-output)
topic, with instructions for students (including examples) and
[instructor notes](#instructor-notes).

:::

When generating text, your model offers several options for the next word.
Sampling strategies decide which one to pick.

![Hero image: Sampling](/assets/images/hero-sampling.avif)

<Prerequisites />

## You will need

- a completed model from an earlier lesson
- pen, paper, and dice as per _Grid Generation_

## Your goal

Generate text using at least two temperatures and at least two truncation
strategies. Stretch goal: design and test your own truncation rule.

## Key idea

Sampling choices---temperature and truncation---can make the same model sound
cautious, wild, repetitive, or inventive. Tweaking the sampler changes the
output without retraining anything.

## Temperature control

Temperature is a number that smooths the distribution. Higher temperatures
flatten differences between options, making surprising words more likely.

- Algorithm: when sampling the next word, divide all counts by the temperature
  (round down, minimum 1) before rolling dice.
- Example with counts `spot:4, run:2, jump:1, .:1`:
  - Temp 1 → use counts as-is (spot twice as likely as run; four times jump or
    `.`).
  - Temp 2 → counts become 2,1,1,1 (spot still highest, but less dominant).
  - Temp 4 → counts become 1,1,1,1 (all options equal).

## Truncation strategies

Truncation narrows which next-word options are allowed. Mix and match with
temperature.

- **Greedy:** pick the highest count; if tied, roll among the top options.
- **Haiku:** track syllables per line (5-7-5). Roll as normal; if the word would
  overflow the line's syllable limit, re-roll.
- **Non-sequitur:** pick the lowest non-zero count; if tied, roll among the
  least likely options.
- **No-repeat:** track words used in the current sentence. If you roll a repeat,
  reroll; if nothing valid remains, insert `.` and continue.
- **Alliteration:** prefer options that start with the same letter/sound as the
  previous word; otherwise sample normally.

## Instructor notes

### Discussion questions

- which strategy produces the most "human-like" text?
- when would you want predictable vs surprising output?
- how do constraints (haiku, no-repeat) spark creativity?
- can you invent your own sampling strategy?

### Connection to current LLMs

Current LLMs use these same mechanisms, though the specific strategies differ.

- **Temperature control:** the temperature parameter divides probabilities just
  like you divide tallies; higher temperature means more random output. The
  lesson uses manual temperature adjustment, while LLMs do this computationally
  before every token.
- **Truncation techniques in modern LLMs:** top-k sampling (only consider k most
  likely tokens), top-p/nucleus sampling (consider tokens until cumulative
  probability reaches p), repetition penalties, frequency penalties, and
  presence penalties all prune options before sampling.
- **Truncation techniques in this lesson:** greedy, haiku, non-sequitur,
  no-repeat, and alliteration are designed for dice-based sampling but embody
  the same idea---changing which tokens are eligible before you roll.

Your paper model demonstrates that "creativity" in AI comes from two controls:
adjusting temperature (probability distribution shape) and applying truncation
strategies (which tokens to exclude). The same trained model can produce
scholarly essays (low temperature, strict truncation) or wild poetry (high
temperature, constraint-based truncation) just by changing these parameters. The
key insight: generation control is as important as training data. Creative
output comes not from the model itself, but from how you control temperature and
which tokens you truncate from consideration.
