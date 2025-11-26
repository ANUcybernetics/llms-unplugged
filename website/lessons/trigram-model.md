---
title: Trigram Model
description:
  Extend the bigram model to use two words of context for better predictions.
order: 5
topic: scaling-up
keyIdea:
  More context improves predictions—trigrams track two previous words, trading
  simplicity for richer patterns.
dependsOn:
  - Basic Training
  - Basic Generation
---

# Trigram Model

::: info Lesson Info
This lesson is part of the [Scaling Up](/topics/scaling-up)
topic, with instructions for students (including examples) and
[instructor notes](#instructor-notes). If you'd like a printable version of the
student handout, [download it here](/assets/pdfs/trigram-model.pdf).
:::

Extend the bigram model to consider two words of context instead of one, leading
to better generation.

![Hero image: Trigram Model](/assets/images/hero-trigram-model.jpg)

## You will need

- the same materials as _Basic Training_
- extra paper for a three-column table
- pen, paper, and dice as per _Basic Generation_

## Your goal

Train a trigram language model (a table, not a grid) and use it to generate
text. Stretch goal: train on more data or generate longer outputs.

## Key idea

Trigrams show how more context boosts prediction quality. They also reveal the
cost: more rows to track and more data needed.

## Algorithm (training)

1. Draw a four-column table: `word1 | word2 | word3 | count`.
2. Slide a window over your text, collecting every overlapping triple of words.
3. For each triple, increment its count (or add a new row starting at 1).

### Example (training)

After the first four words (`see` `spot` `run` `.`) the model is:

| word 1 | word 2 | word 3 | count |
| ------ | ------ | ------ | ----- | --- |
| `see`  | `spot` | `run`  |       |     |
| `spot` | `run`  | `.`    |       |     |

After the full text (`see` `spot` `run` `.` `see` `spot` `jump` `.`) the model
is:

| word 1 | word 2 | word 3 | count |
| ------ | ------ | ------ | ----- | --- |
| `see`  | `spot` | `run`  |       |     |
| `spot` | `run`  | `.`    |       |     |
| `run`  | `.`    | `see`  |       |     |
| `.`    | `see`  | `spot` |       |     |
| `see`  | `spot` | `jump` |       |     |
| `spot` | `jump` | `.`    |       |     |

Note: the order of the rows doesn't matter, so you can re-order to group them by
_word 1_ if that helps.

## Algorithm (generation)

1. Pick any row and write down `word1` and `word2` as your starting words.
2. Find all rows where `word1` and `word2` match your current context; note
   their counts.
3. Roll weighted by those counts to pick a row; take its `word3` as the next
   word.
4. Shift the window by one word (new context is old `word2` + chosen `word3`)
   and repeat from step 2.

This mirrors Basic Generation but with two-word context instead of one.

## Instructor notes

### Discussion questions

- how does the trigram output compare to basic (bigram) model output?
- what happens when you encounter a word pair you've never seen before?
- how many rows would you need for a 100-word text?
- can you find word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

### Connection to current LLMs

The trigram model bridges the gap between simple word-pair models and modern
transformers:

- **context windows**: current models use variable context up to 2 million
  tokens
- **sparse data problem**: with more context, you need exponentially more
  training data

Your trigram model shows why longer context helps—`see` + `spot` predicts `run`
perfectly, while just `spot` could be followed by `run` or `,`. This is why
modern LLMs can maintain coherent conversations over many exchanges—they
consider much more context than just the last word or two.
