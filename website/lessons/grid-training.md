---
title: Grid Training
description:
  Build a bigram language model that tracks which words follow which other words
  in text.
order: 1
topic: fundamentals
keyIdea:
  Language models learn by counting patterns in text and tracking which words
  follow other words.
dependsOn:
  - Weighted Randomness
---

# Grid Training

::: info Lesson Info

This lesson is part of the [Fundamentals](/topics/fundamentals) topic, with
instructions for students (including examples) and
[instructor notes](#instructor-notes). If you'd like a printable version of the
student handout, [download it here](/assets/pdfs/grid-training.pdf).

There's also an alternative version of this lesson called
[Bucket Training](/lessons/bucket-training), which covers the same concepts
using physical tokens and buckets instead of a grid.

:::

Build a bigram language model that tracks which words follow which other words
in text.

![Hero image: Grid Training](/assets/images/hero-grid-training.avif)

<Prerequisites />

## You will need

- some text (e.g. a few pages from a kids book, but it can be anything)
- pen, pencil, and grid paper

## Your goal

Produce a grid that captures the patterns in your input text data. This grid is
your bigram language model. Stretch goal: keep training your model on more input
text.

## Key idea

Language models learn by counting patterns in text. Training means building a
model (filling out the grid) to track which words follow other words.

## Algorithm

1. **Preprocess your text**
   - convert everything to lowercase
   - treat words, commas, and full stops as separate "words" (ignore other
     punctuation and whitespace)
2. **Set up your grid**
   - take the first word from your text
   - write it in both the first row header and first column header of your grid
3. **Fill in the grid** one word pair at a time
   - find the row for the first word (in your training text) and the column for
     the second word
   - add a tally mark in that cell (if the word isn't in the grid yet, add a new
     row and column for it)
   - shift along by one word (so the second word becomes your "first" word) and
     repeat until you've gone through the entire text

## See how it works

Before you try training a model yourself with pen and paper, work through this
example to see the algorithm in action. The written walkthrough and interactive
widget below both demonstrate the same process.

### Worked example

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

Preprocessed text: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

After the first two words (`see` `spot`) the model looks like:

<LmGrid tokens="see spot" :nrows="6" :ncols="7" />

After the full text the model looks like:

<LmGrid tokens="see spot run . see spot jump . run , spot , run . jump , spot , jump ." />

### Interactive widget

Step through the training process at your own pace. Enter your own text or use
the example, then press Play or Step to watch the model being built.

<TrainingWidget initialText="See spot run. See spot jump. Run, Spot, run. Jump, Spot, jump." />

## Instructor notes

### Discussion questions

- what can you tell about the input text by looking at the filled-out bigram
  model grid?
- how does including punctuation as "words" help with sentence structure?
- are there any other ways you could have written down this exact same model?
- how could you use this model to generate _new_ text in the style of your
  input/training data?

### Connection to current LLMs

This counting process is exactly what happens during the "training" phase of
language models:

- **training data**: your paragraph vs trillions of words from the internet
- **learning/training process**: hand counting vs automated counting by
  computers
- **storage**: your paper model vs billions of parameters in memory

The key insight: "training" a language model means counting patterns in text.
Your hand-built model contains the same type of information that current LLMs
store---at a vastly smaller scale.
