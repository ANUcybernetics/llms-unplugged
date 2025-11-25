---
title: Basic Generation
description:
  Use your hand-built bigram model to generate new text through weighted random
  sampling.
order: 2
pdf: /assets/pdfs/02-basic-generation.pdf
keyIdea:
  Language models generate text one word at a time by sampling the next word
  according to learned counts.
dependsOn:
  - Basic Training
  - Weighted Randomness
hero: /assets/images/workshop-1.jpg
templateEngineOverride: njk,md
---

# Basic Generation

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Use a pre-trained (hand-built) bigram model to generate new text through
weighted random sampling.

{% if hero %} ![Group writing on paper during an unplugged activity]({{ hero }})
{% endif %}

## You will need

- your completed bigram model from _Basic Training_
- a d10 (or similar) for weighted sampling
- pen and paper for jotting down the generated text

## Your goal

Generate new text from your bigram language model. Stretch goal: keep going and
write a whole story.

## Key idea

A language model proposes several possible next words along with how likely each
is. Dice rolls pick among those options, and repeating the process word by word
yields fluent text.

## Algorithm

1. Choose a starting word from the first column of your grid.
2. Look at that word's row to find all possible next words and their counts.
3. Roll dice weighted by the counts (see _Weighted Randomness_).
4. Write down the chosen word and make it your new starting word.
5. Repeat from step 2 until you hit a natural stopping point (e.g., `.`) or your
   desired length.

## Example

Using the same bigram model from the example in _Basic Training_:

{% lmGrid "see spot run . see spot jump . run , spot , run . jump , spot , jump ." %}

- choose (for example) `see` as your starting word
- `see` (row) → `spot` (column); it's the only option, so write down `spot` as
  next word
- `spot` → `run` (25%), `jump` (25%) or `,` (50%); roll dice to choose
- let's say dice picks `run`; write it down
- `run` → `.` (67%) or `,` (33%); roll dice to choose
- let's say dice picks `.`; write it down
- `.` → `see` (33%), `run` (33%) or `jump` (33%); roll dice to choose
- let's say dice picks `see`; write it down
- `see` → `spot`; it's the only option, so write down `spot`... and so on

After the above steps, the generated text is _"see spot run. see spot"_
