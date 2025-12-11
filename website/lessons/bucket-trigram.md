---
title: Bucket Trigram
description:
  Extend the bucket bigram model to use two words of context for better
  predictions.
order: 5.1
topic: scaling-up
keyIdea:
  More context improves predictions---trigrams track two previous words, trading
  simplicity for richer patterns.
dependsOn:
  - Bucket Training
  - Bucket Generation
---

# Bucket Trigram

::: info Lesson Info

This lesson is part of the [Scaling Up](/topics/scaling-up) topic, with
instructions for students (including examples) and
[instructor notes](#instructor-notes). This is an alternative to
[Grid Trigram](/lessons/grid-trigram) that uses physical tokens and buckets
instead of dice rolls; it's designed to be simpler for younger audiences, but
honestly it's just as fun at a grown-up dinner party.

:::

Extend the bucket bigram model to consider two words of context instead of one,
leading to better generation.

![Hero image: Bucket Trigram](/assets/images/hero-bucket-trigram.avif)

<Prerequisites />

## You will need

- the same materials as _Bucket Training_
- additional small containers for two-word label buckets
- sticky notes or paper for bucket labels (you'll need to write two words on
  each label)

## Your goal

Build a trigram language model using buckets where each bucket is labelled with
_two_ words instead of one. Stretch goal: train on more data or generate longer
outputs.

## Key idea

Trigrams show how more context boosts prediction quality. Instead of asking
"what follows this word?", we ask "what follows these _two_ words?". This means
more buckets to manage, but better predictions.

## Algorithm (training)

1. **Prepare your tokens** as per _Bucket Training_

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

## Algorithm (generation)

1. Choose a starting bucket and write down its two-word label---these are the
   first two words of your generated text.
2. Close your eyes and pick a random token from inside that bucket.
3. Write down the token you picked.
4. Put the token back in the bucket.
5. Find the bucket whose label matches your last _two_ words (the second word of
   your old label + the token you just picked).
6. Repeat from step 2 until you reach a stopping point.

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

## Instructor notes

### Discussion questions

- how does the trigram output compare to basic (bigram) bucket model output?
- why do we need more buckets for trigrams than bigrams?
- what happens when you encounter a word pair you've never seen before?
- can you find two-word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

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

### Comparison to grid method

This bucket method and the grid method (see
[Grid Trigram](/lessons/grid-trigram)) produce equivalent models:

- a count in the grid's table corresponds to tokens inside a two-word bucket
- both capture the same "what follows these two words" relationships
- buckets make the weighting more tangible---you can see and feel that some
  outcomes are more likely because there are literally more tokens to pick from
