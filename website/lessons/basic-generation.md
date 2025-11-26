---
title: Basic Generation
description:
  Use your hand-built bigram model to generate new text through weighted random
  sampling.
order: 2
topic: fundamentals
keyIdea:
  Language models generate text one word at a time by sampling the next word
  according to learned counts.
dependsOn:
  - Basic Training
  - Weighted Randomness
---

# Basic Generation

::: info Lesson Info This lesson is part of the
[Fundamentals](/topics/fundamentals) topic, with instructions for students
(including examples) and [instructor notes](#instructor-notes). If you'd like a
printable version of the student handout,
[download it here](/assets/pdfs/basic-generation.pdf). :::

Use a pre-trained (hand-built) bigram model to generate new text through
weighted random sampling.

![Hero image: Basic Generation](/assets/images/hero-basic-generation.jpg)

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

<LmGrid tokens="see spot run . see spot jump . run , spot , run . jump , spot , jump ." />

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

## Instructor notes

### Discussion questions

- how does the starting word affect your generated text?
- why does the text sometimes get stuck in loops?
- if this is a _bigram_ (i.e. 2-gram) model, how would a unigram (1-gram) model
  work?
- how could you make generation less repetitive?
- does the generated text capture the style of your training text?

### Connection to current LLMs

This generation process is identical to how current LLMs produce text:

- **sequential generation**: both generate one word at a time
- **probabilistic sampling**: both use weighted random selection (exactly like
  your dice or tokens)
- **probability distribution**: neural network outputs probabilities for all
  50,000+ possible next tokens
- **no planning**: neither looks ahead—just picks the next word
- **variability**: same prompt can produce different outputs due to randomness

The fact: sophisticated AI responses emerge from this simple process repeated
thousands of times. Your paper model demonstrates that language generation is
fundamentally about sampling from learned probability distributions. The
randomness is why LLMs give different responses to the same prompt and why
language models can be creative rather than repetitive. These physical sampling
methods demonstrate the exact mathematical operation happening billions of times
per second inside modern language models.

Note: in AI/ML more broadly, this process of using a trained model to produce
outputs is commonly called "inference"—you may encounter this term in other
contexts. In these teaching resources we use "generation" specifically because
it more clearly describes what language models do: they generate text.
