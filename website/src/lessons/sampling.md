---
title: Sampling
description:
  Experiment with temperature and truncation strategies to shape how your model
  picks the next word.
order: 4
pdf: /assets/pdfs/04-sampling-strategies.pdf
keyIdea:
  Different sampling strategies change the character of generated text even when
  the model stays the same.
dependsOn:
  - Basic Generation
hero: /assets/images/sxsw-1.jpg
templateEngineOverride: njk,md
---

# Sampling

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

When generating text, your model offers several options for the next word.
Sampling strategies decide which one to pick.

{% if hero %}
![Students comparing output from different sampling settings]({{ hero }})
{% endif %}

## You will need

- a completed model from an earlier lesson
- pen, paper, and dice as per _Basic Generation_

## Your goal

Generate text using at least two temperatures and at least two truncation
strategies. Stretch goal: design and test your own truncation rule.

## Key idea

Sampling choices—temperature and truncation—can make the same model sound
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
  overflow the line’s syllable limit, re-roll.
- **Non-sequitur:** pick the lowest non-zero count; if tied, roll among the
  least likely options.
- **No-repeat:** track words used in the current sentence. If you roll a repeat,
  reroll; if nothing valid remains, insert `.` and continue.
- **Alliteration:** prefer options that start with the same letter/sound as the
  previous word; otherwise sample normally.
