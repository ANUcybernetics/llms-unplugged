---
title: Trigram
description:
  Extend the bigram model to use two words of context for better predictions.
order: 5
topic: scaling-up
keyIdea:
  More context improves predictions---trigrams track two previous words, trading
  simplicity for richer patterns.
---

# Trigram

<VariantToggle />

Extend the bigram model to consider two words of context instead of one, leading
to better generation.

<GridOnly>

![Hero image: Grid Trigram](/assets/images/hero-grid-trigram.avif)

</GridOnly>

<BucketOnly>

![Hero image: Bucket Trigram](/assets/images/hero-bucket-trigram.avif)

</BucketOnly>

<Prerequisites />

## You will need

<GridOnly>

- the same materials as [Training](/lessons/training)
- extra paper for a three-column table
- pen, paper, and dice as per [Generation](/lessons/generation)

</GridOnly>

<BucketOnly>

- the same materials as [Training](/lessons/training)
- additional small containers for two-word label buckets
- sticky notes or paper for bucket labels (you'll need to write two words on
  each label)

</BucketOnly>

## Your goal

<GridOnly>

Train a trigram language model (a table, not a grid) and use it to generate
text. Stretch goal: train on more data or generate longer outputs.

</GridOnly>

<BucketOnly>

Build a trigram language model using buckets where each bucket is labelled with
_two_ words instead of one. Stretch goal: train on more data or generate longer
outputs.

</BucketOnly>

## Key idea

<GridOnly>

Trigrams show how more context boosts prediction quality. They also reveal the
cost: more rows to track and more data needed.

</GridOnly>

<BucketOnly>

Trigrams show how more context boosts prediction quality. Instead of asking
"what follows this word?", we ask "what follows these _two_ words?". This means
more buckets to manage, but better predictions.

</BucketOnly>

## Algorithm (training)

<GridOnly>

1. Draw a four-column table: `word1 | word2 | word3 | count`.
2. Slide a window over your text, collecting every overlapping triple of words.
3. For each triple, increment its count (or add a new row starting at 1).

### Example (training)

After the first four words (`see` `spot` `run` `.`) the model is:

| word 1 | word 2 | word 3 | count |
| ------ | ------ | ------ | ----- |
| `see`  | `spot` | `run`  | 1     |
| `spot` | `run`  | `.`    | 1     |

After the full text (`see` `spot` `run` `.` `see` `spot` `jump` `.`) the model
is:

| word 1 | word 2 | word 3 | count |
| ------ | ------ | ------ | ----- |
| `see`  | `spot` | `run`  | 1     |
| `spot` | `run`  | `.`    | 1     |
| `run`  | `.`    | `see`  | 1     |
| `.`    | `see`  | `spot` | 1     |
| `see`  | `spot` | `jump` | 1     |
| `spot` | `jump` | `.`    | 1     |

Note: the order of the rows doesn't matter, so you can re-order to group them by
_word 1_ if that helps.

</GridOnly>

<BucketOnly>

1. **Prepare your tokens** as per [Training](/lessons/training)
   - print or write out your training text
   - convert everything to lowercase
   - treat words, commas, and full stops as separate tokens
   - cut the text into individual tokens with scissors, keeping them in order

2. **Build the model** using word _pairs_ as bucket labels
   - take the first _two_ tokens from your pile---these form your bucket label
   - if a bucket with this two-word label doesn't exist, create one
   - take the _third_ token and put it in this bucket
   - shift along by one word (so your new pair is the old second word + the
     third word you just placed)
   - repeat until all tokens are in buckets

### Example (training)

Original text: _"See Spot run. See Spot jump."_

After preparing tokens, you have these pieces of paper in order: `see` `spot`
`run` `.` `see` `spot` `jump` `.`

**Step by step:**

