---
title: "Basic Training (Building the Model)"
socy_logo: true
prereqs: []
---

## Description

Build a word co-occurence model that tracks which words follow other words in
text. This activity demonstrates how language models "learn" patterns from
training data by counting word transitions.

## You will need

- a short text (e.g. a few pages from a kids book, but can be anything)
- blank matrix (a grid or table for tracking word patterns)
- pen and pencil

## Key idea

Language models learn by counting patterns in text. Training means building a
model (also called a grid or table) that tracks which words follow other
words---transforming text into statistical patterns that can generate new text.

## Algorithm

1. **tokenise and extract vocabulary** from your text:
   - convert everything to lowercase
   - treat commas and full stops as separate tokens (and ignore any other
     punctuation)
2. **create a model** with words on both axes (rows = current word, columns =
   next word)
3. **count transitions**---keep a tally of how many times each word is followed
   by each other word

## Example

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

Tokenised: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,` `spot` `,`
`run` `.` `jump` `,` `spot` `,` `jump` `.`

Vocabulary: `see`, `spot`, `run`, `jump`, `.`, `,`

Model:

|        | `see` | `spot` | `run` | `jump` | `.` | `,` |
| ------ | ----- | ------ | ----- | ------ | --- | --- |
| `see`  |       | 2      |       |        |     |     |
| `spot` |       |        | 2     | 2      |     |     |
| `run`  |       |        |       |        | 2   |     |
| `jump` |       |        |       |        | 2   |     |
| `.`    | 2     |        | 1     | 1      |     |     |
| `,`    |       | 2      |       |        |     |     |

## Discussion questions

- what patterns emerge in your model?
- which words have many possible followers vs just one?
- how does including punctuation as "words" help with sentence structure?
- which words appear most frequently in your training data?
- are there any empty rows? What does that mean?
- how could you use this model to generate _new_ text in the style of your
  input/training data?

## Connection to modern LLMs

This counting process is exactly what happens during the "training" phase of
language models:

- **training data**: your paragraph vs trillions of words from the internet
- **learning/training process**: hand counting vs automated counting by
  computers
- **storage**: your paper model vs billions of parameters in memory

The key insight: "training" a language model means counting patterns in text.
Your hand-built model contains the same type of information that GPT
stores---at a vastly smaller scale.
