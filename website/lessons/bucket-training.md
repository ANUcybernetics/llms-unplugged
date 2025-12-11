---
title: Bucket Training
description:
  Build a bigram language model using physical tokens and buckets to track which
  words follow which other words.
order: 1.1
topic: fundamentals
keyIdea:
  Language models learn by counting patterns in text and tracking which words
  follow other words.
dependsOn: []
---

# Bucket Training

::: info Lesson Info

This lesson is part of the [Fundamentals](/topics/fundamentals) topic, with
instructions for students (including examples) and
[instructor notes](#instructor-notes). This is an alternative to
[Grid Training](/lessons/grid-training) that uses physical tokens and buckets
instead of a grid; it's designed to be simpler for younger audiences, but
honestly it's just as fun at a grown-up dinner party.

:::

Build a bigram language model using physical tokens and buckets to track which
words follow which other words in text.

![Hero image: Bucket Training](/assets/images/hero-bucket-training.avif)

<Prerequisites />

## You will need

- some text (e.g. a few pages from a kids book, but it can be anything)
- printed or handwritten copy of your text
- scissors
- small containers for buckets (cups, bowls, envelopes, or just labelled areas
  on a table)
- pen and sticky notes or paper for bucket labels

## Your goal

Build a collection of labelled buckets containing tokens from your text. Each
bucket holds the words that can follow its label. This collection of buckets is
your bigram language model.

## Key idea

Language models learn by counting patterns in text. Training means building a
model that tracks which words follow other words. In this version, the
"following" relationship is captured physically---each bucket contains the
tokens that appeared after its label in the original text.

## Algorithm

1. **Prepare your tokens**
   - print or write out your training text
   - convert everything to lowercase
   - treat words, commas, and full stops as separate tokens (ignore other
     punctuation and whitespace)
   - cut the text into individual tokens with scissors, keeping them in order

2. **Build the model** one token at a time, starting with the first
   - if this token doesn't have a bucket yet, create one and label it with this
     word
   - take the _next_ token from your pile and put it _into_ the current token's
     bucket
   - now apply the same process to that next token (create its bucket if needed)
   - repeat until all tokens are in buckets

## Example

Original text: _"See Spot run. See Spot jump."_

After preparing tokens, you have these pieces of paper in order: `see` `spot`
`run` `.` `see` `spot` `jump` `.`

**Step by step:**

1. First token is `see`---create a bucket labelled "see"
2. Next token is `spot`---put it in the "see" bucket
3. Current token is now `spot`---create a bucket labelled "spot"
4. Next token is `run`---put it in the "spot" bucket
5. Current token is now `run`---create a bucket labelled "run"
6. Next token is `.`---put it in the "run" bucket
7. Current token is now `.`---create a bucket labelled "."
8. Next token is `see`---put it in the "." bucket
9. Current token is now `see`---bucket already exists
10. Next token is `spot`---put it in the "see" bucket
11. Current token is now `spot`---bucket already exists
12. Next token is `jump`---put it in the "spot" bucket
13. Current token is now `jump`---create a bucket labelled "jump"
14. Next token is `.`---put it in the "jump" bucket
15. No more tokens---training complete!

**Final model (bucket contents):**

| Bucket label | Tokens inside |
| ------------ | ------------- |
| see          | `spot` `spot` |
| spot         | `run` `jump`  |
| run          | `.`           |
| .            | `see`         |
| jump         | `.`           |

Notice that the "see" bucket contains two `spot` tokens because "spot" followed
"see" twice in the original text. This captures the same information as a grid
with tally marks, but in a physical form you can touch and manipulate.

## Try it yourself

Use the interactive widget below to see how the bucket training process works
step-by-step. Enter your own text or use the example, then press Play or Step to
watch the buckets being filled.

<BucketTrainingWidget />

## Instructor notes

### Discussion questions

- what can you tell about the input text by looking at what's in each bucket?
- why does the "see" bucket have two tokens while "run" only has one?
- how does including punctuation as separate tokens help capture sentence
  structure?
- what would happen if you trained on more text---how would the buckets change?
- how could you use these buckets to generate _new_ text in the style of your
  training data?

### Connection to current LLMs

This physical process is exactly what happens during the "training" phase of
language models:

- **training data**: your paragraph vs trillions of words from the internet
- **learning/training process**: hand sorting vs automated counting by computers
- **storage**: your buckets vs billions of parameters in memory

The key insight: "training" a language model means capturing patterns of which
words follow which. Your bucket model contains the same type of information that
current LLMs store---at a vastly smaller scale.

### Comparison to grid method

This bucket method and the grid method (see
[Grid Training](/lessons/grid-training)) produce equivalent models:

- a tally mark in row X, column Y of the grid corresponds to one token Y inside
  bucket X
- both capture the same "what follows what" relationships
- buckets make the weighting more tangible---you can see and feel that some
  outcomes are more likely because there are literally more tokens to pick from