1. First two tokens are `see` and `spot`---create a bucket labelled "see spot"
2. Third token is `run`---put it in the "see spot" bucket
3. Shift along: new pair is `spot` + `run`---create bucket labelled "spot run"
4. Next token is `.`---put it in the "spot run" bucket
5. Shift along: new pair is `run` + `.`---create bucket labelled "run ."
6. Next token is `see`---put it in the "run ." bucket
7. Shift along: new pair is `.` + `see`---create bucket labelled ". see"
8. Next token is `spot`---put it in the ". see" bucket
9. Shift along: new pair is `see` + `spot`---bucket already exists
10. Next token is `jump`---put it in the "see spot" bucket
11. Shift along: new pair is `spot` + `jump`---create bucket labelled "spot
    jump"
12. Next token is `.`---put it in the "spot jump" bucket
13. No more tokens---training complete!

**Final model (bucket contents):**

| Bucket label | Tokens inside |
| ------------ | ------------- |
| see spot     | `run` `jump`  |
| spot run     | `.`           |
| run .        | `see`         |
| . see        | `spot`        |
| spot jump    | `.`           |

Notice that "see spot" has two tokens because two different words followed that
pair in the original text. Compare this to the bigram bucket model where the
"see" bucket would just contain `spot` `spot`---the trigram model captures more
specific patterns.

</BucketOnly>

## Algorithm (generation)

<GridOnly>

1. Pick any row and write down `word1` and `word2` as your starting words.
2. Find all rows where `word1` and `word2` match your current context; note
   their counts.
3. Roll weighted by those counts to pick a row; take its `word3` as the next
   word.
4. Shift the window by one word (new context is old `word2` + chosen `word3`)
   and repeat from step 2.

This mirrors [Generation](/lessons/generation) but with two-word context instead
of one.

</GridOnly>

<BucketOnly>

1. choose a starting bucket and write down its two-word label---these are the
   first two words of your generated text.
2. close your eyes and pick a random token from inside that bucket
3. write down the token you picked
4. put the token back in the bucket
5. find the bucket whose label matches your last _two_ words (the second word of
   your old label + the token you just picked)
6. if no bucket exists for that two-word pair, the model never saw this
   combination during training---pick a different bucket with the _first_ word
   of your two-word pair and continue from there
7. repeat from step 2 until you reach a stopping point

### Example (generation)

Using the bucket model from above:

1. Choose "see spot" as starting bucket---write down "see spot"
2. Pick randomly from the "see spot" bucket---get either `run` or `jump`
3. Let's say we pick `run`---write it down
4. Put `run` back, find bucket "spot run"
5. Pick from "spot run"---only `.` is inside---write it down
6. Find bucket "run ."---pick `see`---write it down
7. Find bucket ". see"---pick `spot`---write it down
8. Find bucket "see spot"---this time pick `jump`---write it down
9. Find bucket "spot jump"---pick `.`---write it down
10. Continue or stop here

**Generated text:** _"see spot run. see spot jump."_

</BucketOnly>

## Instructor notes

### Discussion questions

<GridOnly>

- how does the trigram output compare to basic (bigram) model output?
- what happens when you encounter a word pair you've never seen before?
- how many rows would you need for a 100-word text?
- can you find word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

</GridOnly>

<BucketOnly>

- how does the trigram output compare to basic (bigram) bucket model output?
- why do we need more buckets for trigrams than bigrams?
- what happens when you encounter a word pair you've never seen before?
- can you find two-word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

</BucketOnly>

### Connection to current LLMs

The trigram model bridges the gap between simple word-pair models and modern
transformers:

- **context windows**: current models use variable context up to 2 million
  tokens
- **sparse data problem**: with more context, you need exponentially more
  training data

Your trigram model shows why longer context helps---"see spot" predicts either
`run` or `jump`, while just "spot" in a bigram model could be followed by many
different words. This is why modern LLMs can maintain coherent conversations
over many exchanges---they consider much more context than just the last word or
two.

<BucketOnly>

### Comparison to grid method

This bucket method and the grid method produce equivalent models:

- a count in the grid's table corresponds to tokens inside a two-word bucket
- both capture the same "what follows these two words" relationships
- buckets make the weighting more tangible---you can see and feel that some
  outcomes are more likely because there are literally more tokens to pick from

</BucketOnly>
