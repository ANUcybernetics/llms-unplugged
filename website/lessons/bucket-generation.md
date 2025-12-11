---
title: Bucket Generation
description:
  Use your bucket-based bigram model to generate new text by picking tokens at
  random.
order: 1.2
topic: fundamentals
keyIdea:
  Language models generate text one word at a time by sampling the next word
  according to learned counts.
dependsOn:
  - Bucket Training
---

# Bucket Generation

::: info Lesson Info

This lesson is part of the [Fundamentals](/topics/fundamentals) topic, with
instructions for students (including examples) and
[instructor notes](#instructor-notes). This is an alternative to
[Grid Generation](/lessons/grid-generation) that uses physical tokens and
buckets instead of dice rolls; it's designed to be simpler for younger
audiences, but honestly it's just as fun at a grown-up dinner party.

:::

Use your bucket-based bigram model to generate new text by picking tokens at
random.

![Hero image: Bucket Generation](/assets/images/hero-bucket-generation.avif)

<Prerequisites />

## You will need

- your completed bucket model from _Bucket Training_
- pen and paper for writing down the generated text

## Your goal

Generate new text from your bucket language model. Stretch goal: keep going and
write a whole story.

## Key idea

A language model proposes several possible next words. In the bucket model, each
bucket contains all the tokens that could come next---and some tokens appear
multiple times, making them more likely to be picked. Choosing randomly from a
bucket and repeating the process word by word creates new text.

## Algorithm

1. Choose a starting bucket and write down its label---this is the first word of
   your generated text.
2. Close your eyes and pick a random token from inside that bucket.
3. Write down the token you picked.
4. Put the token back in the bucket (so you can use it again later).
5. Find the bucket whose label matches the token you just picked.
6. Repeat from step 2 until you reach a stopping point (e.g. an empty bucket or
   your desired length).

## See how it works

Before you try generating text yourself with buckets, work through this example
to see the algorithm in action. The written walkthrough and interactive widget
below both demonstrate the same process.

### Worked example

Using the bucket model from the example in _Bucket Training_:

| Bucket label | Tokens inside |
| ------------ | ------------- |
| see          | `spot` `spot` |
| spot         | `run` `jump`  |
| run          | `.`           |
| .            | `see`         |
| jump         | `.`           |

**Generation sequence:**

1. Choose `see` as starting bucket---write down "see"
2. Pick randomly from the "see" bucket---both tokens are `spot`, so we get
   `spot`---write it down
3. Move to the "spot" bucket---pick randomly between `run` and `jump`
4. Let's say we pick `run`---write it down
5. Move to the "run" bucket---only `.` is inside, so we get `.`---write it down
6. Move to the "." bucket---only `see` is inside, so we get `see`---write it
   down
7. Move to the "see" bucket---pick `spot` again---write it down
8. Move to the "spot" bucket---this time let's say we pick `jump`---write it
   down
9. Move to the "jump" bucket---only `.` is inside---write it down
10. The "." bucket still has a token, so we could continue, or stop here

**Generated text:** _"see spot run. see spot jump."_

Notice how the randomness comes from physically picking tokens without looking.
Buckets with more tokens of the same type are more likely to produce that
token---the "see" bucket always produces `spot` because that's all it contains.

### Interactive widget

Step through the generation process at your own pace. Click on a bucket to
select a starting word, then press Play or Step to watch tokens being picked
randomly and text being generated. You can also edit the training text to create
your own model.

<BucketGenerationWidget />

## Instructor notes

### Discussion questions

- how does the starting bucket affect your generated text?
- why might the text sometimes get stuck repeating the same pattern?
- what happens when a bucket only has one token inside?
- why do we put the token back after picking it?
- does the generated text sound like the original training text?

### Connection to current LLMs

This generation process is identical to how current LLMs produce text:

- **sequential generation**: both generate one word at a time
- **probabilistic sampling**: both use weighted random selection---your buckets
  with multiple copies of a token work exactly like probability weights
- **probability distribution**: neural networks output probabilities for all
  50,000+ possible next tokens
- **no planning**: neither looks ahead---just picks the next word
- **variability**: same starting point can produce different outputs due to
  randomness

The fact: sophisticated AI responses emerge from this simple process repeated
thousands of times. Your bucket model demonstrates that language generation is
fundamentally about sampling from learned patterns. The randomness is why LLMs
give different responses to the same prompt and why language models can be
creative rather than repetitive.

### Comparison to dice method

This bucket method and the dice method (see
[Grid Generation](/lessons/grid-generation)) produce equivalent results:

- dice rolls with weighted probabilities select from options based on counts
- bucket picking selects from options where counts are represented by multiple
  physical tokens
- buckets make the probability tangible---a bucket with three `spot` tokens and
  one `run` token gives `spot` a 75% chance, just like weighted dice would

The bucket method avoids the need to calculate percentages or understand dice
mechanics, making it more accessible for younger learners.
