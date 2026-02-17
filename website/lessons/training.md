---
title: Training
description:
  Build a bigram language model that tracks which words follow which other words
  in text.
order: 1
topic: fundamentals
keyIdea:
  Language models learn by counting patterns in text and tracking which words
  follow other words.
---

# Training

<VariantToggle />

Build a bigram language model that tracks which words follow which other words
in text.

<GridOnly>

![Hero image: Grid Training](/assets/images/hero-grid-training.avif)

</GridOnly>

<BucketOnly>

![Hero image: Bucket Training](/assets/images/hero-bucket-training.avif)

</BucketOnly>

<Prerequisites />

## You will need

<GridOnly>

- some text (e.g. a few pages from a kids book, but it can be anything)
- pen, pencil, and grid paper

</GridOnly>

<BucketOnly>

- some text (e.g. a few pages from a kids book, but it can be anything)
- printed or handwritten copy of your text
- scissors
- small containers for buckets (cups, bowls, envelopes, or just labelled areas
  on a table)
- pen and sticky notes or paper for bucket labels

</BucketOnly>

## Your goal

<GridOnly>

Produce a grid that captures the patterns in your input text data. This grid is
your bigram language model. Stretch goal: keep training your model on more input
text.

</GridOnly>

<BucketOnly>

Build a collection of labelled buckets containing tokens from your text. Each
bucket holds the words that can follow its label. This collection of buckets is
your bigram language model.

</BucketOnly>

## Key idea

<GridOnly>

Language models learn by counting patterns in text. Training means building a
model (filling out the grid) to track which words follow other words.

</GridOnly>

<BucketOnly>

Language models learn by counting patterns in text. Training means building a
model that tracks which words follow other words. In this version, the
"following" relationship is captured physically---each bucket contains the
tokens that appeared after its label in the original text.

</BucketOnly>

## Algorithm

<GridOnly>

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

</GridOnly>

<BucketOnly>

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

</BucketOnly>

## Example

Before you try training a model yourself, work through this example to see the
algorithm in action.

<GridOnly>

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

Preprocessed text: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

After the first two words (`see` `spot`) the model looks like:

<LmGrid tokens="see spot" :nrows="6" :ncols="7" />

After the full text the model looks like:

<LmGrid tokens="see spot run . see spot jump . run , spot , run . jump , spot , jump ." />

</GridOnly>

<BucketOnly>

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

</BucketOnly>

## Instructor notes

### Discussion questions

<GridOnly>

- what can you tell about the input text by looking at the filled-out bigram
  model grid?
- how does including punctuation as "words" help with sentence structure?
- are there any other ways you could have written down this exact same model?
- how could you use this model to generate _new_ text in the style of your
  input/training data?

</GridOnly>

<BucketOnly>

- what can you tell about the input text by looking at what's in each bucket?
- why does the "see" bucket have two tokens while "run" only has one?
- how does including punctuation as separate tokens help capture sentence
  structure?
- what would happen if you trained on more text---how would the buckets change?
- how could you use these buckets to generate _new_ text in the style of your
  training data?

</BucketOnly>

### Troubleshooting

<GridOnly>

- **"Do I add a new row/column for every word?"** No---each new word only gets a
  new row and column the first time you see it. After that, just find the
  existing row and column and add a tally mark.

</GridOnly>

<BucketOnly>

- **"Do I make a new bucket every time?"** No---each word only gets a new bucket
  the first time you see it. After that, just find the existing bucket and put
  the next token into it.

</BucketOnly>

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

<BucketOnly>

### Comparison to grid method

This bucket method and the grid method produce equivalent models:

- a tally mark in row X, column Y of the grid corresponds to one token Y inside
  bucket X
- both capture the same "what follows what" relationships
- buckets make the weighting more tangible---you can see and feel that some
  outcomes are more likely because there are literally more tokens to pick from

</BucketOnly>

## Interactive widget

<GridOnly>

Step through the training process at your own pace. Enter your own text or use
the example, then press Play or Step to watch the model being built.

<TrainingWidget initialText="See spot run. See spot jump. Run, Spot, run. Jump, Spot, jump." />

</GridOnly>

<BucketOnly>

Step through the training process at your own pace. Enter your own text or use
the example, then press Play or Step to watch the buckets being filled.

<BucketTrainingWidget />

</BucketOnly>
